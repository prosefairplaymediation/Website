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

// ============================================================
// OPENING HOURS
//
// Fills openingHoursSpecification in the business schema, which is what drives
// Google's "Open now" filter in local results — a filter people actually use,
// and one this practice cannot appear in today, because the site publishes an
// address, a phone number, coordinates and a price range but no hours.
//
// EMPTY ON PURPOSE. These have to come from Marie rather than from a guess.
// Wrong hours send someone to a business they believe is open, and the site
// already advertises evening and weekend mediations, so the real answer is
// not the nine-to-five anyone would assume.
//
// Fill it in like this — one entry per distinct pattern, 24-hour times:
//
//     export const OPENING_HOURS: OpeningHours[] = [
//       { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
//         opens: "09:00", closes: "17:00" },
//       { days: ["Saturday"], opens: "10:00", closes: "14:00" },
//     ];
//
// Consultations are by appointment, so these describe when someone can reach
// the practice, not when a door is unlocked. Days left out are reported to
// Google as closed.
//
// While the array is empty, no openingHoursSpecification is emitted at all.
// That is the correct state: no hours beats wrong hours.
// ============================================================
export interface OpeningHours {
  /** Schema.org day names, e.g. "Monday". */
  days: string[];
  /** 24-hour "HH:MM". */
  opens: string;
  closes: string;
}

export const OPENING_HOURS: OpeningHours[] = [];

// ============================================================
// QUOTED-AMOUNT PAYMENT LINK
//
// One Stripe Payment Link with a "customer chooses price" amount, used by the
// two services that have no published rate: Gold Service Mediation and
// Additional Document Preparation. Marie quotes a figure, the client types
// that figure in, and pays.
//
// EMPTY UNTIL THE LINK EXISTS. While it is empty those two rows show no Pay
// Now button and read "Inquire within", which is the current behaviour and a
// perfectly good fallback — a payment button that leads nowhere is worse than
// no button.
//
// Creating it, per docs/drafts/stripe-setup.md (product 5):
//
//   1. Stripe -> Add product -> "Quoted amount — Pro Se Fair Play Mediation"
//   2. On the price, choose "Customer chooses price", currency USD
//   3. SET A MINIMUM. Without one, a typo sends a $6 payment for a $6,000
//      matter. Set it at or just below the smallest realistic quote, and
//      consider a maximum for the opposite typo.
//   4. Leave the preset amount blank, so nobody anchors on a number that was
//      never quoted to them
//   5. Add two required fields: "Matter name" and "Amount quoted to you". The
//      second reads as redundant beside the amount they type and is not: when
//      the two disagree you see it immediately rather than at reconciliation
//   6. After payment -> redirect to
//      https://prosefairplaymediation.com/thank-you
//
// Worth knowing: for a large Gold matter a Stripe INVOICE is the safer
// instrument, because you set the amount and the client cannot mistype it.
// This button trades that safety for speed. Use the button for convenience,
// an invoice when the number is big enough that a typo would hurt.
// ============================================================
export const QUOTED_AMOUNT_URL = "";
