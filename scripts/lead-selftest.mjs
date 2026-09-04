/**
 * Self-test for the lead endpoint.
 *
 *   node --experimental-strip-types scripts/lead-selftest.mjs
 *   npm run test:lead
 *
 * Replaces scripts/referent-selftest.mjs, which was deleted with the CRM on
 * 2026-09-04. Most of that file exercised an MCP client against a stand-in
 * server and went with it. What is kept here is everything that was never
 * about the CRM: the safety screen, phone normalisation, and every refusal
 * path on the route.
 *
 * What is new is the rule that replaced the CRM. The practice alert is now
 * the record of a lead, so this proves that a lead is only ever answered with
 * a 200 when that email actually sent, and that a flagged inquiry still
 * reaches the practice while receiving no automated reply of any kind.
 *
 * Resend and Twilio are stubbed at `fetch`. Nothing leaves the machine.
 */
import worker from "../worker/index.ts";
import { screen, toE164 } from "../worker/notify.ts";

const ORIGIN = "https://prosefairplaymediation.com";
let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  ok   ${name}`);
  } else {
    failed++;
    console.log(`  FAIL ${name}${detail ? `: ${detail}` : ""}`);
  }
}

const goodLead = {
  first_name: "Dana",
  email: "dana@example.com",
  timeframe: "Within a month",
  topic: "divorce with two kids, we agree on most things",
  source_page: "/faq",
  source_url: "https://prosefairplaymediation.com/faq",
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

/**
 * Stub Resend and Twilio. `emailOk: false` makes the mail provider fail,
 * which is the case that must not produce a 200.
 */
function stubProviders({ emailOk = true } = {}) {
  const sent = { emails: [], texts: [] };
  const real = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.includes("api.resend.com")) {
      sent.emails.push(JSON.parse(init.body));
      return emailOk
        ? new Response(JSON.stringify({ id: "e1" }), { status: 200 })
        : new Response("upstream is down", { status: 500 });
    }
    if (url.includes("api.twilio.com")) {
      sent.texts.push(String(init.body));
      return new Response(JSON.stringify({ sid: "s1" }), { status: 201 });
    }
    return real(input, init);
  };
  return { sent, restore: () => { globalThis.fetch = real; } };
}

const ENV = {
  ASSETS,
  RESEND_API_KEY: "test-key",
  NOTIFY_FROM: "site@prosefairplaymediation.com",
  NOTIFY_TO: "info@prosefairplaymediation.com",
  TWILIO_ACCOUNT_SID: "AC-test",
  TWILIO_AUTH_TOKEN: "test-token",
  TWILIO_FROM: "+15615550199",
};

/* ------------------------------------------------- the alert is the record */

console.log("\nThe practice alert decides the answer");
{
  const { sent, restore } = stubProviders();
  const res = await worker.fetch(post(goodLead), ENV);
  const body = await res.json();
  check("a delivered alert returns 200", res.status === 200, `got ${res.status}`);
  check("reports ok", body.ok === true);
  check("the practice was emailed", sent.emails.some((e) => e.to.includes(ENV.NOTIFY_TO)));
  check("the visitor was acknowledged", sent.emails.some((e) => e.to.includes(goodLead.email)));
  restore();
}

{
  const { sent, restore } = stubProviders({ emailOk: false });
  const res = await worker.fetch(post(goodLead), ENV);
  check(
    "a failed alert returns 502, so the page opens the mail client",
    res.status === 502,
    `got ${res.status}`,
  );
  check("no lead is silently accepted", (await res.json()).ok === false);
  check("nothing claimed to be sent", sent.emails.length > 0 && sent.texts.length === 0);
  restore();
}

{
  // The whole point of the change: with no CRM behind the form, an
  // unconfigured mail provider must not look like a captured lead.
  const { restore } = stubProviders();
  const res = await worker.fetch(post(goodLead), { ASSETS });
  check("no mail provider configured returns 502", res.status === 502, `got ${res.status}`);
  restore();
}

/* --------------------------------------------------------- the safety screen */

console.log("\nThe safety screen");
{
  const { sent, restore } = stubProviders();
  const flaggedTopics = [
    "my ex threatened me, there is an injunction",
    "he has been abusive for years",
    "I am scared of him and want a restraining order",
  ];
  for (const topic of flaggedTopics) {
    const { personalReview, reason } = screen({ ...goodLead, topic });
    check(`flagged: "${topic.slice(0, 34)}..."`, personalReview === true, reason);
  }

  const safeTopics = [
    "divorce with two kids, we agree on most things",
    "we need a parenting plan and cannot agree on holidays",
  ];
  for (const topic of safeTopics) {
    const { personalReview } = screen({ ...goodLead, topic });
    check(`not flagged: "${topic.slice(0, 34)}..."`, personalReview === false);
  }

  sent.emails.length = 0;
  const res = await worker.fetch(
    post({ ...goodLead, phone: "561-555-0134", sms_consent: true, topic: flaggedTopics[0] }),
    { ...ENV, PRACTICE_SMS: "+15615550100" },
  );
  check("a flagged lead still reaches the practice", res.status === 200, `got ${res.status}`);
  check(
    "the practice alert says why",
    sent.emails.some((e) => e.to.includes(ENV.NOTIFY_TO) && /PERSONAL REVIEW/.test(e.subject)),
  );
  check(
    "the visitor gets no automated email",
    !sent.emails.some((e) => e.to.includes(goodLead.email)),
    JSON.stringify(sent.emails.map((e) => e.to)),
  );
  check(
    "and no automated text, even having consented",
    !sent.texts.some((t) => t.includes("5615550134")),
    JSON.stringify(sent.texts),
  );
  restore();
}

/* ------------------------------------------------ phone numbers and consent */

console.log("\nPhone numbers and texting consent");
{
  check("10 digits become E.164", toE164("561-555-0134") === "+15615550134", toE164("561-555-0134"));
  check("1 + 10 digits accepted", toE164("1 (561) 555 0134") === "+15615550134");
  check("already E.164 passes through", toE164("+15615550134") === "+15615550134");
  check("too short refused", toE164("555-0134") === null);
  check("letters refused", toE164("call me") === null);
  check("area code starting 0 refused", toE164("061-555-0134") === null);

  const { sent, restore } = stubProviders();
  await worker.fetch(post({ ...goodLead, phone: "(561) 555-0134", sms_consent: true }), ENV);
  check("consent plus a number sends the text", sent.texts.some((t) => t.includes("5615550134")));

  sent.texts.length = 0;
  await worker.fetch(post({ ...goodLead, phone: "(561) 555-0134", sms_consent: false }), ENV);
  check("no consent, no text", sent.texts.length === 0, JSON.stringify(sent.texts));

  sent.texts.length = 0;
  await worker.fetch(post({ ...goodLead, phone: "", sms_consent: true }), ENV);
  check("consent without a number is not consent", sent.texts.length === 0);
  restore();
}

/* ------------------------------------------------------ refusals and fallbacks */

console.log("\nRefusals and fallbacks");
{
  const { sent, restore } = stubProviders();

  const honeypot = await worker.fetch(post({ ...goodLead, company: "Acme Bots" }), ENV);
  check("honeypot answered 200", honeypot.status === 200);
  check("honeypot recorded nothing", (await honeypot.json()).skipped === true);
  check("honeypot sent no mail", sent.emails.length === 0, JSON.stringify(sent.emails.length));

  const foreign = await worker.fetch(post(goodLead, { origin: "https://not-this-site.example" }), ENV);
  check("foreign origin refused", foreign.status === 403, `got ${foreign.status}`);

  const noEmail = await worker.fetch(post({ ...goodLead, email: "nope" }), ENV);
  check("invalid email refused", noEmail.status === 422, `got ${noEmail.status}`);

  const getLead = await worker.fetch(
    new Request("https://prosefairplaymediation.com/api/lead", { method: "GET" }),
    ENV,
  );
  check("GET on /api/lead refused", getLead.status === 405, `got ${getLead.status}`);

  const notJson = await worker.fetch(
    new Request("https://prosefairplaymediation.com/api/lead", {
      method: "POST",
      headers: { "Content-Type": "text/plain", Origin: ORIGIN },
      body: "first_name=Dana",
    }),
    ENV,
  );
  check("non-JSON body refused", notJson.status === 400, `got ${notJson.status}`);

  const overlong = await worker.fetch(post({ ...goodLead, topic: "x".repeat(20000) }), ENV);
  check("oversized body refused", overlong.status === 400, `got ${overlong.status}`);

  const asset = await worker.fetch(new Request("https://prosefairplaymediation.com/faq"), ENV);
  check("a non-API path still gets the static site", asset.status === 200);

  const gone = await worker.fetch(
    new Request("https://prosefairplaymediation.com/api/lead/tools?key=x"),
    ENV,
  );
  check(
    "the removed diagnostics route is no longer handled, it falls through to assets",
    (await gone.text()) === "asset",
  );
  restore();
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
