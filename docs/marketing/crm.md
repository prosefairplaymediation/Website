# CRM for a solo mediation practice

Written 2026-08-28. Decision is Marie's; this records the options, the
reasoning, and what the site now does regardless of which is chosen.

## The distinction that matters first

A CRM does not capture anyone. It stores people who have **already** been
captured. The practice's problem was capture: high traffic, and the only way
to leave a trace was to book a Zoom or send an email — both of which ask a
lot of someone who started reading about divorce two days ago.

So the site change and the CRM purchase are separable, and the site change is
the one that had to happen first. It has been made (see below).

## Options considered

| Tool | Real cost | Verdict |
|---|---|---|
| **HubSpot Free** | $0 | **Recommended.** Contacts, deal pipeline, tasks, reminders, a public form endpoint, and ~2,000 marketing emails a month. No seat minimum, no contract. |
| **Clio Grow** | ~$49/user/mo | Legal-native intake. Built to hand off into Clio Manage, which the practice does not use. Standalone it is a worse HubSpot for more money. |
| **Lawmatics** | ~$199/mo, **3-user minimum** | Genuinely the best drip-nurture engine of the three, with conditional logic that suits family law's long consideration cycle. It is also roughly $2,400 a year with a seat minimum aimed at firms. Revisit if capture volume justifies it. |
| **HoneyBook / Dubsado** | ~$20–36/mo | Aimed at proposals, contracts and payments. Heavily overlaps Stripe and Calendly, which the practice already runs. |

**Recommendation: start on HubSpot Free.** It costs nothing, it answers the
actual question ("how do I reach these people again"), and it produces the
one number that decides everything else — how many emails a month the site
actually captures. Buy Lawmatics when that number makes $199/month look
small, not before.

## The confidentiality constraint — read before importing anything

Mediation communications are confidential and privileged under
**Fla. Stat. § 44.405**. No CRM should ever hold case substance:

- **Store:** name, email, phone, source page, pipeline stage, next action date.
- **Never store:** what the dispute is about, what either party said, anything
  disclosed in a session, or notes from a consultation.

The capture form on the site is built to this rule — it asks for a first name,
an email and a rough timeframe, and it tells the visitor in plain words not to
describe their situation there.

## What the site now does

`src/components/LeadCapture.astro`, placed **below** the booking calendar on
18 pages (home, /book, /pricing, /faq, /areas-served, all six service pages,
and every guide). Below, not above, because a booking is worth far more than
an email address and gets first claim on anyone who is ready.

It runs in one of two modes, set in `src/lib/leadCapture.ts`:

- **Mode 2 — active now.** No CRM configured, so the form opens the visitor's
  mail client with a prefilled message to `info@prosefairplaymediation.com`.
  Not elegant, but no lead is silently dropped.
- **Mode 1 — after setup.** Fill in `HUBSPOT_PORTAL_ID` and `HUBSPOT_FORM_ID`
  and the form posts straight into HubSpot in the background. Nothing else
  changes.

### Switching it on

1. Create a free HubSpot account.
2. Marketing → Forms → create a form with **First name**, **Email**, **Message**.
3. Turn on the submit notification to `info@prosefairplaymediation.com`.
4. Share → Embed code. The URL contains `/submit/<portalId>/<formGuid>`.
5. Put those two values in `src/lib/leadCapture.ts` and push.

GA4 already receives `lead_capture_view` and `lead_capture_submit`, each
tagged with the page it came from, so it will be visible which pages actually
produce emails.

## The follow-up the form promises

The form promises **one note, then one check-in, from Marie** — not a
newsletter. That promise has to be kept by hand or by a HubSpot template.
Draft for the first note:

> Subject: What to have ready before you file in Florida
>
> Hi [name] —
>
> You left your email on prosefairplaymediation.com, so here is the short
> version of what Florida asks for, whether or not you ever work with me.
>
> One of you must have lived in Florida for six months before anything is
> filed — that is § 61.021 and there is no way around it. If there are no
> minor children, nobody is pregnant, neither of you is asking for alimony,
> and you already agree on property, you may qualify for simplified
> dissolution: roughly $500–$800 and about 30 days. If there are minor
> children you are not eligible, and you will need a Parenting Plan along
> with the rest of the packet.
>
> The filing fee runs about $408 plus $10 for the summons, and it varies a
> little by county.
>
> Nothing here is legal advice, and I am a mediator rather than an attorney —
> if you want an opinion about your rights, that is a lawyer's job.
>
> If it would help to talk it through, the consultation is free and takes
> fifteen minutes: [booking link]
>
> — Marie VanGinHoven, Pro Se Fair Play Mediation

Second note, four to six weeks later, one short paragraph: still here, nothing
has changed about the free consultation, reply "stop" if this is no longer
relevant. Then stop. Two emails and out is the promise made on the page.

## Compliance notes for anything sent from the CRM

- No outcome or success-rate claims — **Rule 10.610**.
- Never reference a real matter, even anonymized — **§ 44.405**.
- Never state or imply Florida Supreme Court certification; three observations
  are still outstanding.
- Every email needs a working unsubscribe. The page promises reply-"stop"
  works, so someone has to actually action those.
