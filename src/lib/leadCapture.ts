/**
 * Where captured leads go.
 *
 * The site is static assets on Cloudflare with no backend, so capture has to
 * post to something hosted. This file is the single place that decides what.
 * Exactly one mode is active, chosen by which constant below is filled in.
 *
 * MODE 1 -- Zapier Catch Hook (the intended target; see
 * docs/marketing/lead-automation.md). Paste the hook URL into LEAD_WEBHOOK_URL.
 * The Zap creates the Lawmatics contact, which in turn fires the
 * classification Zap. A plain JSON POST, no key in the page, CORS-enabled.
 *
 * MODE 2 -- HubSpot Forms, if the CRM decision goes that way instead.
 *
 * MODE 3 -- the fallback, active while both are empty: the form opens the
 * visitor's mail client with a prefilled message. Not elegant, but no lead is
 * silently dropped while the plumbing is being set up.
 */
export const LEAD_WEBHOOK_URL = "";

export const HUBSPOT_PORTAL_ID = "";
export const HUBSPOT_FORM_ID = "";

/** Which payload shape the submit handler builds. */
export const LEAD_MODE: "webhook" | "hubspot" | "mailto" = LEAD_WEBHOOK_URL
  ? "webhook"
  : HUBSPOT_PORTAL_ID && HUBSPOT_FORM_ID
    ? "hubspot"
    : "mailto";

export const LEAD_ENDPOINT =
  LEAD_MODE === "webhook"
    ? LEAD_WEBHOOK_URL
    : LEAD_MODE === "hubspot"
      ? `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_ID}`
      : "";

export const LEAD_FALLBACK_EMAIL = "info@prosefairplaymediation.com";
