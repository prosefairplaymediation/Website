# FEATURES.md — Pro Se Fair Play Mediation site

Tracking what's shipped, what's planned, what's deferred, and what's been ruled out. Update as scope evolves.

**Last updated:** 2026-05-11

---

## Shipped

**Pages**
- **Coming-soon gate** at `/` (per client request) — `noindex`, minimal logo + tagline. Pending the go-live flip.
- **Homepage** at `/home` — editorial-legal design, photo-driven service cards (reveal on hover/tap), High-Profile & High-Conflict Resolution Services premium-tier callout with paragraph-by-paragraph reveal animation on scroll, cream CTA before footer.
- **Service detail pages** — `/services/hourly-mediation`, `/services/parenting-plan`, `/services/court-packet`. Photo hero, facts grid, single prose section, "Book a Free Consultation" CTA. Reached from the desktop nav's "Services" dropdown trigger and a labeled sub-group in the mobile menu.
- **About page** at `/about` — first-person bio (V4 copy), professional photo, credentials box ("Florida Supreme Court Certified Family Mediator").
- **Booking page** at `/book` — photo hero + "Support that works around your life" three-column section with Lucide icons (clock / handshake / file-text) + Calendly inline embed (free 15-min consult). Custom intake questions inside Calendly cover phone, situation, conflict-check, disclaimer.
- **FAQ page** at `/faq` — photo hero + 11-question native HTML accordion (V2 copy from client) + closing CTA.
- **Contact page** at `/contact` — email card + phone card (vanity `1 (866) 88-FORPROSE` / digit `1-866-883-6777`), secondary booking CTA.
- **Landing page** at `/landing` — photo hero + three service cards (with prices, Lucide icons, "Learn more" links) + Calendly embed. Built as a QR-code destination for Marie's in-person outreach.
- **Legal pages** — `/legal/disclaimer` (verbatim attorney copy, V2), `/legal/terms` (PDF + Word Engagement Agreement download), `/legal/privacy` (confidentiality, security, info collected).

**Site shell**
- Sticky inverted nav (navy bg, gold/cream type, gold CTA) with hamburger mobile menu. Desktop has "Services" dropdown listing the three service pages (hover/click/keyboard accessible, gold hairline separators, sliding gold-bar hover accent); mobile menu shows them as a labeled sub-group. Slogan "Where we level the playing field." appears in the desktop nav center area (≥1255px) and under the brand name on mobile. Mobile close button is a labeled box with "close" text. Mobile menu uses `inert` for accessibility (ANDI verified clean).
- Footer with Learn (About / FAQ / Contact) + Legal (Disclaimer / Agreement / Privacy) columns, copyright, build-version tag pulled from `package.json`. Footer disclaimer paragraph removed (canonical disclaimer is sufficient).
- Lora (display) + Newsreader (body) typography pairing.
- Maximalist favicon bundle: `.svg`, `.ico`, `.png` (96×96), apple-touch-icon (180×180), web app manifest, 192×192 and 512×512 Android icons. Branded webmanifest (navy theme color, cream background, proper short/long names).
- Husky pre-commit hook auto-bumps patch version on every commit.
- Em dashes removed site-wide per client stylistic preference.
- Hero-title period-color contrast standardized across `/faq`, `/book`, `/blog` (before deletion), `/contact`, service heroes, etc.

**Infrastructure & integrations**
- **Static Astro 6 site** on Cloudflare Workers, deployed via `wrangler.jsonc`.
- **Custom domain + SSL** at https://prosefairplaymediation.com (and `www`); DNS managed in Cloudflare (nameservers swapped from GoDaddy).
- **Google Workspace email** at `info@prosefairplaymediation.com` ($8.40/mo). DKIM + SPF + DMARC configured.
- **Calendly Standard tier** ($12/mo) connected to Stripe, Google Calendar, and Zoom. Free 15-min consult is the only public event.
- **Stripe** — fully configured, EIN verified, bank payouts enabled. Three paid products live: **Hourly Mediation** ($400 / hour, sold in 2/4/8-hour session blocks at $800 / $1,600 / $3,200), **Parenting Plan Preparation** ($400 flat), **Turn-Key Court Packet** ($600 flat).
- **Calendly Workflow** drafted to email the Engagement Agreement (Word + PDF links) on booking confirmation.

**SEO foundation**
- Sitemap automatically generated at `/sitemap-index.xml` via `@astrojs/sitemap` integration.
- Canonical link tags in `<head>` site-wide.
- Schema.org `ProfessionalService` JSON-LD with business name, founder (Marie + credential), services with prices, areaServed (Florida), knowsAbout for query relevance.
- Open Graph + Twitter Card meta tags for rich link previews (iMessage, Slack, Facebook, LinkedIn, Discord, etc.).
- Google Search Console verified via the GA tag (same Google account ownership); sitemap submitted, 12 pages discovered.
- Google Analytics 4 installed (Measurement ID: `G-NH6HKR18MZ`).

**Documentation**
- `CLAUDE.md` — project context for future Claude sessions.
- `FEATURES.md` (this file) — scope tracking.
- `DELIVERABLES.md` — client-facing handoff with accounts table. **Gitignored** (contains personal emails).

---

## Decided / Next

- **End-to-end booking + payment test** — $1 test charge through Calendly → Stripe → refund, then delete the test event.
- **Go-live moment** — flip `/` from coming-soon to the real homepage once client signs off. Backend (Stripe, Calendly, email, GA, GSC) is ready.
- **Coworker WCAG 2.1 AA audit pass** — formal accessibility audit by Dave's coworker. ANDI clean as of last check; coworker's full pass will identify any deeper issues.

---

## Stretch goals

Agreed in principle but explicitly deferred. Not in current scope.

- **Intake form on the site** that gates the consultation (per client's later email request). Currently handled by Calendly's per-event custom questions instead.
- **Stripe webhook** to mark Calendly bookings as "paid" automatically — currently decoupled; reconciliation is manual per client preference.
- **Per-event public booking pages** for paid services (`/book/hourly-mediation`, etc.). Ruled out by client; left here as a design alternative if priorities shift.
- **CRM / dashboard for client** — client edits services, pricing, blog posts. Not in scope; client uses static markdown + handoffs.
- **Automated invoicing** — flagged in original RFP, ruled out as not part of agreed scope.
- **Email automation** beyond Calendly's built-in confirmations + the Engagement Agreement workflow.
- **Google Business Profile** — would put Marie on Google Maps and in local-3-pack results. Deferred because service-area businesses now require video verification, which is more involved than current scope warrants.
- **`/legal/accessibility` statement page** — convention is to publish a public accessibility statement after the formal audit pass, declaring conformance level (WCAG 2.1 AA), audit date, and a contact path for reporting issues. Drafted in conversation, not yet built.
- **Active SEO content strategy** — keyword research, content calendar. Foundation is solid (semantic HTML, meta tags, mobile-responsive, schema, GSC); ongoing content strategy is its own engagement.

---

## Out of scope (decided NO)

- **Public paid booking pages** that bypass the consult funnel. Client wants manual gate: she emails private Calendly+Stripe links only after consult + agreement + payment.
- **Direct mediation booking on the site** — client must speak to her first.
- **Accepting Zelle, Apple Pay, etc. natively** beyond what Stripe provides out of the box.
- **Payment plans / split payments** between mediation parties — handled manually if at all.
- **Blog at `/blog`** — built initially with a content collection and one article, removed entirely per client decision. Replaced briefly by a `/services` overview page that was then also removed; the three deep `/services/*` pages remain as the canonical service destinations.
