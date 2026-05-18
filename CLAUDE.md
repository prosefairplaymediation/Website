# CLAUDE.md — Pro Se Fair Play Mediation site

**Last updated:** 2026-05-11

## Overview

Freelance brochure/services site for a Florida family-law **mediation + document preparation** practice serving self-represented (pro se) parties. **Not a law firm** — legal disclaimers are load-bearing, not decorative.

Live at https://prosefairplaymediation.com.

## Tech Stack

- **Astro 6** (static SSG, strict TypeScript)
- **Cloudflare Workers** for deployment (`wrangler.jsonc`)
- **Node 22+** (enforced via Volta)
- **Git:** private GitHub repo; every push triggers Cloudflare rebuild
- **Husky pre-commit hook** auto-bumps `package.json` patch version

## Local Development

```bash
npm run dev     # http://localhost:4321
npm run build   # static output to ./dist
```

Version auto-increments on every commit. Displayed as `v{x.y.z}` in footer for deploy verification. To bump minor/major: `npm version minor --no-git-tag-version` (hook adds patch on top).

## Design System

**Fonts:** Lora (display) + Newsreader (body) via Google Fonts in `BaseLayout.astro`.

**Palette** (tokens in `src/styles/global.css`):
- Navy `#1B2D5A`, navy-deep `#12214A`
- Gold `#C49A4B`, gold-deep `#9E7C34`
- Cream `#FAF7F0`, cream-warm `#F3ECDC`, paper `#FFFDF7`
- Ink `#1A1C22`, slate `#5C6070`, divider `#E8DFCA`

**Aesthetic:** editorial-legal. Gold hairlines, drop caps, pull quotes, generous white space. Centered hero (home only), left-aligned elsewhere.

**Navigation:** inverted — navy-deep sticky bar with gold/cream text and gold CTA button. Mobile menu inherits dark palette.

**Photo-hero pattern:** `/book`, `/faq`, `/landing`, and the three service detail pages all use a full-width photo background + navy diagonal gradient overlay (standard: rgba 15,27,50,0.78 → 27,42,74,0.62 → 27,42,74,0.78; darker variant: 0.9 → 0.78 → 0.9), cream/gold text, and a soft fade-to-cream bottom. Repeated structure is intentional rhythm; image varies per page (currently: `justice_globe.jpg` for `/book` and `/landing`, `scales.jpeg` for `/faq`, `handshake4.jpeg` for hourly-mediation, `documents2.jpeg` for parenting-plan, `stampgavel.png` for court-packet using the darker overlay variant). Service-page hero ledes still use em dashes; trim if you touch them.

## Conventions & Content Rules

- **Legal disclaimer language** must be verbatim from client's attorney-reviewed copy. Lives only on `/legal/disclaimer` (canonical, linked from the footer Legal column) — per client decision the disclaimer page is sufficient; do not paraphrase, and do not re-add a footer or per-page disclaimer block without asking.
- **No client name in commit messages** — refer generically ("per client selection", "per client feedback").
- **Leave unbuilt nav links as raw 404s** — dead links are the TODO list. Don't stub "coming soon" placeholders.
- **Content expansion:** client-supplied text is often AI-generated and too long. Trim to essentials; don't expand.
- **Scope:** Stripe (live products), Calendly Standard tier, static pages. No custom backend, CMS, or dashboard. Stripe and Calendly are decoupled — Marie manually qualifies clients; no Stripe-Calendly automation beyond the built-in payment-on-booking flow.

## Development Guidelines

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Pages (Built)

