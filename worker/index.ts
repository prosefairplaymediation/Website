/**
 * The site's only server-side code.
 *
 * Everything under this Worker is still the same static Astro build served
 * from `./dist`; Cloudflare serves an asset without invoking this file at
 * all. The one exception is `/api/*`, which exists so the capture form has
 * somewhere same-origin to post to and so the mail and text credentials stay
 * out of a page anyone can view-source.
 *
 * Routes:
 *   POST /api/lead   the capture form posts here
 *
 * Secrets, set with `wrangler secret put <name>` or in the Cloudflare
 * dashboard under Settings -> Variables and Secrets. None are in the
 * repository and none reach the browser. They are listed in notify.ts, which
 * is what uses them.
 *
 * ## Where a lead goes, and why the alert is the thing that must land
 *
 * A CRM used to sit in front of this, and the practice alert was sent only
 * after the CRM had accepted the contact. That ordering had a failure mode
 * worth remembering now it is gone: when the CRM was unreachable this route
 * returned a non-2xx and the alert was never sent at all.
 *
 * With no CRM, the email to the practice IS the record of the lead. So it is
 * awaited, and its result decides the response. If it did not send, this
 * returns a non-2xx and the browser opens the visitor's mail client instead,
 * exactly as the site did before any of this existed. A lead is never
 * silently accepted by a page and then lost.
 *
 * The visitor's own acknowledgement is deliberately not part of that test. It
 * is a courtesy, and a slow or failing provider should not turn a captured
 * lead into an error on the form.
 */
import {
  acknowledge,
  alertPractice,
  screen,
  toE164,
  type NotifyEnv,
  type Screen,
} from "./notify.ts";
import type { Attribution, AttributionTouch, Lead } from "./lead.ts";

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

/** Cloudflare hands this in; only `waitUntil` is used here. */
interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

export interface Env extends NotifyEnv {
  ASSETS: Fetcher;
}

/** Hosts allowed to post a lead. Anything else is somebody else's form. */
const ALLOWED_ORIGINS = [
  "https://prosefairplaymediation.com",
  "https://www.prosefairplaymediation.com",
  "http://localhost:4321",
  "http://127.0.0.1:4321",
];

/**
 * A real submission is under a kilobyte. The headroom is for the attribution
 * object, where a long campaign name and a long referrer can both turn up.
 */
const MAX_BODY_BYTES = 8192;

/** Same cap the form's `maxlength` sets, enforced where it cannot be edited. */
const MAX_TOPIC = 140;

export default {
  async fetch(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/lead") {
      return handleLead(request, env, ctx);
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

  // Run before anything is sent anywhere. An inquiry that mentions abuse, an
  // injunction or a threat gets a person, never an automated reply. The rule
  // is set out in docs/marketing/lead-automation.md and enforced in notify.ts.
  const flagged: Screen = screen(lead);

  // The alert is the record. Awaited, and its result is the response, because
  // there is no CRM behind this to hold the lead if the mail does not send.
  const alerted = await alertPractice(env, lead, flagged);
  if (!alerted) {
    console.error(`lead: alert email did not send for ${lead.source_page}; visitor sent to mail fallback`);
    return json({ ok: false, error: "notify_unavailable" }, 502);
  }

  console.log(
    `lead: alerted from ${lead.source_page}` +
      (flagged.personalReview ? ` FLAGGED for personal review (${flagged.reason})` : ""),
  );

  // Courtesy, not record. Never allowed to fail the submission.
  const reply = acknowledge(env, lead, flagged);
  if (ctx) ctx.waitUntil(reply);
  else await reply;

  return json({ ok: true });
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
    attribution: readAttribution(body["attribution"]),
  };
}

/** Click IDs and campaign tags are long, but not this long. */
const MAX_ATTRIBUTION_VALUE = 200;

const TOUCH_FIELDS = [
  "gclid", "gbraid", "wbraid",
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "landing_page", "referrer",
] as const;

/**
 * The attribution object comes from the page, so it is shaped here rather than
 * trusted: only the known keys, only strings, each clamped. It ends up in a
 * CRM note that a person reads, and a 4KB "campaign name" in that note would
 * be somebody's idea of a joke.
 */
function readAttribution(value: unknown): Attribution | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;

  const readTouch = (raw: unknown): AttributionTouch | undefined => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
    const from = raw as Record<string, unknown>;
    const touch: AttributionTouch = {};
    for (const field of TOUCH_FIELDS) {
      const item = from[field];
      if (typeof item === "string" && item.trim()) {
        touch[field] = item.trim().slice(0, MAX_ATTRIBUTION_VALUE);
      }
    }
    return Object.keys(touch).length ? touch : undefined;
  };

  const readDate = (raw: unknown): string | undefined =>
    typeof raw === "string" && /^\d{4}-\d{2}-\d{2}T/.test(raw) ? raw.slice(0, 40) : undefined;

  const first = readTouch(source["first"]);
  const last = readTouch(source["last"]);
  if (!first && !last) return null;

  return {
    ...(first && { first }),
    ...(last && { last }),
    ...(readDate(source["first_seen"]) && { first_seen: readDate(source["first_seen"]) }),
    ...(readDate(source["last_seen"]) && { last_seen: readDate(source["last_seen"]) }),
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
