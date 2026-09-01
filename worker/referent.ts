/**
 * A small MCP client — just enough to hand one lead to Referent, and no more.
 *
 * `https://mcp.referent.law/mcp` speaks the Model Context Protocol over
 * streamable HTTP. It is not a form-post webhook, and three consequences of
 * that are the whole reason leads cannot go straight from the browser:
 *
 *   1. It is a JSON-RPC conversation, not a single POST. A session has to be
 *      opened with `initialize` before any tool can be called.
 *   2. It needs a credential, and a credential in a static page is a public
 *      credential. This one opens the CRM.
 *   3. A browser would additionally need Referent to allow this site's origin
 *      by CORS, which is not something this end can arrange.
 *
 * So the call is made from the Worker, where the token lives as a secret.
 *
 * ## Why this adapts to the schema instead of hard-coding field names
 *
 * The tool Referent exposes for creating a contact — its name, and the exact
 * spelling of its arguments — could not be read while this was written; the
 * host is not reachable from the build environment. Rather than guess once and
 * ship something that fails silently in production, the client asks the server
 * what it offers (`tools/list`), reads the JSON Schema that comes back, and
 * maps the four fields the form collects onto whatever that schema actually
 * calls them. `firstName`, `first_name` and `givenName` all get filled the
 * same way.
 *
 * If the guessing is ever unwelcome, set `REFERENT_LEAD_TOOL` and the
 * discovery step only resolves the schema instead of also choosing the tool.
 * `GET /api/lead/tools` prints what the live server reports, which is the
 * fastest way to learn the real name.
 */

/** Exactly what the capture form collects. Nothing about the dispute. */
export interface Lead {
  first_name: string;
  email: string;
  /** Optional, and in E.164 by the time it gets here. May be empty. */
  phone: string;
  /** Whether the texting box was ticked. No box, no text — see notify.ts. */
  sms_consent: boolean;
  timeframe: string;
  topic: string;
  source_page: string;
  source_url: string;
  captured_at: string;
}

export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: JsonSchema;
}

export interface JsonSchema {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  enum?: unknown[];
  description?: string;
  additionalProperties?: boolean | JsonSchema;
}

/** The protocol revision this client is written against. */
const PROTOCOL_VERSION = "2025-06-18";

/** A lead is small; a reply this large means something has gone wrong. */
const MAX_REPLY_BYTES = 256 * 1024;

export class ReferentError extends Error {
  readonly stage: string;

  constructor(stage: string, message: string) {
    super(message);
    this.name = "ReferentError";
    this.stage = stage;
  }
}

interface JsonRpcMessage {
  jsonrpc?: string;
  id?: number | string | null;
  result?: unknown;
  error?: { code?: number; message?: string; data?: unknown };
}

/**
 * One MCP session. Short-lived by design: opened for a single lead, closed
 * straight after. A solo practice does not submit enough forms for connection
 * reuse to be worth the state it would cost.
 */
