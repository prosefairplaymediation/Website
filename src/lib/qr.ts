// Build-time QR generation for the Stripe Payment Links on /pay.
//
// Why build-time rather than committed image files: the QR is generated from
// the same `payUrl` constant the Pay Now button uses, so the two can never
// drift. A committed PNG would go stale silently the first time a Payment
// Link is regenerated in the Stripe Dashboard, and a stale payment QR is a
// worse failure than no QR at all.
//
// SVG rather than a raster data URI: it stays sharp at any size, it is
// smaller than an equivalent PNG at these dimensions, and it costs no extra
// request because it is inlined into the page.

import QRCode from "qrcode";

const cache = new Map<string, string>();

/**
 * Returns an inline SVG string encoding `url`.
 *
 * Navy on paper rather than the brand's navy-on-gold: scanners want
 * contrast, and gold modules on cream measure far closer together than
 * black on white does. The card art elsewhere on the site can afford to be
 * decorative because nobody's payment depends on it resolving.
 */
export async function qrSvg(url: string): Promise<string> {
  const hit = cache.get(url);
  if (hit) return hit;

  const svg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: {
      dark: "#1B2D5A",
      light: "#FFFDF7",
    },
  });

  // The library emits its own width/height; strip them so the SVG scales to
  // whatever the CSS gives it and keeps its viewBox aspect.
  const scaled = svg.replace(/<svg([^>]*?)\s*width="[^"]*"\s*height="[^"]*"/, "<svg$1");

  cache.set(url, scaled);
  return scaled;
}
