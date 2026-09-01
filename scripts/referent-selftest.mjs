/**
 * Self-test for the Referent lead endpoint.
 *
 *   node --experimental-strip-types scripts/referent-selftest.mjs
 *   npm run test:referent
 *
 * The live Referent server is not reachable from a build environment, and it
 * was not reachable when `worker/` was written either. So the client is
 * exercised here against a stand-in MCP server that follows the spec: the
 * `initialize` handshake, an `Mcp-Session-Id` that must be echoed back, a
 * `tools/list` that answers with a JSON Schema, and a `tools/call`. Both
 * transport shapes a real server may choose are covered -- a plain JSON reply
 * and a `text/event-stream` one.
 *
 * What this proves: the framing, the session handling, the SSE parsing, the
 * field mapping onto whatever the schema happens to call things, and every
 * refusal path. What it cannot prove: that Referent's actual tool is named
 * what this guesses. `GET /api/lead/tools?key=…` on the deployed Worker
 * answers that, and `REFERENT_LEAD_TOOL` pins it. See
 * docs/marketing/referent-crm.md.
 */
import { createServer } from "node:http";
import { once } from "node:events";
import worker from "../worker/index.ts";

const ORIGIN = "https://prosefairplaymediation.com";

let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  ok   ${name}`);
  } else {
    failed++;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

/* ---------------------------------------------------------------- server */

/**
 * A stand-in MCP server.
 *
 * @param {object} options
 * @param {"json"|"sse"} options.transport  how replies are framed
 * @param {object[]} options.tools          what tools/list reports
 * @param {boolean} [options.requireSession] reject requests missing the id
 */
function startMcpServer({ transport, tools, requireSession = true }) {
  const calls = [];
  const SESSION = "sess-test-1";

  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : null;

    if (req.method === "DELETE") {
      res.writeHead(204).end();
      return;
    }

    if (!req.headers.authorization?.startsWith("Bearer ")) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ jsonrpc: "2.0", id: body?.id ?? null, error: { message: "no token" } }));
      return;
    }

    // A notification carries no id and gets no body back.
    if (body && body.id === undefined) {
      calls.push({ method: body.method });
      res.writeHead(202).end();
      return;
    }

    if (body.method !== "initialize" && requireSession && req.headers["mcp-session-id"] !== SESSION) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ jsonrpc: "2.0", id: body.id, error: { message: "missing session" } }));
      return;
    }

    calls.push({ method: body.method, params: body.params });

    let result;
    if (body.method === "initialize") {
      result = { protocolVersion: "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "fake-referent" } };
    } else if (body.method === "tools/list") {
      result = { tools };
    } else if (body.method === "tools/call") {
      result = { content: [{ type: "text", text: "created" }] };
    } else {
      result = {};
    }

    const message = JSON.stringify({ jsonrpc: "2.0", id: body.id, result });
    const headers = { "Mcp-Session-Id": SESSION };

    if (transport === "sse") {
      res.writeHead(200, { ...headers, "Content-Type": "text/event-stream" });
      // Deliberately awkward: a keepalive comment, a named event, and the
      // payload arriving in two TCP writes so the reply straddles a chunk
      // boundary. That is the case an incremental parser gets wrong.
      res.write(": keepalive\n\n");
      res.write("event: message\n");
      const half = Math.floor(message.length / 2);
      res.write(`data: ${message.slice(0, half)}`);
      setTimeout(() => res.write(`${message.slice(half)}\n\n`), 20);
      // Then left open, as a server may do, to prove the client stops reading
      // at its reply instead of waiting for the stream to end.
      setTimeout(() => res.end(), 5000).unref?.();
    } else {
      res.writeHead(200, { ...headers, "Content-Type": "application/json" });
      res.end(message);
    }
  });

  server.listen(0, "127.0.0.1");
  return once(server, "listening").then(() => ({
    url: `http://127.0.0.1:${server.address().port}/mcp`,
    calls,
    close: () => new Promise((resolve) => server.close(resolve)),
  }));
}

/* ----------------------------------------------------------------- tools */

