#!/usr/bin/env node
/**
 * Build the per-page link-preview cards in public/og/.
 *
 * Every page shared one card before this, so a link to the Notary page and a
 * link to the FAQ looked identical in iMessage, Slack and Facebook. These are
 * per-page 1200x630 cards built from the same hero photo the page itself uses,
 * with the same navy diagonal overlay, so a preview looks like the page it
 * points at.
 *
 * The outputs are COMMITTED. This script is not part of `npm run build`, and
 * the site does not depend on it at build or deploy time. Run it only when a
 * card needs to change:
 *
 *   node scripts/generate-og-images.mjs
 *
 * FONT. Titles are set in Lora, the site's display face. Lora is loaded from
 * Google Fonts in the browser, but SVG text here is rasterised by sharp, which
 * resolves fonts from the system rather than the network. So Lora has to be
 * installed locally before this will render correctly. If it is missing the
 * script stops rather than silently shipping thirteen cards set in whatever
 * serif the machine defaults to:
 *
 *   mkdir -p ~/.local/share/fonts
 *   curl -sSLo ~/.local/share/fonts/Lora.ttf \
 *     'https://raw.githubusercontent.com/google/fonts/main/ofl/lora/Lora%5Bwght%5D.ttf'
 *   fc-cache -f
 *
 * COMPLIANCE. Card text is page names and section labels only. It makes no
 * certification claim (the Florida Supreme Court family mediator certification
 * is still pending), promises no outcome, and gives no direction about anyone's
 * own case. Keep it that way: a link preview is the one piece of copy that
 * travels without the disclaimer attached to it.
 */

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

const W = 1200;
const H = 630;

// Palette, from src/styles/global.css.
const CREAM = "#FAF7F0";
const GOLD = "#C49A4B";

const PUBLIC = new URL("../public/", import.meta.url).pathname;
const OUT = join(PUBLIC, "og");

/**
 * One entry per card.
 *
 * `photo` is the page's own hero image wherever the page has one, so the card
 * and the page agree. `position` is the crop anchor: the portraits are taller
 * than 1200x630 and a centre crop cuts the face, so those anchor to the top.
 *
 * Titles carry a trailing gold period because the site's hero h1s do (see the
 * `.display-italic` spans in the page headers). Lines are split by hand rather
 * than measured, so a title change may need its break moved.
 */
