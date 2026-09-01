/**
 * The site's only server-side code.
 *
 * Everything under this Worker is still the same static Astro build served
 * from `./dist` — Cloudflare serves an asset without invoking this file at
 * all. The one exception is `/api/*`, which exists so that the capture form
 * can reach Referent (the CRM) without the CRM's credential being published
 * in a page anyone can view-source.
 *
 * Routes:
 *   POST /api/lead        the capture form posts here; creates the contact
 *   GET  /api/lead/tools  what the live Referent server reports it can do,
 *                         gated behind REFERENT_DEBUG_KEY (see below)
 *
 * Secrets, set with `wrangler secret put <name>` or in the Cloudflare
 * dashboard under Settings → Variables and Secrets. None of them are in the
 * repository and none of them reach the browser:
 *
 *   REFERENT_API_TOKEN   required. Sent as `Authorization: Bearer …`.
 *   REFERENT_MCP_URL     optional. Defaults to https://mcp.referent.law/mcp
 *   REFERENT_LEAD_TOOL   optional. The exact tool name to call. Leave unset
 *                        and the Worker picks the tool that looks like
 *                        "create a contact"; set it once the real name is
 *                        known from /api/lead/tools, which is one fewer thing
 *                        to go wrong at 2am.
 *   REFERENT_DEBUG_KEY   optional. Enables the diagnostic route above; the
 *                        route 404s while it is unset.
 *
 * If REFERENT_API_TOKEN is missing, or Referent is down, or the tool call is
 * rejected, this returns a non-2xx. That is deliberate and load-bearing: the
 * browser then falls back to opening the visitor's mail client, exactly as
 * the site did before any CRM existed. A lead is never dropped on the floor
 * because a third party had a bad afternoon.
 */
import {
  ReferentClient,
  ReferentError,
  buildArguments,
  pickLeadTool,
  type JsonSchema,
  type Lead,
  type McpTool,
} from "./referent.ts";
import { notify, screen, toE164, type NotifyEnv, type Screen } from "./notify.ts";

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

/** Cloudflare hands this in; only `waitUntil` is used here. */
interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

export interface Env extends NotifyEnv {
  ASSETS: Fetcher;
  REFERENT_API_TOKEN?: string;
  REFERENT_MCP_URL?: string;
  REFERENT_LEAD_TOOL?: string;
  REFERENT_DEBUG_KEY?: string;
}

const DEFAULT_MCP_URL = "https://mcp.referent.law/mcp";

/** Hosts allowed to post a lead. Anything else is somebody else's form. */
const ALLOWED_ORIGINS = [
  "https://prosefairplaymediation.com",
  "https://www.prosefairplaymediation.com",
  "http://localhost:4321",
  "http://127.0.0.1:4321",
];

/** A real submission is a few hundred bytes. */
const MAX_BODY_BYTES = 4096;

/** Same cap the form's `maxlength` sets, enforced where it cannot be edited. */
const MAX_TOPIC = 140;

export default {
  async fetch(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/lead") {
      return handleLead(request, env, ctx);
    }
    if (url.pathname === "/api/lead/tools") {
      return handleTools(request, env);
    }

    // Not an API path, so it is the static site. Assets are normally served
    // before this Worker runs; reaching here means nothing matched, and the
    // asset handler produces the same 404 it always did.
    return env.ASSETS.fetch(request);
  },
};

async function handleLead(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
  if (request.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405, { Allow: "POST" });
  }

  // Browsers attach Origin to every cross-origin POST. No CORS headers are
  // returned anywhere in this file, so a foreign page could not read the
  // reply in any case — this just declines to do the work.
  const origin = request.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return json({ ok: false, error: "forbidden_origin" }, 403);
  }

  const body = await readJsonBody(request);
  if (!body) {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  // Honeypot. The field is hidden from people and from screen readers; a bot
  // filling in every input it finds gets a cheerful 200 and goes away.
  if (typeof body["company"] === "string" && body["company"].trim()) {
    return json({ ok: true, skipped: true });
  }

  const lead = validate(body);
  if (!lead) {
    return json({ ok: false, error: "invalid_lead" }, 422);
  }

  const token = env.REFERENT_API_TOKEN;
  if (!token) {
    // Not configured yet. Say so honestly and let the page fall back to mail.
    console.error("lead: REFERENT_API_TOKEN is not set");
    return json({ ok: false, error: "crm_not_configured" }, 503);
  }

  // Run before anything is sent anywhere. An inquiry that mentions abuse, an
  // injunction or a threat gets a person, never an automated reply — the rule
  // is set out in docs/marketing/lead-automation.md and enforced in notify.ts.
  const flagged: Screen = screen(lead);

  try {
    const toolName = await deliver(env, token, lead, flagged);
    console.log(
      `lead: created via ${toolName} from ${lead.source_page}` +
        (flagged.personalReview ? ` — FLAGGED for personal review (${flagged.reason})` : ""),
    );

    // The visitor is answered as soon as the contact exists. Texts and emails
    // go out after that, so a slow provider never holds up the form, and a
    // dead one never turns a captured lead into an error.
    const messages = notify(env, lead, flagged);
    if (ctx) ctx.waitUntil(messages);
    else await messages;

    return json({ ok: true });
  } catch (error) {
    const stage = error instanceof ReferentError ? error.stage : "unknown";
    const message = error instanceof Error ? error.message : String(error);
    // Logged, not returned: the visitor gets the mail fallback, and the
    // detail belongs in `wrangler tail` rather than in a page.
    console.error(`lead: delivery failed at ${stage} — ${message}`);
    return json({ ok: false, error: "crm_unavailable" }, 502);
  }
}

