// Shared site constants.

// ============================================================
// GOOGLE REVIEW LINK — an override, not a requirement.
//
// Leave this empty and src/lib/reviews.ts derives the review link from the
// Google Place ID that Featurable reports, using the API call the reviews
// section already makes. Nothing to look up by hand.
//
// Set it only to override that, which is worth doing if you have the short
// link from Google Business Profile -> "Ask for reviews", since a link
// copied straight from Google is authoritative:
//
//     https://g.page/r/XXXXXXXXXXXX/review
//
// If neither is available the link is "" and every consumer is gated on
// that, so the site never ships a dead review link.
//
// Do not hand-build one from the Maps address — those open the business
// listing instead of the review box, and most people give up before
// finding the review button.
// ============================================================
export const GOOGLE_REVIEW_URL = "https://g.page/r/CQBgcXw1OG36EAE/review";

// ============================================================
// BING WEBMASTER TOOLS VERIFICATION
//
// Bing's index is what ChatGPT's web search leans on, so verifying the
// site in Bing Webmaster Tools is the highest-leverage thing available
// for AI-answer visibility. Verification itself is a one-time step that
// has to happen from a Microsoft account:
//
//   1. bing.com/webmasters -> Add site -> import from Google Search
//      Console (fastest, since GSC is already verified), or add
//      https://prosefairplaymediation.com manually.
//   2. If importing does not verify automatically, choose the HTML Meta
//      Tag option and copy the `content` value out of the tag Bing
//      shows. It looks like a 32-character hex string.
//   3. Paste that value here. The meta tag renders on every page and
//      Bing verifies on its next crawl.
//
// Left empty the tag is simply not emitted, so the site never ships a
// half-configured verification tag.
//
// Note: Bing Places (the business listing, bingplaces.com) is separate
// from this and cannot be done from the codebase at all. It can import
// straight from the Google Business Profile.
// ============================================================
export const BING_SITE_VERIFICATION = "";
