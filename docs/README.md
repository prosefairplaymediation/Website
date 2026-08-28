# docs/

Working material that is **not** part of the built site. Astro only builds from
`src/pages`, so nothing here is published — it is reference for whoever is
running the practice's marketing and compliance work.

## `searchability/`

The Reddit and Quora program. Reddit is the most-cited domain across ChatGPT,
Gemini, Perplexity and Google AI Overviews, and roughly one in five Perplexity
citations is a Reddit link — so the aim is to have the practice's own sentences
in the threads those engines retrieve.

| File | What it is |
|---|---|
| `00-strategy.md` | How AI citation actually works. Read first. |
| `IDENTITY.md` | Credential wording, and the language that must not be used. |
| `compliance/florida-mediator-rules.md` | Rule 10.610 marketing limits, the no-legal-advice line, and the § 44.405 confidentiality trap. **Read before posting anything.** |
| `compliance/observation-bottleneck.md` | Routes to the three observations outstanding for Supreme Court family certification. |
| `reddit/` | Warm-up plan, subreddit map, **12 drafted answers**, cadence. |
| `quora/` | Profile setup, target questions, **6 drafted answers**. |
| `local-search.md` | Google Business Profile audit, review-request templates, Bing Places, directory consistency. |
| `tracking/` | 18-prompt monthly AI-citation check and logs. |
| `LAUNCH-30-DAYS.md` | Day-by-day first month. |

Two things that govern all of it:

- **Publishing is manual.** Both platforms require human verification and target
  automated promotional posting. The answers are drafted so posting needs no
  composition — open the file, copy the block, adjust the opening line.
- **Never use a real case detail.** § 44.405 makes mediation communications
  confidential and privileged. Not anonymized, not "a couple I worked with
  once". Use aggregate patterns, labeled hypotheticals, and public procedure.

## `drafts/`

| File | Status |
|---|---|
| `refund-policy-additions.md` | 11 clauses drafted and approved, covering document-preparation refunds, mediator declination, reserved blocks, technology failure, credit expiry, force majeure and governing law. Not yet reflected in the live site's refund wording. |
| `stripe-setup.md` | Payment link setup: quantity-adjustable products, the customer-enters-amount link for Gold, and why ACH beats surcharging. |
| `nonlawyer-disclosure-gate.html` | A standalone paste-in Form 12.900(a) gate. Superseded if the disclosure is built into `/pay` properly — see below. |

## Known gap

There is **no Form 12.900(a) nonlawyer disclosure anywhere on this site.** The
practice sells Parenting Plan Preparation and the Turn-Key Court Packet, both
nonlawyer document preparation. Florida requires the disclosure to be given
*before* assistance begins, and the preparer's name, address and telephone
number to appear at the bottom of the last page of every form assisted with.

`/pay` already gates its Pay buttons behind an agreement checkbox via
`[data-pay-btn]`, so a second gate fits the existing pattern.