export class ReferentClient {
  private readonly url: string;
  private readonly token: string;
  private sessionId: string | null = null;
  private nextId = 1;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  /** `initialize`, then the `initialized` notification the spec requires. */
  async open(): Promise<void> {
    const res = await this.post({
      jsonrpc: "2.0",
      id: this.nextId++,
      method: "initialize",
      params: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: "prosefairplaymediation-site", version: "1.0.0" },
      },
    });

    // The session id, when the server issues one, must be echoed on every
    // later request or they are treated as unauthenticated strangers.
    this.sessionId = res.headers.get("mcp-session-id");

    const msg = await readJsonRpc(res, 1);
    if (!res.ok) {
      throw new ReferentError(
        "initialize",
        `HTTP ${res.status}${msg?.error?.message ? ` — ${msg.error.message}` : ""}`,
      );
    }
    if (msg?.error) {
      throw new ReferentError("initialize", msg.error.message || "rejected");
    }
    // A 200 with no readable reply is not a session. Letting it through here
    // would push the failure to the next call, where it reads as the tool
    // list being empty rather than as the handshake never landing.
    if (!msg?.result) {
      throw new ReferentError("initialize", "no usable handshake reply");
    }

    // A notification carries no id and expects no reply beyond 202.
    await this.post({ jsonrpc: "2.0", method: "notifications/initialized" });
  }

  async listTools(): Promise<McpTool[]> {
    const result = await this.request("tools/list", {});
    const tools = (result as { tools?: McpTool[] } | null)?.tools;
    if (!Array.isArray(tools)) {
      throw new ReferentError("tools/list", "server returned no tool list");
    }
    return tools;
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    const result = await this.request("tools/call", { name, arguments: args });

    // A tool that fails reports it inside a successful JSON-RPC result, so a
    // 200 alone does not mean the contact was created.
    const asRecord = result as { isError?: boolean; content?: unknown } | null;
    if (asRecord?.isError) {
      throw new ReferentError("tools/call", describeContent(asRecord.content));
    }
    return result;
  }

  /** Best effort. A leaked session expires on its own; a lost lead does not. */
  async close(): Promise<void> {
    if (!this.sessionId) return;
    try {
      await fetch(this.url, {
        method: "DELETE",
        headers: {
          "Mcp-Session-Id": this.sessionId,
          Authorization: `Bearer ${this.token}`,
        },
      });
    } catch {
      /* ignore */
    }
  }

  private async request(method: string, params: unknown): Promise<unknown> {
    const id = this.nextId++;
    const res = await this.post({ jsonrpc: "2.0", id, method, params });
    const msg = await readJsonRpc(res, id);

    if (!res.ok) {
      throw new ReferentError(
        method,
        `HTTP ${res.status}${msg?.error?.message ? ` — ${msg.error.message}` : ""}`,
      );
    }
    if (msg?.error) {
      throw new ReferentError(method, msg.error.message || "rejected");
    }
    if (!msg) {
      throw new ReferentError(method, "no response from server");
    }
    return msg.result ?? null;
  }

  private post(body: unknown): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      // Both are required by the streamable-HTTP transport: a server may
      // answer with a plain JSON body or with an SSE stream, at its choice.
      Accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": PROTOCOL_VERSION,
      Authorization: `Bearer ${this.token}`,
    };
    if (this.sessionId) headers["Mcp-Session-Id"] = this.sessionId;

    return fetch(this.url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  }
}

/**
 * Read one JSON-RPC reply, whichever of the two shapes it arrives in.
 *
 * For an SSE stream the body is read incrementally and abandoned as soon as
 * the reply with the matching id turns up: some servers hold the stream open
 * afterwards for server-initiated messages, and waiting for such a stream to
 * end would hang the form submission.
 */
async function readJsonRpc(
  res: Response,
  id: number,
): Promise<JsonRpcMessage | null> {
  const contentType = (res.headers.get("content-type") || "").toLowerCase();

  if (!contentType.includes("text/event-stream")) {
    if (res.status === 202 || res.status === 204) return null;
    const text = await res.text();
    if (!text.trim()) return null;
    try {
      return JSON.parse(text) as JsonRpcMessage;
    } catch {
      return { error: { message: truncate(text, 200) } };
    }
  }

  const reader = res.body?.getReader();
  if (!reader) return null;

  const decoder = new TextDecoder();
  let buffered = "";
  let read = 0;
  let dataLines: string[] = [];

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;

      read += value.byteLength;
      if (read > MAX_REPLY_BYTES) {
        throw new ReferentError("transport", "reply exceeded size limit");
      }
      buffered += decoder.decode(value, { stream: true });

      let newline: number;
      while ((newline = buffered.indexOf("\n")) !== -1) {
        const line = buffered.slice(0, newline).replace(/\r$/, "");
        buffered = buffered.slice(newline + 1);

        // A blank line ends an event; its data lines are one JSON document.
        if (line === "") {
          if (dataLines.length) {
            const parsed = tryParse(dataLines.join("\n"));
            dataLines = [];
            // Only the reply to this request ends the read. A server is free
            // to push notifications down the same stream, and those carry no
            // id — mistaking one for the answer would drop the real reply.
            if (parsed && parsed.id === id) return parsed;
          }
          continue;
        }
        if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).replace(/^ /, ""));
        }
        // `event:`, `id:` and `:` keepalive lines carry nothing this needs.
      }
    }

    // A stream that closed without a trailing blank line still holds a reply.
    if (dataLines.length) return tryParse(dataLines.join("\n"));
    return null;
  } finally {
    try {
      await reader.cancel();
    } catch {
      /* the stream is already gone */
    }
  }
}

function tryParse(text: string): JsonRpcMessage | null {
  try {
    return JSON.parse(text) as JsonRpcMessage;
  } catch {
    return null;
  }
}

