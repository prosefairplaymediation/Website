/**
 * Advertising attribution — the part that cannot be added later.
 *
 * The point of this file is one sentence: **a Google click ID that was not
 * captured on the visit is gone forever.** Everything else in the advertising
 * funnel can be built next month. This cannot be backfilled, and without it
 * the eventual "this lead paid for a mediation" can never be matched back to
 * the ad click that produced them.
 *
 * So the site captures `gclid` / `gbraid` / `wbraid` and the UTM parameters on
 * arrival, keeps them, and sends them with the lead into Referent. Whether or
 * not the Google Ads side is ever configured, the identifiers accumulate in
 * the CRM from today, and the funnel Marie actually cares about —
 *
 *     Search → Visitor → Lead → Qualified → Consultation → Paid
 *
 * — can be reported back to Google whenever that side is switched on, for
 * every lead captured since this shipped.
 *
 * ## First touch and last touch, both
 *
 * Family law has a long consideration cycle: people read for weeks and arrive
 * several times before they contact anyone. So the first arrival is recorded
 * once and never overwritten, and the most recent one is updated on every
 * visit. First touch is what usually deserves the credit for a decision made
 * over a month; last touch is what Google's own attribution expects. Storing
 * both costs a few hundred bytes and settles nothing prematurely.
 *
 * ## What is deliberately not here
 *
 * No third-party advertising cookie, no cross-site identifier, nothing shared
 * with anyone but Referent. These are Google's own click parameters, already
 * present in the URL Google itself sent the visitor to, plus the campaign tags
 * the practice puts on its own links.
 */

/** Ninety days, matching the default Google Ads conversion window. */
export const ATTRIBUTION_TTL_DAYS = 90;

/** Where the captured parameters live in the visitor's own browser. */
export const ATTRIBUTION_KEY = "pfp_attribution_v1";

/**
 * Google Ads conversion tag. Empty until the account exists; while empty, no
 * Ads tag is emitted and no conversion is sent — GA4 carries on regardless.
 *
 * `AW_CONVERSION_ID` is the account tag, e.g. "AW-123456789".
 * `AW_LEAD_CONVERSION_LABEL` is the label of the conversion action created for
 * a website lead, e.g. "abcDEFghiJKL_mnoP". Both come from Google Ads →
 * Goals → Conversions → the action → "Tag setup".
 *
 * See docs/marketing/google-attribution.md. Fill these in and push; nothing
 * else changes.
 */
export const AW_CONVERSION_ID = "";
export const AW_LEAD_CONVERSION_LABEL = "";

export const ADS_TAG_ENABLED = AW_CONVERSION_ID !== "";

export const AW_LEAD_CONVERSION_SEND_TO =
  AW_CONVERSION_ID && AW_LEAD_CONVERSION_LABEL
    ? `${AW_CONVERSION_ID}/${AW_LEAD_CONVERSION_LABEL}`
    : "";
