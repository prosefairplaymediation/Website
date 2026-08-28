# docs/

Reference material that is **not** part of the built site. Astro builds only
from `src/pages`, so nothing here is published.

## `marketing/`

| File | What it is |
|---|---|
| `local-search.md` | Google Business Profile audit, review-request templates and timing, Bing Places, directory name/phone consistency, and what to measure. |
| `IDENTITY.md` | Exact credential wording, and the phrasings that must not be used. |
| `compliance/florida-mediator-rules.md` | Rule 10.610 marketing limits, the no-legal-advice line, and the § 44.405 confidentiality trap. **Read before writing any public-facing copy or review response.** |
| `compliance/observation-bottleneck.md` | Routes to the three observations outstanding for Florida Supreme Court family certification. |
| `tracking/` | Monthly AI-answer checks and logs. |

**Standing decision:** the Google Business Profile name ("ProSe Fair Play
Mediation LLC") is deliberately left as it is, even though the site says "Pro Se
Fair Play Mediation LLC". Renaming risks re-verification on a listing with 28
five-star reviews. Do not re-open it.

Two rules govern everything here:

- **Never use a real case detail.** § 44.405 makes mediation communications
  confidential and privileged — not anonymized, not "a couple I worked with
  once". This applies to review responses as much as to marketing copy. A client
  may disclose that they mediated; the mediator may not.
- **No Supreme Court certification claim** until it issues. The training
  provider's logo reads "Florida Supreme Court Certified Mediation Training",
  which certifies the *program*, not the mediator.

## `drafts/`

| File | Status |
|---|---|
| `refund-policy-additions.md` | 11 clauses drafted and approved — document-preparation refunds, mediator declination, reserved blocks, technology failure, credit expiry, force majeure, governing law. **Not yet reflected in the live refund wording.** |
| `stripe-setup.md` | Payment-link setup: quantity-adjustable products, the customer-enters-amount link for Gold, and why ACH beats surcharging. |

## Known gap

There is **no Form 12.900(a) nonlawyer disclosure anywhere on this site**, yet
Parenting Plan Preparation and the Turn-Key Court Packet are both nonlawyer
document preparation. Florida requires the disclosure to be given *before*
assistance begins, and the preparer's name, address and telephone number to
appear at the bottom of the last page of every form assisted with.

`/pay` already gates its Pay buttons behind an agreement checkbox via
`[data-pay-btn]`, so a second gate fits the pattern that is already there.
