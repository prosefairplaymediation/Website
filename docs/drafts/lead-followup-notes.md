# The two follow-up notes the capture form promises

## STATUS: DRAFT. NOT APPROVED. NOTHING SENDS THESE.

**Nothing in this file is live, and nothing in the repository reads it.** No
Worker, no script, no CRM. These are two pieces of copy for Marie to approve,
edit or reject, and they are text on a page until she says otherwise.

That warning is written this bluntly for a specific reason. On 2026-08-28 a
file in this same directory, `refund-policy-additions.md`, opened with the
line *"Status: drafts for your approval. None of this is live on the site."*
It was published anyway, described in the commit as "the approved clauses",
with its bracketed blanks filled in by someone who had no standing to choose
those terms. Both pages had to be deleted and her own policy restored byte for
byte. **Do not publish, wire up, schedule or paste anything below without her
saying so about this file, by name.**

---

## Why these exist

`src/components/LeadCapture.astro` is live on eleven pages and tells every
visitor, in these words:

> Leave your first name and email and you will get a short acknowledgement
> straight away, then one note from Marie on what to have ready before you
> file, and one check-in later. No newsletter, no drip sequence.

The acknowledgement is real: `worker/notify.ts` sends it automatically and
`/api/lead` answers 2xx only once the practice alert has gone out. **The other
two messages have never existed.** There is no CRM and no automation behind
them, so every lead captured since that form shipped has been promised two
messages from Marie and received one.

So this is not a marketing improvement. It is closing a gap between what the
site says and what happens.

## The compliance line these had to be written on

The draft that already sits in `docs/marketing/crm.md` is **not usable**, and
that is worth stating plainly so nobody reaches for it as a shortcut. It
tells the reader which Florida statute governs the residency requirement,
whether they may qualify for simplified dissolution, roughly what that costs,
roughly how long it takes, and what the filing fee and summons run. Every one
of those is a statement of Florida law or a court's own fees, under Marie's
name and her professional credential, and none of it was ever checked with
her.

That is precisely the class of content seven `/process` articles were deleted
for on 2026-09-03, when her instruction was *"I did not approve that."*
Precise figures are the worst of it: a reader plans around them, and wrong by
a little is still wrong.

So the notes below contain **no statute, no fee, no timeline, no eligibility
test, and no statement of what Florida requires.** What they describe instead
is Marie's own process and her own intake paperwork, which is hers to describe
and needs nobody's verification. Where a reader plainly wants to know what the
law requires, the note points them at flcourts.gov and at a lawyer, which is
also what `/legal/disclaimer` and the FAQ already do.

Also held to:

- **Not a law firm, no legal advice.** Nothing here tells anyone what to do in
  their own matter or predicts any outcome.
- **She never files.** Documents are prepared court-ready and the client files
  them. No wording may suggest otherwise.
- **No certification claim.** The Florida Supreme Court family mediator
  certification is still pending and must not appear.
- **No outcome or success-rate claims** (Rule 10.610), and **no reference to
  any real matter, even anonymised** (Fla. Stat. § 44.405).
- **CAN-SPAM.** Both notes carry the postal address and a working opt-out. The
  form promises that replying "stop" works, so somebody has to action those by
  hand until a platform does it.

---

## Note 1 — sent about a day after the inquiry

Subject: **What I will need from you when you are ready**

> Hi [first name],
>
> Thank you for leaving your details on prosefairplaymediation.com. I said I
> would send one note about getting ready, so here it is.
>
> Most people who contact me are somewhere between "thinking about it" and
> "ready to start", and there is no wrong place to be. When you do decide to
> move, the part that saves the most time is having your own information
> gathered before we talk. So that you can do that at your own pace, the two
> intake questionnaires I work from are on the site and you are welcome to
> download them whenever you like:
>
> https://prosefairplaymediation.com/documents
>
> One covers parenting decisions and one covers financial information. You do
> not need to complete them to book a consultation, and you do not need to
> send them to me before we speak. They are there so you can see what I will
> ask about.
>
> Two things worth knowing about how I work, because they surprise people:
>
> I am a mediator and a document preparer, not an attorney, so I do not give
> legal advice or tell either party what to accept. I run the conversation and
> I prepare the paperwork that comes out of it. If you want an opinion about
> your rights, that is a lawyer's job and I will say so plainly rather than
> guess.
>
> Documents I prepare are court-ready, and you file them yourself. The
> official Florida forms and the filing requirements are published by the
> courts at flcourts.gov, and your clerk of court is the authority on what
> your county wants and what it charges.
>
> If it would help to talk any of this through, the consultation is free,
> takes fifteen minutes and happens on Zoom:
>
> https://prosefairplaymediation.com/book
>
> Or call 561-941-0896. A real person answers, days, evenings and weekends.
>
> With best wishes,
> Marie VanGinHoven
> Pro Se Fair Play Mediation LLC
> 700 South Rosemary Avenue, Suite 204, West Palm Beach, FL 33401
> 561-941-0896
>
> You are getting this because you left your email on my website. Reply
> "stop" and I will not send the follow-up.

## Note 2 — the check-in, four to six weeks later

Subject: **Still here whenever you need me**

> Hi [first name],
>
> This is the check-in I promised, and it is the last email you will get from
> me unless you write back.
>
> Nothing has changed on my side: the consultation is still free and still
> fifteen minutes, evenings and weekends included.
>
> https://prosefairplaymediation.com/book
>
> These things move on their own timeline and a few weeks is nothing. If it
> turns out you do not need me, I am genuinely glad.
>
> Marie VanGinHoven
> Pro Se Fair Play Mediation LLC
> 700 South Rosemary Avenue, Suite 204, West Palm Beach, FL 33401
> 561-941-0896
>
> Reply "stop" and you will hear nothing further.

---

## What Marie needs to decide

1. **Approve, edit or reject each note.** They go out under her name.
2. **Note 1's timing.** A day after the inquiry is the draft's assumption.
   The acknowledgement already goes out instantly, so a day apart keeps them
   from arriving together.
3. **Whether the form's wording should change.** It currently promises "one
   note from Marie on what to have ready before you file". Note 1 deliberately
   describes *her* intake paperwork rather than what a court requires, which
   is a slightly narrower promise than the form makes. Either the note is
   approved as drafted and the form's line is softened to match, or she wants
   the note to say more, in which case the additional content has to be hers.
4. **Who sends them.** On HubSpot's free tier this is a saved template plus a
   task reminder, so each note is one click at her end. Nothing automatic is
   proposed here.

Until 1 and 4 are settled, the promise on the form is still unkept, and that
is the reason this file exists.
