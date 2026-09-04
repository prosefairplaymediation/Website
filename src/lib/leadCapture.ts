/**
 * Where the capture form sends a lead.
 *
 * MODE 1 -- the Worker (active). The form posts same-origin to `/api/lead`.
 * The Worker screens the inquiry, emails the practice, and acknowledges the
 * visitor. There is no CRM behind it: the practice alert IS the record, which
 * is why the Worker only answers 2xx once that email has actually sent.
 *
 * A CRM sat in front of this until 2026-09-04 and was removed at the owner's
 * instruction. Lawmatics is the intended replacement and is not signed up for
 * yet. When it is, it goes behind `/api/lead` in the Worker, alongside the
 * alert rather than in front of it, so that an outage at the CRM can never
 * again mean a lead reaches nobody. Nothing on this side has to change.
 *
 * MODE 2 -- mailto (fallback, always armed). Set LEAD_MODE to "mailto" to use
 * it deliberately, but it is also what happens automatically whenever the
 * Worker answers anything other than 2xx: the form quietly opens the mail
 * client instead of showing an error. No lead is dropped because a provider
 * had a bad afternoon.
 */

/** Set false to fall back to mailto without deleting the Worker. */
export const USE_WORKER = true;

/** Same-origin, so no CORS and no credential in the page. */
export const WORKER_ENDPOINT = "/api/lead";

export const LEAD_WEBHOOK_URL = "";

export const HUBSPOT_PORTAL_ID = "";
export const HUBSPOT_FORM_ID = "";

/** Which payload shape the submit handler builds. */
export const LEAD_MODE: "worker" | "webhook" | "hubspot" | "mailto" = USE_WORKER
  ? "worker"
  : LEAD_WEBHOOK_URL
    ? "webhook"
    : HUBSPOT_PORTAL_ID && HUBSPOT_FORM_ID
      ? "hubspot"
      : "mailto";

export const LEAD_ENDPOINT =
  LEAD_MODE === "worker"
    ? WORKER_ENDPOINT
    : LEAD_MODE === "webhook"
      ? LEAD_WEBHOOK_URL
      : LEAD_MODE === "hubspot"
        ? `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_ID}`
        : "";

export const LEAD_FALLBACK_EMAIL = "info@prosefairplaymediation.com";