/** Open a session, find the tool, call it. Returns the tool used. */
async function deliver(env: Env, token: string, lead: Lead, flagged: Screen): Promise<string> {
  const client = new ReferentClient(env.REFERENT_MCP_URL || DEFAULT_MCP_URL, token);

  try {
    await client.open();

    const tools = await client.listTools();
    const configured = env.REFERENT_LEAD_TOOL?.trim();

    let tool: McpTool | null;
    if (configured) {
      tool = tools.find((candidate) => candidate.name === configured) ?? null;
      if (!tool) {
        throw new ReferentError(
          "tools/list",
          `REFERENT_LEAD_TOOL is "${configured}" but the server offers: ${
            tools.map((t) => t.name).join(", ") || "nothing"
          }`,
        );
      }
    } else {
      tool = pickLeadTool(tools);
      if (!tool) {
        throw new ReferentError(
          "tools/list",
          `no tool looks like it creates a contact; set REFERENT_LEAD_TOOL. Server offers: ${
            tools.map((t) => t.name).join(", ") || "nothing"
          }`,
        );
      }
    }

    // The flag goes into the CRM note as well as into Marie's alert, so it is
    // visible to whoever opens the record next rather than only in an email.
    const annotations = flagged.personalReview
      ? [
          `*** PERSONAL REVIEW — this inquiry mentions ${flagged.reason}.`,
          `*** No automated message has been sent. Do not enrol in an automation.`,
        ]
      : [];

    await client.callTool(tool.name, buildArguments(tool.inputSchema, lead, annotations));
    return tool.name;
  } finally {
    await client.close();
  }
}

/**
 * Diagnostics. This exists because the Referent server could not be reached
 * from the environment this integration was written in, so the tool names and
 * their argument schemas were never seen. One authenticated GET from the live
 * Worker answers that, and `REFERENT_LEAD_TOOL` can then be pinned.
 *
 * Constant-time-ish comparison is not warranted here — the route is unlisted,
 * returns no lead data, and the key only reveals the CRM's own tool names.
 */
async function handleTools(request: Request, env: Env): Promise<Response> {
  const expected = env.REFERENT_DEBUG_KEY;
  const supplied = new URL(request.url).searchParams.get("key");
  if (!expected || supplied !== expected) {
    return json({ ok: false, error: "not_found" }, 404);
  }

  const token = env.REFERENT_API_TOKEN;
  if (!token) {
    return json({ ok: false, error: "crm_not_configured" }, 503);
  }

  const client = new ReferentClient(env.REFERENT_MCP_URL || DEFAULT_MCP_URL, token);
  try {
    await client.open();
    const tools = await client.listTools();
    const chosen = env.REFERENT_LEAD_TOOL?.trim() || pickLeadTool(tools)?.name || null;

    return json({
      ok: true,
      would_call: chosen,
      pinned: Boolean(env.REFERENT_LEAD_TOOL?.trim()),
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        required: tool.inputSchema?.required ?? [],
        properties: describeProperties(tool.inputSchema),
      })),
    });
  } catch (error) {
    const stage = error instanceof ReferentError ? error.stage : "unknown";
    const message = error instanceof Error ? error.message : String(error);
    return json({ ok: false, stage, error: message }, 502);
  } finally {
    await client.close();
  }
}

function describeProperties(schema: JsonSchema | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, property] of Object.entries(schema?.properties ?? {})) {
    const type = Array.isArray(property.type) ? property.type.join("|") : property.type;
    out[key] = type || "unknown";
  }
  return out;
}

async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  const contentType = (request.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("application/json")) return null;

  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BODY_BYTES) return null;

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return null;

  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/**
 * The same loose email check the form uses, for the same reason: a stricter
 * pattern rejects real addresses, and a bounced email costs less than a lost
 * lead. Length caps are the part that matters here, since this end is the one
 * a script can reach directly.
 */
function validate(body: Record<string, unknown>): Lead | null {
  const text = (value: unknown, max: number): string =>
    typeof value === "string" ? value.trim().slice(0, max) : "";

  const first_name = text(body["first_name"], 80);
  const email = text(body["email"], 254);
  if (!first_name || email.indexOf("@") < 1 || !email.includes(".")) return null;

  const source_page = text(body["source_page"], 200) || "/";
  const captured = text(body["captured_at"], 40);

  // A number that cannot be dialled is worse than no number: it looks like a
  // way to reach someone and is not. Anything unparseable is dropped, and the
  // lead is still perfectly good on the email alone.
  const phone = toE164(text(body["phone"], 32)) || "";

  return {
    first_name,
    email,
    phone,
    // Consent is only consent when there is a number attached to it, and only
    // ever when the box was actually ticked. Never inferred from anything.
    sms_consent: phone !== "" && body["sms_consent"] === true,
    timeframe: text(body["timeframe"], 40),
    topic: text(body["topic"], MAX_TOPIC),
    source_page,
    source_url: text(body["source_url"], 300) ||
      `https://prosefairplaymediation.com${source_page}`,
    // Trusting the browser's clock for this is fine, but not trusting it at
    // all is free.
    captured_at: /^\d{4}-\d{2}-\d{2}T/.test(captured) ? captured : new Date().toISOString(),
  };
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}