const CARDS = [
  // Services
  {
    name: "divorce-mediation",
    photo: "handshake2.jpg",
    kicker: "Service",
    lines: ["Divorce Mediation"],
  },
  {
    name: "hourly-mediation",
    photo: "handshake4.jpg",
    kicker: "Service",
    lines: ["Hourly Mediation"],
  },
  {
    name: "gold-service",
    photo: "Goldservice.jpg",
    kicker: "Premium Tier",
    lines: ["Gold Service", "Mediation"],
  },
  {
    name: "parenting-plan",
    photo: "documents2.jpg",
    kicker: "Service",
    lines: ["Parenting Plan", "Preparation"],
  },
  {
    name: "court-packet",
    photo: "stampgavel.jpg",
    kicker: "Service",
    lines: ["Turn-Key", "Court Packet"],
  },
  {
    name: "notary",
    photo: "Notary.jpg",
    kicker: "Service",
    lines: ["Online Notary", "Services"],
  },
  // Key pages
  {
    name: "about",
    photo: "new_Aboutme.jpg",
    position: "top",
    kicker: "About Me",
    lines: ["Marie VanGinHoven"],
    period: false,
  },
  {
    name: "book",
    photo: "justice_globe.jpg",
    kicker: "Free Consultation",
    lines: ["Schedule a", "15-minute consult"],
  },
  {
    name: "faq",
    photo: "scales.jpg",
    kicker: "Frequently Asked",
    lines: ["Questions,", "answered"],
  },
  {
    name: "contact",
    photo: "New_Contact.jpg",
    position: "top",
    kicker: "Get in Touch",
    lines: ["Have a question?"],
    period: false,
  },
  {
    name: "documents",
    photo: "pen_documents.jpg",
    kicker: "Resources",
    lines: ["Document Portal"],
  },
  {
    name: "areas-served",
    photo: "justice_globe.jpg",
    position: "bottom",
    kicker: "Where I Work",
    lines: ["Serving Florida,", "by Zoom"],
  },
  {
    name: "services",
    photo: "documents_hero.jpg",
    kicker: "What I Offer",
    lines: ["Services"],
  },
  {
    name: "pricing",
    photo: "Goldservice.jpg",
    position: "bottom",
    kicker: "Fees & Policies",
    lines: ["Pricing"],
  },
  {
    name: "reviews",
    photo: "new_FAQ.jpg",
    position: "top",
    kicker: "In Their Own Words",
    lines: ["Client Reviews"],
  },
  {
    name: "landing",
    photo: "new_Landing.jpg",
    position: "top",
    // Kicker is just "Welcome": the page's own kicker reads "Welcome to Pro Se
    // Fair Play Mediation", which set the wordmark twice on one card.
    kicker: "Welcome",
    lines: ["A level playing field"],
  },
  // One card for the whole guide library, used by /process and by every guide.
  // Deliberately shared: the weekly article workflow publishes new guides
  // without a human in the loop, and a per-guide card would mean every
  // generated page shipped pointing at an image that does not exist.
  {
    name: "guides",
    photo: "three_people_table_argue.jpg",
    kicker: "Guides & Explainers",
    lines: ["The Mediation", "Process"],
  },
];

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function overlay({ kicker, lines, period = true }) {
  const titleSize = lines.length > 1 ? 74 : 84;
  const lineGap = titleSize * 1.16;
  const lastBaseline = 472;
  const firstBaseline = lastBaseline - (lines.length - 1) * lineGap;
  const kickerBaseline = firstBaseline - titleSize * 0.82;

  const titleRows = lines
    .map((line, i) => {
      const y = firstBaseline + i * lineGap;
      const tail =
        period && i === lines.length - 1
          ? `<tspan fill="${GOLD}">.</tspan>`
          : "";
      return `<text x="76" y="${y}" font-family="Lora" font-size="${titleSize}" fill="${CREAM}">${esc(line)}${tail}</text>`;
    })
    .join("");

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <!-- The standard photo-hero overlay from the site, at the darker variant
         (0.9 / 0.78 / 0.9). Previews render small, so they take the darker of
         the two sanctioned gradients rather than a third invented one. -->
    <linearGradient id="scrim" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgb(15,27,50)" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="rgb(27,42,74)" stop-opacity="0.78"/>
      <stop offset="100%" stop-color="rgb(27,42,74)" stop-opacity="0.9"/>
    </linearGradient>
    <linearGradient id="hairline" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0"/>
      <stop offset="30%" stop-color="${GOLD}" stop-opacity="0.75"/>
      <stop offset="70%" stop-color="${GOLD}" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <rect width="${W}" height="3" fill="url(#hairline)"/>
  <text x="76" y="${kickerBaseline}" font-family="Lora" font-size="21" letter-spacing="4.6" fill="${GOLD}">${esc(kicker.toUpperCase())}</text>
  ${titleRows}
  <rect x="76" y="524" width="104" height="1" fill="${GOLD}" fill-opacity="0.65"/>
  <text x="76" y="568" font-family="Lora" font-size="19" letter-spacing="4.4" fill="${GOLD}">PRO SE FAIR PLAY MEDIATION, LLC</text>
</svg>`);
}

// Refuse to run without Lora rather than shipping fallback-serif cards.
const loraPaths = [
  join(homedir(), ".local/share/fonts/Lora.ttf"),
  join(homedir(), ".fonts/Lora.ttf"),
];
if (!loraPaths.some((p) => existsSync(p))) {
  console.error(
    "Lora is not installed, so titles would render in a fallback serif.\n" +
      "See the install commands in the header comment of this file."
  );
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

for (const card of CARDS) {
  const src = join(PUBLIC, card.photo);
  const out = join(OUT, `${card.name}.jpg`);
  const buf = await sharp(readFileSync(src))
    .resize(W, H, { fit: "cover", position: card.position ?? "centre" })
    .composite([{ input: overlay(card) }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  const { default: fs } = await import("node:fs");
  fs.writeFileSync(out, buf);
  console.log(
    `${card.name}.jpg  ${String(Math.round(buf.length / 1024)).padStart(4)} KB  from ${card.photo}`
  );
}
console.log(`\n${CARDS.length} cards written to public/og/`);
