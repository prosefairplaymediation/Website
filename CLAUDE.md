# CLAUDE.md — Pro Se Fair Play Mediation site

## Overview

Freelance brochure/services site for a Florida family-law **mediation + document preparation** practice serving self-represented (pro se) parties. **Not a law firm** — legal disclaimers are load-bearing, not decorative.

## Stack

- **Astro 6** (static SSG, strict TypeScript) at the repo root
- **Cloudflare Workers** static-assets deploy via `wrangler.jsonc`
- Custom domain live at https://prosefairplaymediation.com (and www)
- **Node 22+** required. Use Volta for version management.
- Git: private repo on GitHub. Every `git push` triggers a Cloudflare rebuild.

## Local dev

```bash
npm run dev           # http://localhost:4321
npm run build         # static output to ./dist
```

Every `git commit` auto-bumps the **patch** version in `package.json` via `.husky/pre-commit`. Displayed as `v{version}` in the site footer for visual deploy verification.

## Design system

- **Fonts:** **Lora** (display), **Newsreader** (body). Loaded via Google Fonts in `src/layouts/BaseLayout.astro`. Additional fonts loaded for `/fonts` preview — safe to remove after that page is deleted.
- **Palette** (tokens in `src/styles/global.css`):
  - Navy `#1B2D5A`, navy-deep `#12214A`
  - Gold `#C49A4B`, gold-deep `#9E7C34`
  - Cream `#FAF7F0`, cream-warm `#F3ECDC`, paper `#FFFDF7`
  - Ink `#1A1C22`, slate `#5C6070`, divider `#E8DFCA`
- **Aesthetic:** editorial-legal classicism — roman numeral section markers, gold hairlines, drop caps, pull quotes, generous negative space. Centered hero, otherwise mostly left-aligned.

## Content rules (non-negotiable)

- **Legal disclaimer language** appears verbatim on `/legal/disclaimer` (when built) and in the footer — **never paraphrase**. Source is the client's attorney-reviewed copy.

## Conventions

- **No client name in commit messages** — refer generically ("per client selection", "per client feedback").
- **Leave unbuilt nav links as raw 404s** — dead links are the TODO list. Don't stub "coming soon" placeholders.
- **Content expansion:** client-supplied text is often AI-generated and too long. Trim to essentials; don't expand.
- **Scope:** Stripe (Payment Links), Calendly (free tier embed), static pages. No custom backend, CMS, or dashboard.

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

## Pages built

- `/` — home
- `/services` — detailed services with pricing
- `/about` — client bio + "What is Mediation?" explainer
- `/blog` + `/blog/[...slug]` — content collection, one article so far
- `/fonts` — temporary font preview (Lora was selected — page can be deleted)

## Pages pending

- `/book` (Calendly embed)
- `/intake` (form — fields documented in content infodump)
- `/pay` (Stripe Payment Links)
- `/contact`, `/faq`
- `/legal/disclaimer`, `/legal/terms`, `/legal/privacy`

## Key components

- `src/layouts/BaseLayout.astro` — HTML shell, font loading, nav, footer
- `src/components/Nav.astro` — sticky top nav with hamburger mobile menu
- `src/components/Footer.astro` — three-column nav + legal disclaimer + build version
- `src/styles/global.css` — tokens, type primitives, button/link styles, reveal animation

## Deploy flow

1. Make changes locally
2. `git commit` — pre-commit hook bumps `package.json` patch version
3. `git push` — Cloudflare picks up the push, rebuilds, deploys
4. Live in ~1–3 min. Verify the `v{version}` footer matches on production.