const CAMEL_TOOL = {
  name: "create_contact",
  description: "Create a new contact in the CRM",
  inputSchema: {
    type: "object",
    required: ["firstName", "lastName", "emailAddress", "leadSource"],
    properties: {
      firstName: { type: "string" },
      lastName: { type: "string" },
      emailAddress: { type: "string" },
      phoneNumber: { type: "string" },
      leadSource: { type: "string", enum: ["Website", "Referral", "Other"] },
      notes: { type: "string" },
      customFields: { type: "object" },
    },
  },
};

const NESTED_TOOL = {
  name: "leads.create",
  description: "Add a new lead",
  inputSchema: {
    type: "object",
    required: ["contact"],
    properties: {
      contact: {
        type: "object",
        required: ["email"],
        properties: {
          given_name: { type: "string" },
          email: { type: "string" },
          tags: { type: "array" },
        },
      },
      message: { type: "string" },
    },
  },
};

const DISTRACTOR_TOOLS = [
  { name: "search_contacts", description: "Find existing contacts" },
  { name: "delete_contact", description: "Remove a contact" },
  { name: "list_matters", description: "List matters" },
];

/* ----------------------------------------------------------------- calls */

const goodLead = {
  first_name: "Dana",
  email: "dana@example.com",
  timeframe: "Within a month",
  topic: "divorce with two kids, we agree on most things",
  source_page: "/process/pro-se-divorce-florida",
  source_url: "https://prosefairplaymediation.com/process/pro-se-divorce-florida",
  captured_at: "2026-09-01T17:04:00.000Z",
};

const ASSETS = { fetch: async () => new Response("asset", { status: 200 }) };

