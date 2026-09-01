# CLAUDE.md — Pro Se Fair Play Mediation site

**Last updated:** 2026-06-26

## Overview

Freelance brochure/services site for a Florida family-law **mediation + document preparation** practice serving self-represented (pro se) parties. **Not a law firm** — legal disclaimers are load-bearing, not decorative.

**Launched 2026-05-26** at https://prosefairplaymediation.com — coming-soon gate at `/` was replaced with the real homepage (v1.0.x). Site is live and indexable.

## Tech Stack

- **Astro 6** (static SSG, strict TypeScript)
- **Cloudflare Workers** for deployment (`wrangler.jsonc`)
- **One server-side route** (added 2026-09-01). `worker/index.ts` handles
  `/api/lead` and nothing else: it takes a capture-form submission and creates
  the contact in **Referent** (the CRM) over MCP, so the API token stays a
  Worker secret instead of being published in a page. Every other URL is still
  a static asset, served without the Worker running at all
  (`run_worker_first: ["/api/*"]`). Setup, and what is still unverified about
  Referent's API, are in `docs/marketing/referent-crm.md`.
  `npm run test:referent` exercises the route against a stand-in MCP server.
- **Node 22+** (enforced via Volta)
- **Git:** private GitHub repo on the **`prosefairplaymediation`** account (migrated here 2026-06-26); every push triggers Cloudflare rebuild. **Push routing is account-critical. See "Git remote routing" below.**
- **Husky pre-commit hook** auto-bumps `package.json` patch version

## Git remote routing (ACCOUNT-CRITICAL — read before any push)

This repo intentionally pushes to a **separate GitHub account** (`prosefairplaymediation`), **NOT** Dave's normal personal/work account (`dleepernoinc`). This is deliberate handover prep. The client will eventually own this repo. Pushing to the wrong account leaks the project into Dave's personal account.

**How the routing works (automatic; nothing to toggle per push):**
- `origin` → `git@github-prosefp:prosefairplaymediation/Website.git`
- `github-prosefp` is an SSH host alias in `~/.ssh/config` pointing at `github.com`, using the dedicated key `~/.ssh/id_ed25519_prosefp` with `IdentitiesOnly yes`. That key is attached **only** to the `prosefairplaymediation` account.
- Therefore `git push` (to `origin`) always authenticates as `prosefairplaymediation`. Dave's normal account (HTTPS + Git Credential Manager, used by his other repos) is never involved for this repo.
- `old-origin` → the old `https://github.com/dleepernoinc/prosefairplaymediation.git`, kept ONLY as an emergency fallback.