| Route | Purpose |
|-------|---------|
| `/` | Coming-soon gate (logo + "Launching soon", `noindex`) |
| `/home` | Real homepage — stacked hero, animated slogan, photo service cards (reveal on hover/tap), Gold Service premium-tier callout with paragraph-by-paragraph reveal animation (gold "Gold Service" wordmark stays visible while cream text fades in around it), cream CTA before footer |
| `/services/hourly-mediation` | Photo hero + facts grid + prose section + Gold Service callout + CTA (CTA on cream-warm to keep the cream/cream-warm alternation) |
| `/services/parenting-plan` | Same layout pattern, cross-references court packet from facts-note |
| `/services/court-packet` | Same layout pattern (darker overlay since photo has bright paper) |
| `/about` | Magazine profile with bio, professional photo, "What is Mediation?" explainer |
| `/book` | Photo hero + "Support that works around your life" three-column section with Lucide icons + Calendly inline embed (free 15-min consult) |
| `/faq` | Photo hero + 11-question native HTML accordion + closing CTA |
| `/contact` | Email card + phone card (vanity + digits) + eFax card + secondary booking CTA |
| `/landing` | QR-code destination — photo hero, three service cards with prices + Lucide icons, Calendly embed below |
| `/legal/disclaimer` | Verbatim attorney-reviewed disclaimer text |
| `/legal/terms` | Engagement Agreement download in PDF and Word formats |
| `/legal/privacy` | Confidentiality of mediation, website security, data collection |

## Pages (Pending / Not Building)

| Route | Status | Notes |
|-------|--------|-------|
| `/pay` | Deferred | Stripe Payment Links. Client flow: consult-first → manual quote/payment after agreement |
| `/intake` | Explicitly NO | Calendly's per-event custom questions (phone, situation, conflict-check, disclaimer) cover the need |


## Integrations

All decoupled per client decision (Marie manually qualifies clients; no Stripe-Calendly automation).

| Service | Purpose | Status |
|---------|---------|--------|
| Google Workspace | Email (`info@prosefairplaymediation.com`), ~$8.40/mo | Live; DKIM, SPF, DMARC configured in Cloudflare DNS |
| Calendly Standard | Booking + Google Calendar / Zoom auto-attach; Stripe integration available | Live; free 15-min consult public; paid event URLs private (Marie distributes) |
| Stripe | Payment processing; EIN verified; bank payouts enabled | Live; three paid products configured — Hourly Mediation ($600/hour, sold in 2/4/8-hour blocks at $1,200 / $2,400 / $4,800), Parenting Plan ($400 flat), Turn-Key Court Packet ($600 flat) |
| Cloudflare | DNS + Workers deployment | Live; nameservers moved from GoDaddy; both domain + www as custom domains |
| Google Analytics 4 | Pageview + behavior tracking | Live; Measurement ID `G-NH6HKR18MZ`; gtag installed in BaseLayout |
| Google Search Console | Search-indexing monitoring + sitemap | Verified via the GA tag (same account ownership, no DNS TXT needed); sitemap submitted at `/sitemap-index.xml`, 12 pages discovered |

## Key Components

| File | Purpose |
|------|---------|
| `src/layouts/BaseLayout.astro` | HTML shell, font loading, nav, footer |
| `src/components/Nav.astro` | Sticky nav (navy-deep bg, gold/cream text, gold CTA, mobile hamburger) |
| `src/components/Footer.astro` | Two-column nav (Learn + Legal), copyright, `v{version}` tag from package.json |
| `src/styles/global.css` | Design tokens, type primitives, button/link styles, page-load animation |
| `src/pages/home.astro` | Homepage logic, service-card data, reveal toggle |
| `src/components/GoldService.astro` | Dark-box "Gold Service" premium-tier callout (markup + CSS + paragraph-fade JS). Used by `/home` and `/services/hourly-mediation`. Gold `<em>` wordmarks stay visible; cream prose fades in around them. |
| `src/pages/landing.astro` | QR-code landing page — service cards + Calendly embed |
| `astro.config.mjs` | Sitemap integration; site URL configured for canonical generation |

## Documentation

- `CLAUDE.md` — project context for future Claude sessions (this file)
- `FEATURES.md` — scope tracking, in-progress, deferred, out-of-scope decisions
- `DELIVERABLES.md` — client handoff (accounts, credentials, deliverables). **Gitignored** (contains personal emails)

## Deploy Flow

1. Make changes locally → `npm run dev` to test
2. `git commit` → pre-commit hook bumps patch version (minor/major: `npm version minor --no-git-tag-version` first)
3. `git push` → Cloudflare picks up, rebuilds, deploys (~1–3 min)
4. Verify `v{version}` tag in footer on production matches local build
