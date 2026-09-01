/**
 * Where captured leads go.
 *
 * The site is static assets on Cloudflare, so anything that needs a secret has
 * to happen off the page. This file is the single place that decides where the
 * capture form posts. Exactly one mode is active, chosen by the constants
 * below, in the order they are listed here.
 *
 * MODE 1 -- Referent, the CRM (active). The form posts same-origin to
 * /api/lead, and the Worker in `worker/index.ts` opens an MCP session against
 * https://mcp.referent.law/mcp and creates the contact. The Referent API token
 * lives as a Worker secret and never reaches the browser.
 *
 * Why not post to Referent directly from the page: `mcp.referent.law/mcp`
 * speaks MCP over streamable HTTP, which is a JSON-RPC conversation rather
 * than a single form POST, it needs a credential, and it would have to allow
 * this origin by CORS. The first two rule out doing it in the page regardless
 * of the third. Setup is in docs/marketing/referent-crm.md.
 *
 * MODE 2 -- Zapier Catch Hook. Kept because it costs one line and is the
 * fastest way to route leads somewhere else without a deploy of the Worker.
 * Fill in LEAD_WEBHOOK_URL and it takes precedence over nothing — set
 * USE_REFERENT to false as well if it should replace Referent rather than sit
 * unused behind it.
 *
 * MODE 3 -- HubSpot Forms, if the CRM decision is ever revisited.
 *
 * MODE 4 -- the fallback, active while everything above is off: the form opens
 * the visitor's mail client with a prefilled message.
 *
 * The fallback is also the *runtime* safety net, not just a configuration
 * state. If /api/lead answers with anything other than a 2xx -- token missing,
 * Referent down, tool call rejected -- the form quietly opens the mail client
 * instead of showing an error. No lead is dropped because a third party had a
 * bad afternoon.
 */

/** Set false to take Referent out of the path without deleting the Worker. */
export const USE_REFERENT = true;

/** Same-origin, so no CORS and no credential in the page. */
export const REFERENT_ENDPOINT = "/api/lead";

export const LEAD_WEBHOOK_URL = "";

export const HUBSPOT_PORTAL_ID = "";
export const HUBSPOT_FORM_ID = "";

/** Which payload shape the submit handler builds. */
export const LEAD_MODE: "referent" | "webhook" | "hubspot" | "mailto" = USE_REFERENT
  ? "referent"
  : LEAD_WEBHOOK_URL
    ? "webhook"
    : HUBSPOT_PORTAL_ID && HUBSPOT_FORM_ID
      ? "hubspot"
      : "mailto";

export const LEAD_ENDPOINT =
  LEAD_MODE === "referent"
    ? REFERENT_ENDPOINT
    : LEAD_MODE === "webhook"
      ? LEAD_WEBHOOK_URL
      : LEAD_MODE === "hubspot"
        ? `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_ID}`
        : "";

export const LEAD_FALLBACK_EMAIL = "info@prosefairplaymediation.com";
