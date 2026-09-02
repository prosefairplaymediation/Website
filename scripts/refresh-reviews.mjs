/**
 * Refresh the committed reviews snapshot.
 *
 *   npm run reviews:refresh
 *
 * Run this from a machine with network access, then commit the result. It
 * fetches the live reviews once and writes them to content/reviews-snapshot.json.
 *
 * Why a committed file rather than just fetching at build time: the reviews and
 * the rating come from a third party during the build, and if that service is
 * slow or down when Cloudflare builds, the section used to empty silently. The
 * site kept working and simply stopped showing any social proof, with nobody
 * told. The snapshot means a bad fetch falls back to the last good one and
 * prints a warning, so the rating stays on the site — which is the requirement.
 *
 * Refresh it whenever a new review comes in, or the displayed count drifts from
 * what Google shows. Stale-but-present beats absent.
 */
import { getReviewData, writeSnapshot } from "../src/lib/reviews.ts";

const data = await getReviewData();

if (!data.reviews.length) {
  console.error(
    "\n  Refused to write an empty snapshot.\n" +
      "  The live fetch returned no reviews, so writing now would overwrite\n" +
      "  good data with nothing — the exact failure this file exists to stop.\n" +
      "  Check the Featurable widget, then run this again.\n",
  );
  process.exit(1);
}

await writeSnapshot({ ...data, fetchedAt: new Date().toISOString().slice(0, 10) });

console.log(
  `\n  Wrote content/reviews-snapshot.json` +
    `\n    ${data.reviews.length} reviews, average ${data.average ?? "unknown"}` +
    `\n\n  Commit it. The site falls back to this whenever the live fetch fails.\n`,
);