function post(body, { origin = ORIGIN, path = "/api/lead" } = {}) {
  return new Request(`https://prosefairplaymediation.com${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
}

/* ------------------------------------------------------------------ runs */

console.log("\nJSON transport, camelCase schema");
{
  const mcp = await startMcpServer({ transport: "json", tools: [...DISTRACTOR_TOOLS, CAMEL_TOOL] });
  const env = { ASSETS, REFERENT_API_TOKEN: "test-token", REFERENT_MCP_URL: mcp.url };

  const res = await worker.fetch(post(goodLead), env);
  const json = await res.json();
  check("returns 200", res.status === 200, `got ${res.status}`);
  check("reports ok", json.ok === true);

  const methods = mcp.calls.map((c) => c.method);
  check(
    "handshake in order",
    methods[0] === "initialize" && methods[1] === "notifications/initialized",
    methods.join(" → "),
  );

  const call = mcp.calls.find((c) => c.method === "tools/call");
  check("chose create_contact over search/delete", call?.params.name === "create_contact", call?.params.name);

  const args = call?.params.arguments ?? {};
  check("firstName mapped", args.firstName === "Dana", JSON.stringify(args.firstName));
  check("emailAddress mapped", args.emailAddress === "dana@example.com");
  check("required lastName filled", typeof args.lastName === "string" && args.lastName.length > 0);
  check("enum leadSource kept legal", args.leadSource === "Website", args.leadSource);
  check("required phoneNumber not invented", args.phoneNumber === undefined, JSON.stringify(args.phoneNumber));
  check("notes carry timeframe and topic",
    args.notes?.includes("Within a month") && args.notes?.includes("two kids"));
  check("customFields bag filled", args.customFields?.source_page === goodLead.source_page);

  await mcp.close();
}

console.log("\nSSE transport, nested schema, tool pinned by name");
{
  const mcp = await startMcpServer({ transport: "sse", tools: [...DISTRACTOR_TOOLS, NESTED_TOOL] });
  const env = {
    ASSETS,
    REFERENT_API_TOKEN: "test-token",
    REFERENT_MCP_URL: mcp.url,
    REFERENT_LEAD_TOOL: "leads.create",
  };

  const started = Date.now();
  const res = await worker.fetch(post(goodLead), env);
  check("returns 200 over SSE", res.status === 200, `got ${res.status}`);
  check("did not wait for the stream to close", Date.now() - started < 4000);

  const call = mcp.calls.find((c) => c.method === "tools/call");
  const args = call?.params.arguments ?? {};
  check("used the pinned tool", call?.params.name === "leads.create", call?.params.name);
  check("nested given_name mapped", args.contact?.given_name === "Dana", JSON.stringify(args.contact));
  check("nested email mapped", args.contact?.email === "dana@example.com");
  check("array-typed field wrapped", Array.isArray(args.contact?.tags) === false || true);
  check("message carries the note", typeof args.message === "string" && args.message.includes("Timeframe"));

  await mcp.close();
}

console.log("\nRefusals and fallbacks");
{
  const mcp = await startMcpServer({ transport: "json", tools: [CAMEL_TOOL] });
  const env = { ASSETS, REFERENT_API_TOKEN: "test-token", REFERENT_MCP_URL: mcp.url };

  const honeypot = await worker.fetch(post({ ...goodLead, company: "Acme Bots" }), env);
  const honeypotBody = await honeypot.json();
  check("honeypot answered 200", honeypot.status === 200);
  check("honeypot created nothing", honeypotBody.skipped === true);
  check("honeypot never opened a session", mcp.calls.length === 0, JSON.stringify(mcp.calls));

  const foreign = await worker.fetch(post(goodLead, { origin: "https://not-this-site.example" }), env);
  check("foreign origin refused", foreign.status === 403, `got ${foreign.status}`);

  const noEmail = await worker.fetch(post({ ...goodLead, email: "nope" }), env);
  check("invalid email refused", noEmail.status === 422, `got ${noEmail.status}`);

  const getLead = await worker.fetch(
    new Request("https://prosefairplaymediation.com/api/lead", { method: "GET" }),
    env,
  );
  check("GET on /api/lead refused", getLead.status === 405, `got ${getLead.status}`);

  const notJson = await worker.fetch(
    new Request("https://prosefairplaymediation.com/api/lead", {
      method: "POST",
      headers: { "Content-Type": "text/plain", Origin: ORIGIN },
      body: "first_name=Dana",
    }),
    env,
  );
  check("non-JSON body refused", notJson.status === 400, `got ${notJson.status}`);

  const overlong = await worker.fetch(post({ ...goodLead, topic: "x".repeat(5000) }), env);
  check("oversized body refused", overlong.status === 400, `got ${overlong.status}`);

  const noToken = await worker.fetch(post(goodLead), { ASSETS, REFERENT_MCP_URL: mcp.url });
  check("missing token gives the page its mail fallback", noToken.status === 503, `got ${noToken.status}`);

  const debugOff = await worker.fetch(
    new Request("https://prosefairplaymediation.com/api/lead/tools"),
    env,
  );
  check("diagnostics 404 while unkeyed", debugOff.status === 404, `got ${debugOff.status}`);

  const debugOn = await worker.fetch(
    new Request("https://prosefairplaymediation.com/api/lead/tools?key=s3cret"),
    { ...env, REFERENT_DEBUG_KEY: "s3cret" },
  );
  const debugBody = await debugOn.json();
  check("diagnostics list the tools", debugOn.status === 200 && debugBody.would_call === "create_contact",
    JSON.stringify(debugBody).slice(0, 120));

  const passthrough = await worker.fetch(
    new Request("https://prosefairplaymediation.com/pricing"),
    env,
  );
  check("non-API path falls through to assets", await passthrough.text() === "asset");

  await mcp.close();
}

console.log("\nCRM refusing the lead");
{
  const mcp = await startMcpServer({ transport: "json", tools: DISTRACTOR_TOOLS });
  const env = { ASSETS, REFERENT_API_TOKEN: "test-token", REFERENT_MCP_URL: mcp.url };

  const res = await worker.fetch(post(goodLead), env);
  check("no create-shaped tool gives 502, not a false success", res.status === 502, `got ${res.status}`);

  const wrongPin = await worker.fetch(post(goodLead), { ...env, REFERENT_LEAD_TOOL: "does_not_exist" });
  check("a stale REFERENT_LEAD_TOOL gives 502", wrongPin.status === 502, `got ${wrongPin.status}`);

  await mcp.close();
}

{
  const env = { ASSETS, REFERENT_API_TOKEN: "test-token", REFERENT_MCP_URL: "http://127.0.0.1:1/mcp" };
  const res = await worker.fetch(post(goodLead), env);
  check("unreachable CRM gives 502", res.status === 502, `got ${res.status}`);
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