**Hard rules:**
- **Always push to `origin`. NEVER push to `old-origin`.**
- **Never change `origin`** to the `dleepernoinc` remote, and never re-add a `dleepernoinc` remote as `origin`.
- Before pushing, if there is any doubt, verify with `git remote get-url origin`. It must be `git@github-prosefp:prosefairplaymediation/Website.git`. If it shows anything else, **STOP and flag it** rather than pushing.
- Committing/pushing still requires Dave's explicit go-ahead (unchanged).
- Cloudflare builds the live site from this new repo as of 2026-06-26.

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
- Gold `#C49A4B`, gold-deep `#7C5E22` (gold-deep darkened from #9E7C34 to clear WCAG AA 4.5:1 on cream surfaces — only use the lighter #C49A4B as text on dark backgrounds where it passes contrast)
- Cream `#FAF7F0`, cream-warm `#F3ECDC`, paper `#FFFDF7`
- Ink `#1A1C22`, slate `#5C6070`, divider `#E8DFCA`

**Consistency rules — follow these before adding any page or component.** The
policy pages drifted once (different heading sizes, a grey rule where the site
uses a gold one, links missing the gold underline) because they were styled from
scratch instead of reusing what existed. Do not repeat that:

- **Never hard-code a color.** Use the tokens above. The only sanctioned
  exceptions are annotated in place: `#fff` behind the Calendly iframe
  (`InlineScheduler`) and behind the Zelle QR code (`/pricing`), both of which
  need true white. `ChatWidget`'s `#B9C0D6` predates the token set and should be
  tokenized if that widget is ever reworked.
- **Never set a raw font stack.** `var(--font-display)` (Lora) for headings,
  `var(--font-body)` (Newsreader) for prose.
- **Use the type scale.** Body prose is `var(--step-1)` / line-height 1.7. Page
  h2s are `var(--step-3)`. Section headings inside a stacked block
  (`InlineScheduler`, `FaqBlock`, `LeadCapture`) are
  `clamp(1.6rem, 3.4vw, 2.3rem)` — these three render one after another on most
  pages, so they must match exactly.
- **Any policy or legal page uses `src/layouts/LegalLayout.astro`.** It owns the
  header chrome, `.legal-prose`, `.section-h2` (gold 2px rule) and
  `.section-h3`. `/legal/privacy`, `/legal/disclaimer`, `/legal/terms`,
  `/refund` and `/cancellation` all run through it. Write plain `<h2 class=
  "display section-h2">`, `<h3 class="section-h3">`, `<p>`, `<ul>` and links,
  and the page will match the others automatically. Do not re-declare the
  chrome CSS in a page.
- **Links inside prose** get the gold-underline treatment automatically inside
  `.legal-prose`; elsewhere use `class="link-underline"`.

**Aesthetic:** editorial-legal. Gold hairlines, drop caps, pull quotes, generous white space. Centered hero (home only), left-aligned elsewhere.

**Navigation:** inverted — navy-deep sticky bar with gold/cream text and gold CTA button. Mobile menu inherits dark palette.

**Photo-hero pattern:** `/book`, `/faq`, `/landing`, and the five service detail pages all use a full-width photo background + navy diagonal gradient overlay (standard: rgba 15,27,50,0.78 → 27,42,74,0.62 → 27,42,74,0.78; darker variant: 0.9 → 0.78 → 0.9), cream/gold text, and a soft fade-to-cream bottom. Repeated structure is intentional rhythm; image varies per page (currently: `justice_globe.jpg` for `/book` and `/landing`, `scales.jpg` for `/faq`, `handshake4.jpg` for hourly-mediation, `documents2.jpg` for parenting-plan, `stampgavel.jpg` for court-packet using the darker overlay variant, `Goldservice.jpg` for gold-service, `Notary.jpg` for notary). All content photos in `public/` are JPG; only logos, favicons, manifest icons, and QR codes remain PNG. Hero h1 trailing periods render gold across all pages (wrapped in `.display-italic`); CTA titles unchanged. Service-page hero ledes still use em dashes; trim if you touch them.

**Link-preview cards:** the same treatment at 1200×630, generated into `public/og/` by `scripts/generate-og-images.mjs` — the page's own hero photo, the darker overlay variant (previews render small), gold letterspaced kicker, Lora title with a gold trailing period, gold hairline top, wordmark bottom-left. Titles are set in real Lora, which is a system-font lookup at generation time, not a webfont. `/`, the legal pages, `/pay` and the thank-you pages keep the site card `/og-image.jpg` on purpose.

**Portrait pattern:** Five pages carry a portrait photo of Marie alongside content — `/about` (sticky beside bio with a warm gold radial aura + cream-blend overlay since that photo has cooler studio lighting), `/faq` (sticky beside the question list), `/landing` (right of the booking text in `.landing-book-row`), `/contact` (right of the header), `/documents` (right of the header). Frame chrome (paper backing, gold corner ticks) was removed at client request — portraits now use only a subtle drop-shadow. Frame-less treatment is intentional, not an oversight. Two-column header pattern (text 1fr / portrait 20rem) is shared between `/contact` and `/documents` for visual consistency.

## Conventions & Content Rules

- **Legal disclaimer language** must be verbatim from client's attorney-reviewed copy. Lives only on `/legal/disclaimer` (canonical, linked from the footer Legal column) — per client decision the disclaimer page is sufficient; do not paraphrase, and do not re-add a footer or per-page disclaimer block without asking.
- **No client name in commit messages** — refer generically ("per client selection", "per client feedback").
- **Leave unbuilt nav links as raw 404s** — dead links are the TODO list. Don't stub "coming soon" placeholders.
- **Content expansion:** client-supplied text is often AI-generated and too long. Trim to essentials; don't expand.
- **Scope:** Stripe (live products + Payment Links for self-pay on `/pay`), Calendly Standard tier, static pages. No custom backend, CMS, or dashboard. Stripe and Calendly are decoupled — Marie manually qualifies clients; no Stripe-Calendly automation beyond the built-in payment-on-booking flow. Self-pay (Parenting Plan + Court Packet) added late in scope per client request, short-circuiting the consult-first model; Hourly Mediation remains consult-first (no self-pay link).

## Compliance review (STANDING CLIENT INSTRUCTION)

The client has asked, explicitly and as a standing rule, to be kept in compliance
on **every** request. Treat this as part of the definition of done, not an
optional extra. Raise concerns concisely and then keep building — flag, don't
block, unless proceeding would actually be unsafe.

Check every change against these, and say so plainly when one is engaged:

- **Not a law firm.** No page, email, chat reply, or metadata may give legal
  advice, predict an outcome, or state what a visitor should do in their own
  case. Describe the *process*; send the *legal question* to an attorney. This
  is why the FAQ answers about binding agreements and required forms end by
  pointing at counsel.
- **Certification is PENDING and must not be advertised.** The Florida Supreme
  Court family mediator certification was not approved as of 2026-08. It was
  removed from the schema, the About credentials, and the About meta
  description. Do not restore it anywhere until the client confirms approval.
  Restore points are listed in a comment in `BaseLayout.astro`.
- **Non-family work is private mediation.** Business, civil, real estate, and
  pre-litigation matters are framed as private mediation chosen by both parties,
  never as court-ordered work, and carry no certification claim. Florida
  certification is per-type; court-ordered civil matters generally require
  County or Circuit Civil certification.
- **Disclaimer text is verbatim or quoted, never paraphrased.** See the rule
  above. Quoting the opening of `/legal/disclaimer` and linking to it is fine.
- **Third-party reviews get no `Review`/`AggregateRating` markup.** The Google
  reviews are third-party; marking them up as our own review snippets violates
  Google's structured-data guidelines and risks a manual action. Displaying the
  text is fine.
- **Outbound email needs CAN-SPAM basics.** Physical postal address (present),
  a working unsubscribe (the sending platform must populate it), accurate
  from/subject. Email-only scope: telephone, SMS, and fax outreach raise TCPA
  and Fla. Stat. § 501.059 exposure and separate do-not-call scrubbing duties.
- **No fabricated social proof.** Never invent a review, testimonial, or
  credential, including as placeholder or layout-test content that could ship.

- **The client files. We never do.** Settled by the client 2026-08: "clients are
  responsible to file with the court." The disclaimer is authoritative, and
  `/process/how-mediation-works` was corrected to match (it had claimed the
  settlement agreement "is submitted to the court on the parties' behalf as part
  of our concierge mediation service"). Documents are prepared **court-ready**;
  filing is the client's. Never write copy implying we submit, e-file, or
  transmit anything to a court, and never use "court-submitted" as a
  description. Approved phrasings already on the site: "Clients are responsible
  for filing their own documents with the appropriate court"
  (`/legal/disclaimer`) and "Clients are responsible for filing the completed
  Parenting Plan with the court independently" (`/services/parenting-plan`).
  Note "concierge" elsewhere refers only to the phone answering team on
  `/contact`, not to any filing service.

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
| `/` | **Real homepage** (formerly coming-soon gate, flipped at launch). Stacked hero, animated "Level" underline, photo service cards (reveal on hover/tap), Gold Service premium-tier callout with paragraph-by-paragraph reveal animation (gold "Gold Service" wordmark stays visible while cream text fades in around it), cream CTA before footer. Lives in `src/pages/index.astro`. |
| `/services/hourly-mediation` | Photo hero + facts grid + prose section + Gold Service callout + CTA (CTA on cream-warm to keep the cream/cream-warm alternation) |
| `/services/divorce-mediation` | SEO hub for the practice's highest-volume term. Photo hero (`handshake2.jpg`) + facts grid + prose with `<h2>` subheads and a four-item list routing to parenting-plan, child-support-rules, alimony-rules, and real-estate-mediation + CTA. Carries its own `Service` JSON-LD. Delivered through Hourly Mediation, so it links there for session mechanics and the refund policy rather than restating them. |
| `/services/gold-service` | Photo hero (`Goldservice.jpg`) + embedded `<GoldService />` callout + CTA. Dedicated landing page for the premium tier; CTA copy emphasizes discretion/privacy/professionalism |
| `/services/parenting-plan` | Same layout pattern, cross-references court packet from facts-note. Notary line clarifies it's a $10 add-on (not included), with link to `/services/notary` |
| `/services/court-packet` | Same layout pattern (darker overlay since photo has bright paper). Notary included at no extra cost |
| `/services/notary` | Photo hero (`Notary.jpg`) + prose with two subheaded blocks linking to court-packet (included) and parenting-plan ($10 add-on) + closing thank-you + CTA |
| `/about` | Magazine profile with bio, sticky portrait of Marie (`new_Aboutme.jpg`) with warm gold radial aura + cream-blend overlay to knit the cooler studio photo into the cream/gold palette, credentials box. |
| `/book` | Photo hero + "Support that works around your life" three-column section with Lucide icons + Calendly inline embed (free 15-min consult) |
| `/faq` | Photo hero + 11-question native HTML accordion + closing CTA. Sticky portrait (`new_FAQ.jpg`) beside the question list. |
| `/contact` | Two-column header: text on left ("Get in Touch / Have a question?"), portrait (`New_Contact.jpg`) on right. Email + phone + eFax cards below, secondary booking CTA. |
| `/documents` | Three-section portal: Intake Forms (`Parental_Decisions_Intake_PSFP.docx`, `Financial_Info_Intake_PSFP.docx`), Engagement Agreement (PDF + Word downloads inlined), and the official Florida Family Law Forms (external `flcourts.gov` link). Same two-column header pattern as `/contact` with portrait on right; alternating cream / cream-warm bands per section. Download cards use container queries (`container-type: inline-size` on the stack) so labels scale with the card column and collapse cleanly to single-column at narrow widths. |
| `/landing` | QR-code destination — photo hero, three service cards with prices + Lucide icons. Below, a two-column "Book a free consultation" row with text/CTA/pay-strip on the left and a portrait (`new_Landing.jpg`) on the right, then the Calendly embed full-width. |
| `/process` | Index for the five guides, most-recently-revised first. Carries `CollectionPage` schema. Reachable from the nav as "All Guides" — the dropdown trigger is a `<button>`, so without that entry the page is unreachable from the nav. |
| `/services` | Index for the six service pages, driven by `src/lib/services.ts`. |
| `/areas-served` | Local SEO, built as one substantive page rather than per-city doorway pages. Per-county sections for Palm Beach (15th), Broward (17th), Miami-Dade (11th) and Martin/St. Lucie (19th), each carrying facts that genuinely differ — chiefly that the circuits cap their staff mediation programmes near $100k combined income, which is the factual reason a private mediator exists. **Deliberately frames every circuit programme as the court's and this practice as the private alternative, because court-referred family work needs the pending certification.** Linked from the footer, not the nav (nav is already at seven top-level items). |
| `/404` | Branded not-found page listing the five routes people actually want, plus phone and email. `noindex`, excluded from the sitemap. |
| `/legal/disclaimer` | Verbatim attorney-reviewed disclaimer text. Includes a WCAG 2.1 AA accessibility statement section. |
| `/legal/terms` | Engagement Agreement download in PDF and Word formats |
| `/legal/privacy` | Confidentiality of mediation, website security, data collection |
| `/pay` | Self-pay landing. Engagement-Agreement checkbox (gates Pay buttons) + two product cards (Parenting Plan $400, Court Packet $600). Buttons are `<a href>` to live Stripe Payment Links (`buy.stripe.com/...`) — zero backend. After-payment redirect to `/thank-you` is configured on the Stripe side per Payment Link. Checkbox link opens `/pay/agreement` in a new tab. |
| `/pay/agreement` | Readable HTML version of the Engagement Agreement (10 numbered sections + contact-block header), styled like the other legal pages. Opens in a new tab from the `/pay` checkbox. `noindex`; excluded from sitemap. `/legal/terms` still hosts the canonical PDF + Word downloads. |
| `/thank-you` | Post-payment landing — Stripe redirects here on success. Centered "Thanks, Marie will contact you shortly to discuss your Document Preparation requirements." `noindex` (excluded from sitemap, robots meta set). "Back to home" CTA points to `/`. |

## Pages (Pending / Not Building)

| Route | Status | Notes |
|-------|--------|-------|
| `/intake` | Explicitly NO | Calendly's per-event custom questions (phone, situation, conflict-check, disclaimer) cover the need |


## Integrations

All decoupled per client decision (Marie manually qualifies clients; no Stripe-Calendly automation).

| Service | Purpose | Status |
|---------|---------|--------|
| Google Workspace | Email (`info@prosefairplaymediation.com`), ~$8.40/mo | Live; DKIM, SPF, DMARC configured in Cloudflare DNS |
| Calendly Standard | Booking + Google Calendar / Zoom auto-attach; Stripe integration available | Live; free 15-min consult public; paid event URLs private (Marie distributes) |
| Stripe | Payment processing; EIN verified; bank payouts enabled | Live; three paid products configured — Hourly Mediation ($600/hour, sold in 2/4/8-hour blocks at $1,200 / $2,400 / $4,800), Parenting Plan ($400 flat), Turn-Key Court Packet ($600 flat) |
| Cloudflare | DNS + Workers deployment | Live; nameservers moved from GoDaddy; both domain + www as custom domains |
| Google Analytics 4 | Pageview + behavior tracking | Live; Measurement ID `G-NH6HKR18MZ`; gtag installed in BaseLayout. Custom events: **Pay funnel** — `pay_intent_click` (entry buttons on /home, /landing, /services/parenting-plan, /services/court-packet — params: `source`, `product`), `pay_checkout_click` (the actual Pay Now buttons on /pay — params: `product`, `value`, `currency`), `pay_complete` (fires on /thank-you load — `source: 'stripe_redirect'`). **Booking** — `book_intent_click` (single delegated listener in BaseLayout, fires on any click on `<a href="/book">` site-wide — param: `source` = the path the click came from). Actual purchase data lives in Stripe Dashboard. |
| Google Search Console | Search-indexing monitoring + sitemap | Verified via the GA tag (same account ownership, no DNS TXT needed); sitemap submitted at `/sitemap-index.xml`, 12 pages discovered |

## Key Components

| File | Purpose |
|------|---------|
| `src/layouts/BaseLayout.astro` | HTML shell, font loading, nav, footer. Optional `noindex` prop for `/pay/agreement` and `/thank-you`. Optional `ogImage` / `ogImageAlt` props for the per-page link-preview card (see below); default is the site card `/og-image.jpg`. Delegated `book_intent_click` GA4 event listener on any `/book` link. |
| `scripts/generate-og-images.mjs` | Builds the 17 per-page link-preview cards in `public/og/`. **Not part of `npm run build`** — outputs are committed, so run it only when a card changes. Needs Lora installed locally (`~/.local/share/fonts`); it exits rather than shipping fallback-serif titles. Add a card here, then set `ogImage` on the page. `/process` and all guides deliberately share `og/guides.jpg` because the weekly workflow publishes new guides with no human in the loop. |
| `src/components/Nav.astro` | Sticky nav (navy-deep bg, gold/cream text, gold CTA, mobile hamburger). Brand mark uses `/GOLD-LOGO.png` and links to `/`; brand block locked with `flex-shrink: 0` to prevent compression on narrow widths. Services dropdown lists all six service pages (Divorce, Hourly, Gold Service, Parenting Plan, Court Packet, Notary). Top-level order: Services → FAQ → Documents → Contact. Mobile menu caps its height at `min(48rem, calc(100dvh - 5rem))`, scrolls internally with `overscroll-behavior: contain`, and locks body scroll while open (JS) so swipes don't bleed through to the page underneath. |
| `src/components/Footer.astro` | Two-column nav (Learn + Legal), copyright, `v{version}` tag from package.json |
| `src/styles/global.css` | Design tokens, type primitives, button/link styles, page-load animation |
| `src/pages/index.astro` | The real homepage. Service-card data, reveal toggle (touch tap-to-reveal + keyboard focus-within reveal + Escape dismiss). Lives at `/` since the 2026-05-26 launch flip. |
| `src/components/GoldService.astro` | Dark-box "Gold Service" premium-tier callout (markup + CSS + paragraph-fade JS). Used by `/` and `/services/hourly-mediation` and `/services/gold-service`. Gold `<em>` wordmarks stay visible; cream prose fades in around them. |
| `src/pages/landing.astro` | QR-code landing page — service cards + Calendly embed |
| `astro.config.mjs` | Sitemap integration; site URL configured for canonical generation. Excludes only `/thank-you/` and `/pay/agreement/` (the `/` exclusion was removed at launch). |
| `src/lib/articles.ts` | Single source for the `/process` guides: slug, title, kicker, blurb, and real published/updated dates read from git history. Consumed by the `/process` index and by `ArticleSchema`. Add a guide here or it will not appear anywhere. |
| `src/lib/services.ts` | Same shape for the six service pages, including the prices that must match the pages and the Stripe products. Note `divorce-mediation` is listed for display only — it keeps its own inline `Service` block, so adding `<ServiceSchema>` to that page would emit two. |
| `src/components/ArticleSchema.astro` | One-line `BlogPosting` JSON-LD for a `/process` page (type set per client instruction; `BlogPosting` is a subtype of `Article`, so the same properties apply). **Throws at build time** on a slug with no entry in `articles.ts`, so a guide cannot ship without its metadata. The `/process` index's `CollectionPage.hasPart` uses the same type — change both together or the library describes itself two ways. |
| `src/components/ServiceSchema.astro` | Same for `Service` on a `/services` page. |
| `src/components/ArticleLayout.astro` | Header + prose styling + CTA for generated articles, so a generated file is content only. The five hand-written guides keep their own inline styles; computed values were checked to match. |
| `src/components/Breadcrumbs.astro` | Visible trail plus `BreadcrumbList` schema, on 12 pages. `tone="dark"` over the photo heroes, `tone="light"` on cream headers. Both halves together deliberately — schema without a visible trail marks up a hierarchy the visitor cannot see. |
| `public/_headers` | Cloudflare response headers: nosniff, referrer policy, SAMEORIGIN, permissions policy, plus cache lifetimes. **No CSP** — the site loads Google Fonts, Analytics, Calendly, Stripe, YouTube and Featurable, so one written without a report-only pass would silently break booking or payment. |

## Automation (READ THIS BEFORE TOUCHING `/process`)

**This repository publishes to the live site by itself.** Two GitHub Actions
workflows run without a human in the loop. Neither is dormant.

### Publishing cadence: one article every three weeks, ON REQUEST (2026-08-24)

**The automated schedule is OFF and this is the live arrangement.** The client
decided against creating the API key needed for automatic publishing, and asked
instead for **one new `/process` article every three weeks, written on request.**
Treat that cadence as a standing instruction: if she asks for "the next one",
take the first `queued` topic from `content/topic-queue.json`, write it by hand
to the same standards the generator enforces, and mark the entry
`"status": "published"` with `publishedOn` and `"publishedBy": "hand"`.

Writing one by hand means meeting the generator's own bar, not a lower one:
research from primary sources (flcourts.gov, flsenate.gov, leg.state.fl.us)
before writing a word, the compliance rules in `generate-article.mjs`'s `RULES`
string, no em dashes, 300–1200 words, `ArticleLayout` so the page is content
only, registered in `articles.ts`, and `scripts/compliance-check.mjs` run
against the built HTML before committing.

The cron stays commented out until `ANTHROPIC_API_KEY` exists. It is already
retargeted to the three-week cadence, and `generate-article.mjs` carries a
cadence guard that drops any *scheduled* run inside 18 days of the last
published article. Manual runs are never dropped.

### `.github/workflows/weekly-article.yml`

Written to publish one article a week, straight to `main`, with no review step:
the client chose full automation after the risks were laid out, so the entire
safety story is machine-checkable gates. **Every gate is blocking, and none of
them should be softened to get a draft through.** The schedule is currently
disabled per the section above, but the gates still apply to manual runs and to
hand-written articles.

The generator is `scripts/generate-article.mjs`. Flow: take the first `queued`
topic from `content/topic-queue.json` → research it with the `web_search`
server tool → draft it under the compliance rules via structured output → run
the compliance gate → write the page → register it in `articles.ts` → build.
Commits only if every step passes.

- An **empty queue exits 78**, which the workflow treats as a clean no-op. That
  is correct behaviour, not a failure. A blog with nothing to say should say
  nothing.
- The workflow **proves the compliance gate still catches a known violation**
  before trusting it to clear a draft. A gate that silently stopped matching
  would pass everything.
- Requires the repository secret `ANTHROPIC_API_KEY`. Without it the run fails
  at the generate step and publishes nothing, which is the safe failure.

### `scripts/compliance-check.mjs`

The gate. Seven rules, each tracing to a standing rule in the Compliance
section above: legal advice, outcome prediction, certification claims,
we-file language, permanent alimony as current, fabricated proof, law-firm
framing. Run on the draft and again on the rendered HTML.

Calibration matters more than the rules. A first pass flagged five phrases on
the live site, all false positives — it caught the Documents page's "everything
you need to get started" and the disclaimers themselves. Two fixes: a directive
only counts as advice when it points at a legal verb, and negations are tested
across a surrounding window because disclaimers put the "not" before the phrase
as often as after. **Current state: 9/9 known violations caught, 0 findings
across the whole live site.** Re-run it against `dist/` after any content change
that might trip it.

### `.github/workflows/indexnow.yml`

Runs `scripts/indexnow.mjs` on pushes to `main` touching `src/`, `public/` or
the Astro config. One POST reaches Bing, Yandex, Naver and Seznam; Google does not
participate. Matters here because Bing's index is what ChatGPT's web search
leans on. Waits three minutes first so Cloudflare has finished deploying.

Ownership is proved by `public/680bede00d26f37ea47d4561099c5093.txt`, which
must contain exactly that key and nothing else. **If that file is renamed or
gains a trailing newline, submissions start failing** — the script fetches it
first and refuses to submit rather than failing silently.

## Documentation

- `CLAUDE.md` — project context for future Claude sessions (this file)
- `FEATURES.md` — scope tracking, in-progress, deferred, out-of-scope decisions
- `DELIVERABLES.md` — client handoff (accounts, credentials, deliverables). **Gitignored** (contains personal emails)

## Deploy Flow

1. Make changes locally → `npm run dev` to test
2. `git commit` → pre-commit hook bumps patch version (minor/major: `npm version minor --no-git-tag-version` first)
3. `git push` → Cloudflare picks up, rebuilds, deploys (~1–3 min)
4. Verify `v{version}` tag in footer on production matches local build
