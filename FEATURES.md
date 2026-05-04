# FEATURES.md — Pro Se Fair Play Mediation site

Tracking what's shipped, what's planned, what's deferred, and what's been ruled out. Update as scope evolves.

**Last updated:** 2026-05-03

---

## Shipped

**Pages**
- **Coming-soon gate** at `/` (per client request) — `noindex`, minimal logo + tagline.
- **Homepage** at `/home` — editorial-legal design, photo-driven service cards (reveal on hover/tap), three-step process, cream CTA.
- **Service detail pages** — `/services/hourly-mediation`, `/services/parenting-plan`, `/services/court-packet`. Photo hero, facts grid, what's-included, when-it's-the-right-fit, "Book a Free Consultation" CTA.
- **About page** at `/about` — first-person bio, professional photo, "What is Mediation?" explainer.
- **Booking page** at `/book` — photo hero + Calendly inline embed (free 15-min consult). Custom intake questions inside Calendly cover phone, situation, conflict-check, disclaimer.
- **FAQ page** at `/faq` — photo hero + 11-question native HTML accordion + closing CTA.
- **Contact page** at `/contact` — email card linking to `info@`, secondary booking CTA.
- **Blog** at `/blog` + content collections + first article (`/blog/a-practical-guide-to-mediation`).
- **Legal pages** — `/legal/disclaimer` (verbatim attorney copy), `/legal/terms` (PDF + Word Engagement Agreement download), `/legal/privacy` (confidentiality, security, info collected).

**Site shell**
- Sticky inverted nav (navy bg, gold/cream type, gold CTA) with hamburger mobile menu.
- Footer with two-column nav (Learn + Legal), short disclaimer, copyright, build-version tag pulled from `package.json`.
- Lora (display) + Newsreader (body) typography pairing.
- Favicon — navy chip with gold scales mark.
- Husky pre-commit hook auto-bumps patch version on every commit.

**Infrastructure & integrations**
- **Static Astro 6 site** on Cloudflare Workers, deployed via `wrangler.jsonc`.
- **Custom domain + SSL** at https://prosefairplaymediation.com (and `www`); DNS managed in Cloudflare (nameservers swapped from GoDaddy).
- **Google Workspace email** at `info@prosefairplaymediation.com` ($8.40/mo). DKIM + SPF + DMARC configured.
- **Calendly Standard tier** ($12/mo) connected to Stripe, Google Calendar, and Zoom. Free 15-min consult is the only public event.
- **Stripe account** created (EIN verification pending). Placeholder products in place; live config will follow EIN clearance.

**Documentation**
- `CLAUDE.md` — project context for future Claude sessions.
- `FEATURES.md` (this file) — scope tracking.
- `DELIVERABLES.md` — client-facing handoff with accounts table. **Gitignored** (contains personal emails).

---

## Decided / Next

- **Stripe products** configured to match paid Calendly events: 2-Hour Mediation ($1,200), Half-Day ($2,400), Full-Day ($4,800). Held until EIN verification clears.
- **End-to-end booking + payment test** — $1 test charge through Calendly → Stripe → refund, then delete the test event.
- **First client review pass** — share live URL with client, collect feedback, iterate.
- **Go-live moment** — flip `/` from coming-soon to the real homepage once client signs off.

---

## Stretch goals

Agreed in principle but explicitly deferred. Not in current scope.

- **Intake form on the site** that gates the consultation (per client's later email request). Implementation path: form on site → Cloudflare Worker → email via Resend/Postmark free tier. Currently handled by Calendly's per-event custom questions instead.
- **Stripe webhook** to mark Calendly bookings as "paid" automatically — currently decoupled, reconciliation is manual.
- **Per-event public booking pages** for paid services (`/book/hourly-mediation`, etc.). Ruled out by client; left here as a design alternative if priorities shift.
- **CRM / dashboard for client** — client edits services, pricing, blog posts. Not in scope; client uses static markdown + handoffs.
- **Automated invoicing** — flagged in original RFP, ruled out as not part of agreed scope.
- **Email automation** beyond Calendly's built-in confirmations — not in scope.
- **Active SEO** — Google Search Console, content strategy for keywords. Foundation is solid (semantic HTML, meta tags, mobile-responsive); active SEO is its own engagement.
- **WCAG AA accessibility audit** — Dave has a certified friend lined up; not yet executed.

---

## Out of scope (decided NO)

- **Public paid booking pages** that bypass the consult funnel. Client wants manual gate: she emails private Calendly+Stripe links only after consult + agreement + payment.
- **Direct mediation booking on the site** — client must speak to her first.
- **Accepting Zelle, Apple Pay, etc. natively** beyond what Stripe provides out of the box.
- **Payment plans / split payments** between mediation parties — handled manually if at all.

---
