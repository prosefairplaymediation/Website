# The intake concierge, and the lifecycle behind it

Written 2026-09-01, from the owner's brief. This is the spec, not a build.
Two decisions in the last section have to be made before any of it is written,
and one of them is a professional-conduct decision rather than a technical one.

## The end state

Marie opens her laptop in the morning and sees, without having done anything
the night before:

```
New Lead: Jennifer Smith
Source: Google Ads — Divorce Mediation
Qualification: High intent
Service: Divorce with children
Consultation: Booked
SMS: Sent
Email: Sent
Payment: Pending
Referent Stage: Consultation Scheduled
```

She did not answer the phone, type Jennifer into Referent, send the text, send
the email, or schedule anything. And when Jennifer eventually pays, that fact
goes back to Google so the advertising optimizes toward people who pay for
mediation rather than people who fill in forms.

Most of that row already has a home. `/api/lead` creates the contact, sends
the alert and the acknowledgement, and stores the ad click. What is missing is
the conversation in front of it, the stages behind it, and the conversion
report at the end.

## Capture first, qualify after

**The single most important rule in this document.** Do not wait for the end of
a conversation to learn who someone is.

The concierge should ask for **first name, mobile, email and consent early** —
within the first exchange or two — and only then continue the intake. If the
visitor closes the tab halfway through, the practice still has a person to
follow up, not an anonymous transcript.

This inverts the usual chatbot pattern, where identity is collected at the end
as a "book a call" step. On a site where people are reading about the worst
year of their life, at eleven at night, half of them will not reach the end.
Those are not low-intent visitors; they are interrupted ones.

Concretely:

1. **Turn one or two:** answer whatever they asked, then ask for a first name
   and the best way to reach them. Create the Referent contact immediately —
   `/api/lead` already accepts exactly this and needs nothing new.
2. **After that:** keep talking. Matter type, whether both parties will
   participate, court case or private, children and property at a high level,
   timing, readiness to book. Each answer **updates** the same contact.
3. **At any point they leave:** the record already exists, already has the ad
   click attached, and the acknowledgement has already gone out.

The consequence for the code is that the Worker needs an **update** path
alongside create — a second call that finds the existing contact by email and
adds to it, rather than making a duplicate. Whether Referent exposes an upsert,
a separate update tool, or neither is one of the unanswered questions in
`referent-crm.md`.

## What the concierge may and may not do

It moves someone toward a conversion by collecting what is needed to route
them. It does **not** advise. The boundary is not a style preference — see the
decision below.

- Trained on: the practice's services, prices, FAQs, service area, scheduling,
  and the escalation rules.
- Never: what someone should do in their own case, what a court will decide,
  what either party is entitled to, or anything that reads as an opinion about
  rights. That is Rule 10.370, and it is what `/legal/disclaimer` says this
  practice does not do.
- Always: the existing safety screen, applied to the conversation rather than
  to a single form field. An inquiry that mentions abuse, an injunction,
  threats or a fear for anyone's safety goes to a person and receives no
  automated message. That rule already exists in `worker/notify.ts` and does
  not get a second, looser implementation.

## The lifecycle

Referent holds the stages; the automations hang off them.

| Stage | Trigger | What goes out |
|---|---|---|
| New Lead | Identity captured | Text + email, immediately (already built) |
| Contacted | — | — |
| Consultation Scheduled | Calendly booking | Confirmation |
| Consultation Completed | Marie marks it | **Qualified Lead → Google** |
| Mediation Scheduled | Payment or booking | Onboarding and document pack |
| Paid | Stripe | **Converted Lead, with value → Google** |
| Mediation Completed | Marie marks it | Review request |

The follow-up cadence in the brief — a nudge if no consultation is booked, one
the next day, an educational message a few days later — is a **drip sequence**,
and that is where this collides with two things the practice has already
committed to. Read the next section before building any of it.

## Two decisions, before a line of this is written

### 1. Does this site put a language model in front of visitors?

It currently, deliberately, does not. `src/components/ChatWidget.astro` answers
only from the FAQ, verbatim, with no model behind it. Its own header explains
why:

> an improvising bot on a mediation site can be asked what someone should do in
> their own case and will answer, which is exactly what `/legal/disclaimer` says
> this practice does not do. A retrieval bot cannot make that mistake.

The widget also carries Marie's face and is labelled as automated **per an
earlier client decision**, on the reasoning that a widget that looks and texts
like Marie invites someone to believe they are talking to their mediator in
confidence — and to type case details into it.

The brief's guardrails are the right ones, and the thing is buildable. But this
reverses a decision that was made deliberately, and it should be reversed
deliberately: with the labelling kept, the refusal behaviour tested against the
questions people actually ask ("should I take the house?", "will I get
custody?"), and § 44.405 confidentiality respected in whatever stores the
transcript. It is a Rule 10.370 and unauthorized-practice question first and an
engineering question second.

**Needed: an explicit yes, with those conditions, from the owner.**

### 2. The drip sequence needs consent the site has not asked for

Two problems, and the second is the expensive one.

**The promise on the page.** The capture form says: an acknowledgement, one
note from Marie, one check-in, then nothing. "No newsletter, no drip sequence"
is close to a direct quote. A four-message nurture track contradicts what the
visitor was told when they handed over their address. Either the sequence
changes or the promise does — quietly doing the sequence anyway is the one
option that is not available.

**The consent actually collected.** The box beside the mobile field says:

> Text me at this number about my inquiry. Message and data rates may apply.
> Reply STOP at any time to stop.

That authorizes a text **about their inquiry**. It does not authorize
educational or promotional messages days later. Under the federal TCPA and the
Florida Telephone Solicitation Act, marketing texts need prior express *written*
consent with its own clear disclosure — and the FTSA is the one that produces
Florida class actions over exactly this gap. The fix is not difficult: a second,
separate, unticked box with its own wording, and the wording versioned into the
CRM record the way the first one already is. But it has to exist before the
first nurture message goes out, and it cannot be back-applied to anyone who
ticked only the first box.

Email is the easier case — an unsubscribe link and honouring it is the
requirement — but the promise problem above applies to email just as much.

**Needed: a decision on the sequence, and if it goes ahead, the second consent
box shipped before the first message.**

## Order of work, once those are settled

1. **The update path.** Ask Referent whether contacts can be updated or
   upserted, then add it to the Worker. Everything else depends on being able
   to add to a contact created two turns earlier.
2. **The concierge**, with capture-first as its first requirement and the
   safety screen applied per turn.
3. **The stages and their automations**, in Referent.
4. **The conversion feedback**, per `google-attribution.md` — Qualified on
   consultation completed, Converted with a value on payment.

Steps 3 and 4 are worth doing even if step 2 never happens. The morning summary
at the top of this page does not actually require a chatbot: it requires the
stages to exist and the automations to fire. The concierge changes how many
people enter the funnel, not whether the funnel works.
