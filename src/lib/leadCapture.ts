/**
 * Where captured emails go.
 *
 * The practice has no backend — the site is static assets on Cloudflare — so
 * capture has to post to something hosted. This file is the single place that
 * decides what.
 *
 * MODE 1 (once configured): HubSpot Forms. Fill in the two IDs below and the
 * form posts straight into the CRM over a public, CORS-enabled endpoint. No
 * API key lives in the page, because that endpoint does not take one.
 * Find them in HubSpot: Marketing -> Forms -> the form -> Share -> Embed code.
 * The portal ID is the number after /submit/, the form ID is the GUID after it.
 *
 * MODE 2 (the fallback, active while the IDs are empty): the form opens the
 * visitor's mail client with a prefilled message to the practice. Less
 * pleasant, but a lead still arrives rather than vanishing. Nothing is
 * silently dropped in either mode.
 *
 * If a different CRM is chosen later, only LEAD_ENDPOINT and the payload
 * builder in LeadCapture.astro need to change.
 */
export const HUBSPOT_PORTAL_ID = "";
export const HUBSPOT_FORM_ID = "";

export const LEAD_ENDPOINT =
  HUBSPOT_PORTAL_ID && HUBSPOT_FORM_ID
    ? `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_ID}`
    : "";

export const LEAD_FALLBACK_EMAIL = "info@prosefairplaymediation.com";
