# Referent — the website → CRM connection

Written 2026-09-01. Referent is the CRM. `https://mcp.referent.law/mcp` is now
wired to the capture form on this site. This is the setup guide and the record
of what was and was not verified.

## What the site does now

```
capture form  ──POST /api/lead──▶  Cloudflare Worker  ──MCP──▶  mcp.referent.law
   (browser)      same origin        (worker/index.ts)            (contact created)
        │
        └── if that returns anything but 2xx, the form opens the visitor's
            mail client instead, exactly as it did before any CRM existed
```

Three files carry it:

| File | Job |
|---|---|
| `worker/index.ts` | The `/api/lead` route: validation, honeypot, origin check |
| `worker/referent.ts` | The MCP client: handshake, tool lookup, argument mapping |
| `src/lib/leadCapture.ts` | The one switch that decides where the form posts |

`wrangler.jsonc` gained `main` and `run_worker_first: ["/api/*"]`. **Every URL
other than `/api/*` is served exactly as before** — same static files, same
speed, no Worker in the path.

## Why the browser does not post to Referent directly

It was worth trying, and it does not work. `mcp.referent.law/mcp` speaks the
Model Context Protocol over streamable HTTP, and three things follow:

1. **It is a conversation, not a form post.** A session has to be opened with
   an `initialize` call, the session id echoed on every later request, and only
   then can a tool be called. A form cannot do that in one POST.
2. **It needs a credential.** Anything in a static page is public — "view
   source" is one keystroke. That credential opens the CRM.
3. **CORS.** A browser would need Referent to allow this origin. Even if it
   did, points 1 and 2 stand.

So the call is made in a Cloudflare Worker, where the token is a secret. This
is also what turns on everything in the wider funnel — SMS, booking, payment,
conversion pings back to Google all need a place to run server-side, and this
is now that place.

## Setup — four steps

### 1. Get a Referent API token

From Referent's own settings. It is sent as `Authorization: Bearer <token>`,
which is what MCP servers accept by convention. **If Referent requires OAuth
instead of a static token, this is the one thing that needs revisiting** — see
"Not verified" below.

### 2. Store it as a Worker secret

Dashboard → Workers & Pages → `prosefairplaymediation` → Settings → Variables
and Secrets → Add, as type **Secret**. Or:

```sh
npx wrangler secret put REFERENT_API_TOKEN
```

| Name | Required | What it does |
|---|---|---|
| `REFERENT_API_TOKEN` | **yes** | The credential. Nothing works without it. |
| `REFERENT_DEBUG_KEY` | recommended | Any random string. Turns on the diagnostic route in step 3. |
| `REFERENT_LEAD_TOOL` | after step 3 | The exact tool name to call. |
| `REFERENT_MCP_URL` | no | Defaults to `https://mcp.referent.law/mcp`. |

### 3. Ask the live server what it offers

With `REFERENT_DEBUG_KEY` set, open:

```
https://prosefairplaymediation.com/api/lead/tools?key=YOUR_DEBUG_KEY
```

It answers with every tool Referent exposes, the arguments each one takes, and
`would_call` — the tool the Worker would pick on its own. Something like:

```json
{
  "ok": true,
  "would_call": "create_contact",
  "pinned": false,
  "tools": [{ "name": "create_contact", "required": ["firstName", "email"], … }]
}
```

That route 404s while `REFERENT_DEBUG_KEY` is unset, and it never returns lead
data — only Referent's own tool names.

### 4. Pin the tool name

Set `REFERENT_LEAD_TOOL` to the name from `would_call`. The Worker then stops
guessing. Skipping this step still works, but a guess is a thing that can
change under you when Referent ships a new tool.

Then submit the form once on the live site and confirm the contact lands.

## How the arguments get filled in

The Worker does not hard-code Referent's field names. It reads the JSON Schema
the server publishes for its own tool and maps onto that, so `firstName`,
`first_name` and `givenName` are all filled the same way, and a nested
`{ contact: { email } }` shape works too. Only fields the schema actually
declares are sent, because an API that rejects unknown keys is common enough
that sending every alias would fail on the first real lead.

What goes across, and nothing else:

| Form field | Sent as |
|---|---|
| First name | the name field(s) the schema declares |
| Email | the email field |
| Timeframe, one-line topic, page, timestamp | the notes/description field, and a custom-fields bag if one exists |
| — | source, set to `Website — prosefairplaymediation.com` |

**No case substance.** The form asks for a first name, an email, a rough
timeframe and one optional line, and says on the page that details of the
dispute do not belong there. That constraint is not incidental — see
`crm.md` and Fla. Stat. § 44.405.

## What was verified, and what was not

**Verified** — by `npm run test:referent`, which runs the real Worker against a
stand-in MCP server that follows the spec: the handshake and session id, both
transport shapes a server may answer with (plain JSON and `text/event-stream`,
including a reply split across TCP chunks), the tool choice, the argument
mapping onto three different schema shapes, and every refusal path. 33 checks.

**Not verified** — anything that needed the live server:

- **The tool's real name and its argument names.** `mcp.referent.law` is not
  reachable from the environment this was built in; the connection is refused
  at the network policy. Hence the schema-reading approach and step 3 above.
- **The authentication scheme.** Bearer token is assumed. If Referent requires
  OAuth 2.1 (some hosted MCP servers do), `/api/lead/tools` will come back with
  a 401 and that is the signal. The fix is contained: a token-exchange step in
  `ReferentClient`, nothing else changes.
- **Whether MCP is even the interface Referent intends for this.** An MCP
  endpoint is built for AI assistants to work with a CRM conversationally. If
  Referent also publishes a plain REST API or an inbound webhook, that is the
  simpler road for form-to-CRM, and switching is a small change to
  `worker/referent.ts` — `/api/lead` and the whole browser side stay put.

Worth asking Referent all three directly rather than inferring them.

## When something breaks

Cloudflare dashboard → the Worker → Logs (observability is on), or
`npx wrangler tail`. Every failure logs its stage: `initialize`, `tools/list`
or `tools/call`.

Meanwhile the visitor never sees an error — the form falls back to their mail
client and GA4 records `lead_capture_fallback`. **A run of those events is the
alarm.** Leads keep arriving by email while the CRM leg is down, which means
nothing is lost, and also that a broken token could go unnoticed for a week if
nobody watches that event.

## Where this sits in the larger plan

The intended funnel is Google → site → AI intake → Referent → SMS/email/
booking/payment → conversion feedback to Google. This ships the arrow into
Referent, which is the piece everything downstream hangs off:

- **Done.** Form → Referent, with the credential held server-side, plus a
  server-side place for the rest to run.
- **Next, smallest first.** SMS and email on new lead (Referent automation, or
  a Twilio/Resend call added to `worker/index.ts`); booking and payment links
  in that first message, which the site already has at `/book` and `/pay`.
- **Then.** An AI intake conversation replacing the form, which is a larger
  piece of work and carries a professional-conduct question that has already
  been decided once on this site — the chat widget at
  `src/components/ChatWidget.astro` deliberately has no language model behind
  it, because a bot that improvises can be asked what someone should do in
  their own case and will answer. Read the header of that file before
  reopening the decision; it is a Rule 10.370 / unauthorized-practice question,
  not a technical one.
- **Then.** Google Ads/GA4 conversion feedback, which needs the pipeline above
  it to exist first — there is nothing to report back until leads have stages.