/** MCP tool errors come back as content blocks, not as a string. */
function describeContent(content: unknown): string {
  if (typeof content === "string") return truncate(content, 300);
  if (Array.isArray(content)) {
    const text = content
      .map((block) =>
        block && typeof block === "object" && "text" in block
          ? String((block as { text: unknown }).text)
          : "",
      )
      .filter(Boolean)
      .join(" ");
    if (text) return truncate(text, 300);
  }
  return "the tool reported an error";
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/* -------------------------------------------------------------------------
 * Choosing the tool, and filling in its arguments
 * ---------------------------------------------------------------------- */

/** Words that suggest a tool writes a new person into the CRM. */
const SUBJECT_WORDS = ["lead", "contact", "person", "client", "intake", "inquiry", "prospect"];
const VERB_WORDS = ["create", "add", "new", "capture", "submit", "upsert", "record"];

/**
 * Pick the tool most likely to create a contact.
 *
 * Deliberately conservative: a tool has to look like both a verb and a
 * subject to be considered at all, so a `delete_contact` or a `search_leads`
 * cannot be chosen by accident. Returning nothing is a valid answer, and the
 * caller turns it into a visible error rather than a silent no-op.
 */
export function pickLeadTool(tools: McpTool[]): McpTool | null {
  let best: McpTool | null = null;
  let bestScore = 0;

  for (const tool of tools) {
    const name = (tool.name || "").toLowerCase();
    const haystack = `${name} ${(tool.description || "").toLowerCase()}`;

    const subject = SUBJECT_WORDS.find((word) => name.includes(word))
      ? 2
      : SUBJECT_WORDS.find((word) => haystack.includes(word))
        ? 1
        : 0;
    if (!subject) continue;

    const verb = VERB_WORDS.find((word) => name.includes(word))
      ? 2
      : VERB_WORDS.find((word) => haystack.includes(word))
        ? 1
        : 0;
    if (!verb) continue;

    // Prefer the plainest name among equals: `create_lead` over
    // `create_lead_from_import_batch`.
    const score = subject * 10 + verb * 5 - Math.min(name.length / 10, 4);
    if (score > bestScore) {
      best = tool;
      bestScore = score;
    }
  }

  return best;
}

interface AliasGroup {
  keys: string[];
  value: (lead: Lead, annotations: string[]) => string;
}

/** Normalized so `firstName`, `first_name` and `first name` all match. */
const normalize = (key: string): string => key.toLowerCase().replace(/[\s_-]/g, "");

const ALIASES: AliasGroup[] = [
  {
    keys: ["email", "emailaddress", "primaryemail", "contactemail", "workemail"],
    value: (lead) => lead.email,
  },
  {
    keys: ["firstname", "givenname", "forename", "fname"],
    value: (lead) => lead.first_name,
  },
  {
    // The form asks for a first name only, on purpose. A CRM that insists on
    // a surname gets told plainly that there isn't one rather than a guess.
    keys: ["lastname", "familyname", "surname", "lname"],
    value: () => "(not provided)",
  },
  {
    keys: ["name", "fullname", "displayname", "contactname", "clientname", "leadname"],
    value: (lead) => lead.first_name,
  },
  {
    keys: ["phone", "phonenumber", "mobile", "mobilenumber", "cell", "cellphone", "telephone", "tel"],
    value: (lead) => lead.phone,
  },
  {
    keys: [
      "notes", "note", "message", "description", "comments", "comment",
      "summary", "details", "body", "inquiry", "content",
    ],
    value: buildNote,
  },
  {
    keys: ["source", "leadsource", "origin", "channel", "referralsource", "utmsource", "via"],
    value: () => "Website — prosefairplaymediation.com",
  },
  {
    keys: ["sourceurl", "url", "pageurl", "landingpage", "referrer", "referer", "website"],
    value: (lead) => lead.source_url,
  },
  {
    keys: ["timeframe", "timeline", "urgency", "when", "timing"],
    value: (lead) => lead.timeframe,
  },
  {
    keys: ["subject", "topic", "reason", "matter", "about"],
    value: (lead) => lead.topic || lead.timeframe,
  },
  {
    keys: ["capturedat", "createdat", "submittedat", "date", "timestamp"],
    value: (lead) => lead.captured_at,
  },
];

/** Everything the CRM is allowed to hold, in one readable block. */
function buildNote(lead: Lead, annotations: string[]): string {
  const lines = [
    `Submitted through prosefairplaymediation.com`,
    `Timeframe: ${lead.timeframe || "not given"}`,
  ];
  if (lead.topic) lines.push(`In their words: ${lead.topic}`);
  lines.push(`Page: ${lead.source_page}`);
  lines.push(`Captured: ${lead.captured_at}`);

  // Texting consent is recorded here, with its timestamp, because the record
  // of it is the defence if it is ever questioned. "No consent" is recorded
  // just as explicitly: it is an instruction not to text this person.
  if (lead.phone) {
    lines.push(
      lead.sms_consent
        ? `Texting consent: GIVEN ${lead.captured_at} — "${SMS_CONSENT_WORDING}"`
        : `Texting consent: NOT GIVEN — call this number, do not text it.`,
    );
  }

  for (const annotation of annotations) lines.push(annotation);
  return lines.join("\n");
}

/**
 * The wording shown beside the consent box, repeated here so the CRM note
 * records what was actually agreed to. Kept in step with notify.ts and with
 * the form; change all three together or the record is worthless.
 */
const SMS_CONSENT_WORDING =
  "Text me at this number about my inquiry. Message and data rates may apply. " +
  "Reply STOP at any time to stop.";

/** Free-form bags a schema may offer for anything it does not model. */
const CATCH_ALL_KEYS = ["customfields", "custom", "fields", "metadata", "meta", "data", "attributes", "extra"];

/**
 * Build the argument object for a tool from its own schema.
 *
 * Only properties the schema declares are sent. A CRM API that rejects
 * unknown keys is common enough that shotgunning every alias would be a
 * reliable way to fail on the first real lead.
 */
export function buildArguments(
  schema: JsonSchema | undefined,
  lead: Lead,
  /** Extra lines for the note — the personal-review flag, in practice. */
  annotations: string[] = [],
): Record<string, unknown> {
  const properties = schema?.properties;

  // No schema, or a schema that declares nothing: send the plain payload and
  // let the server take what it recognizes.
  if (!properties || !Object.keys(properties).length) {
    return { ...lead, notes: buildNote(lead, annotations) };
  }

  return fill(properties, schema?.required ?? [], lead, annotations, 0);
}

function fill(
  properties: Record<string, JsonSchema>,
  required: string[],
  lead: Lead,
  annotations: string[],
  depth: number,
): Record<string, unknown> {
  const args: Record<string, unknown> = {};
  const isRequired = new Set(required.map(normalize));

  for (const [key, property] of Object.entries(properties)) {
    const normalized = normalize(key);
    const type = Array.isArray(property.type) ? property.type[0] : property.type;

    // A nested object — `{ contact: { firstName, email } }` — is filled from
    // the same lead. One level of nesting covers every shape seen in the wild;
    // deeper than that is guesswork with a worse failure mode.
    if (type === "object" && property.properties && depth < 2) {
      const nested = fill(property.properties, property.required ?? [], lead, annotations, depth + 1);
      if (Object.keys(nested).length) args[key] = nested;
      continue;
    }

    // A free-form bag: give it everything, since nothing else can be lost.
    if (type === "object" && CATCH_ALL_KEYS.includes(normalized)) {
      args[key] = { ...lead };
      continue;
    }

    const alias = ALIASES.find((group) => group.keys.includes(normalized));
    if (alias) {
      const value = alias.value(lead, annotations);
      if (value) {
        args[key] = coerce(value, property);
        continue;
      }
      // Known field, nothing to put in it — an optional mobile number, say.
      if (!isRequired.has(normalized)) continue;
    }

    // Either nothing to say about this field, or nothing to say and the schema
    // insists. Send something valid rather than let the whole lead bounce.
    if (isRequired.has(normalized)) {
      args[key] = placeholder(property);
    }
  }

  return args;
}

function coerce(value: string, property: JsonSchema): unknown {
  // A field with a fixed vocabulary takes the closest listed value, not ours.
  if (Array.isArray(property.enum) && property.enum.length) {
    const match = property.enum.find(
      (option) => typeof option === "string" && option.toLowerCase() === value.toLowerCase(),
    );
    return match ?? property.enum[0];
  }

  const type = Array.isArray(property.type) ? property.type[0] : property.type;
  if (type === "array") return [value];
  return value;
}

function placeholder(property: JsonSchema): unknown {
  if (Array.isArray(property.enum) && property.enum.length) return property.enum[0];

  const type = Array.isArray(property.type) ? property.type[0] : property.type;
  switch (type) {
    case "boolean":
      return false;
    case "number":
    case "integer":
      return 0;
    case "array":
      return [];
    case "object":
      return {};
    default:
      return "Not provided";
  }
}
