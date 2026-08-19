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
export const GOOGLE_REVIEW_URL = "";
