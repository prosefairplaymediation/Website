# Stripe setup — getting clients able to pay

**Your prices are not changed anywhere in this repo.** Everything below matches
your live services page exactly.

I have no Stripe access from this session, so I can't create these for you. Below
is exactly what to create; paste the resulting URLs into
`site/_build/stripe-links.json`, run `python3 site/_build/generate.py`, and every
button on the payment portal goes live at once.

---

## Create 5 links, not 14

Stripe Payment Links support **adjustable quantity**. Use that and one link covers
every session length, instead of building a separate product per duration.

> ## Outstanding in Stripe as of 2026-09-02
>
> The site has been updated; Stripe has not, and cannot be from the codebase —
> the amounts live in Stripe, and this repository only holds the URLs. Two
> things need doing in the dashboard, and until they are, the site and the
> checkout disagree:
>
> 1. **Parenting Plan Preparation → $600.** The site now says $600 and the link
>    still charges $400, so the practice collects a third less than it
>    advertises, silently. If the price cannot be edited on an existing Payment
>    Link, create a new one and send the URL — swapping it in the code is a
>    one-line change.
> 2. **Turn-Key Court Packet → archive the link.** The packet is now quoted by
>    case type, so there is no fixed amount to charge. Its card has been removed
>    from `/pay` and nobody can reach it from the site, but the link itself is
>    still live for anyone holding an old one. Marie issues a payment link per
>    matter instead, or uses product 5 below, which is exactly what that
>    "customer enters the amount" link exists for.
>
> Everything else on the new pricing list is hourly and already maps to
> products 1 and 2.

In Stripe: **Product catalog → Add product**, then **Payment links → New**, and
under the price tick **"Let customers adjust quantity"** (set max 8).

| # | Product name | Price | Quantity | Covers |
|---|---|---|---|---|
| 1 | Mediation — hourly, combined rate | **$600** | adjustable 1–8 | 1 hr, 2 hr, half-day, full-day where one party pays |
| 2 | Mediation — hourly, split rate (per party) | **$300** | adjustable 1–8 | same, where each party pays their own half |
| 3 | Parenting Plan Preparation | **$600** | fixed 1 | flat fee — **was $400, see below** |
| 4 | Turn-Key Court Packet | ~~$600~~ | — | **no longer sold from the site, see below** |
| 5 | Quoted amount | **customer enters** | n/a | Gold Service, session overruns, extra revisions |

### Product 5 — the "customer enters the amount" link

This is the one that isn't obvious. In Stripe:

1. **Add product** → name it *Quoted amount — Pro Se Fair Play Mediation*.
2. On the price, choose **"Customer chooses price"** (Stripe's pay-what-you-want
   price type), currency **USD**.
3. **Set a minimum.** This is the important bit — without one, a typo can send you
   a $6 payment for a $6,000 matter. Set it at or just below your smallest
   realistic quote. Consider a maximum too, which catches the opposite typo.
4. Leave the **preset amount blank** so nobody anchors on a number you didn't quote.
5. Add a **required custom field**: *"Matter name"*, and a second: *"Amount quoted
   to you"*. The second one sounds redundant next to the amount they type — it
   isn't. If the two disagree, you can see it immediately instead of discovering it
   during reconciliation.
6. Enable **ACH** here as well. Quoted amounts tend to be the large ones, which is
   exactly where the $5 cap saves the most.

**Where this button is used on the site:** the payment portal, under "Pay a quoted
amount". It covers Gold Service (no published rate), time beyond a booked block,
and revisions beyond the two included with a Court Packet.

**The zero-error alternative, worth knowing:** a **Stripe Invoice** lets *you* set
the amount, so the client cannot mistype it. For a $6,000 Gold matter that is the
safer instrument. Use the button for convenience and speed; use an invoice when
the number is large enough that a typo would matter. Both are fine — the button
exists because you asked for it, and it is genuinely useful, but it does move the
risk of entering the wrong figure onto the client.

The client picks the number of hours at checkout, so the maths is Stripe's, not
yours — which removes the whole category of "the label said $2,400 but the product
charged $1,200" disputes.

### Then map them

In `site/_build/stripe-links.json`, point several keys at the same link:

```json
"STRIPE_1HR_FULL":  "https://buy.stripe.com/xxxxCOMBINED",
"STRIPE_2HR_FULL":  "https://buy.stripe.com/xxxxCOMBINED",
"STRIPE_4HR_FULL":  "https://buy.stripe.com/xxxxCOMBINED",
"STRIPE_8HR_FULL":  "https://buy.stripe.com/xxxxCOMBINED",
"STRIPE_1HR_SPLIT": "https://buy.stripe.com/xxxxSPLIT",
...
```

Prefer a separate link per duration instead? Create 14 fixed-price products and
map one key each. More setup, more to keep in sync, no benefit.

### Settings worth turning on

- **Collect the client's name and email** — you need them to match a payment to a matter.
- **Add a custom field: "Matter / parties' names."** Otherwise reconciling payments is guesswork.
- **Enable ACH / US bank debit** on every link. See the fees section — this is the single biggest saving available to you.
- **Success page:** point it at your booking page or a "what happens next" page, not Stripe's default.
- **Turn OFF** "Adjust quantity" on products 3, 4 and 5. Nobody needs two Parenting Plans.

---

## Gold Service: how to quote and get paid

Gold Service has no published price, so there is nothing to pre-build. You agree a
figure, then send a link. Three ways to do that, best first.

### Best for Gold: a Stripe Invoice — because it itemizes

**Stripe → Invoices → Create invoice.** Add the customer, add line items, send.
They get a hosted payment page and a PDF, and Stripe chases it for you.

Use this one for Gold specifically, and the reason is your own example: if you are
booking a hotel conference room for a three-day weekend, an invoice can show it
**as separate lines**:

| Line | Amount |
|---|---|
| Gold Service mediation — 3-day intensive | (your fee) |
| Private venue — conference room, 3 days | (pass-through cost) |
| Specialist financial review | (if applicable) |

That itemization does real work. A client who sees a single $9,000 figure asks
what it covers; a client who sees the venue broken out understands they are paying
a third-party cost, not a markup. It is also your best protection in a dispute,
because the invoice is a record of exactly what was agreed and for what.

Set **Terms** on the invoice (due on receipt, or a date), and enable **ACH** —
on Gold-sized amounts the $5 cap versus ~2.9% is the largest saving anywhere in
your setup.

### Quick alternative: a one-off Payment Link

**Products → Add product** with the agreed amount as a one-off price → **Create
payment link** → send the URL. Faster than an invoice, no itemization, no
reminders, no PDF. Fine for a straightforward agreed figure with no pass-through
costs.

Name these clearly — *"Gold Service — [matter name] — [date]"* — or your product
list becomes unusable within a month.

### Already on the site: the "Pay a quoted amount" button

`{{STRIPE_QUOTED_AMOUNT}}` on the payment portal, where the client types the
figure you quoted. Use it when someone wants to pay immediately without waiting
for you to raise an invoice.

Be aware of the trade-off: **it moves the risk of entering the wrong number onto
the client.** That is why the setup above insists on a minimum and maximum, and on
capturing the quoted figure as a required field. For a large Gold matter, prefer
the invoice.

### The sequence

1. Free consultation → establish what the matter needs.
2. Agree the format and the figure with the client, **in writing** (email is fine).
3. Raise a Stripe Invoice with itemized lines, or send a one-off link.
4. Confirm the session only once payment has cleared — that is what your refund
   policy states, and ACH takes a few days, so build that into the date you offer.

Point 4 matters more on Gold than anywhere else. If you have committed to a hotel
booking on the strength of an unpaid invoice, you are carrying that cost yourself.

---

## Can you pass the Stripe fees to the client? And must you disclose it?

**Short answer: legally yes in Florida, disclosure is mandatory, and I'd still
advise against it in your case. There's a cheaper route that needs no compliance
work at all.**

### Is surcharging legal in Florida?

Yes, effectively. Fla. Stat. § 501.0117 still bans credit-card surcharges on
paper, but the Eleventh Circuit held it unconstitutional under the First Amendment
in *Dana's Railroad Supply v. Attorney General* (2015). It is unenforceable, and
surcharging is treated as legal in Florida.

### Disclosure is not optional

Card-network rules require **all three**:

1. Notice at the **point of entry** (your site, before checkout)
2. Notice at the **point of sale** (the checkout page itself)
3. A **separate line item** on every receipt — never rolled into the total

Plus: **cap the surcharge at the lesser of 3% or your actual cost of acceptance**,
give your acquirer/the networks **30 days' advance notice**, and apply it
**consistently** across clients.

### The rule that catches people

**You may never surcharge a debit or prepaid card** — not even when the customer
selects "credit" at checkout. That's the Durbin Amendment plus card-brand rules,
and it's federal, so no state ruling changes it.

Here's why that matters specifically for you: **Stripe Payment Links can't
conditionally surcharge by card type.** If you add 3% to a Payment Link, every
debit payer gets surcharged too — which is a violation. There is no clean way to
do compliant surcharging through Payment Links.

### And the conversion cost

Your sessions run $1,200–$4,800. A 3% surcharge on a full day is **$144**,
appearing at the exact moment a nervous client commits, on a service sold on
trust and transparency. That's an expensive place to save money.

### What I'd do instead

**1. Enable ACH / US bank debit and make it the preferred method for large
sessions.** Stripe's ACH pricing is **0.8%, capped at $5**. Compare:

| Session | Card (~2.9% + 30¢) | ACH (0.8%, $5 cap) | You keep |
|---|---|---|---|
| 2 hours — $1,200 | ~$35 | **$5** | +$30 |
| Half day — $2,400 | ~$70 | **$5** | +$65 |
| Full day — $4,800 | ~$139 | **$5** | +$134 |

That recovers *more* than a 3% surcharge would, requires **zero** disclosure,
**zero** network notification, and no card-type logic. It's strictly better. ACH
settles slower (a few business days), which is fine for scheduled sessions booked
in advance.

**2. Absorb card fees on the small stuff.** On a $400 Parenting Plan the card fee
is about $12. Not worth a compliance program.

**3. Only if you still want the cost covered:** build it into the price rather
than surcharging. Always permitted, no disclosure, no debit problem. You said not
to change your prices, so I haven't — but that's the clean version if you
reconsider.

*This is general information on the rules as they stand, not legal or tax advice.
Confirm surcharging specifics with your processor before switching anything on,
since your acquirer's own agreement also governs.*

---

## ⚠️ Before the portal goes live: your refund policy

Your mediation page says session structure, scheduling **and the refund policy**
are set out in full on the Hourly Mediation service page. **That text isn't in
this repo.**

A payment portal taking $1,200–$4,800 with no stated refund or cancellation terms
is the most common source of card disputes in professional services — and in a
dispute, the absence of a stated policy tends to favor the cardholder. Send me
the text and I'll put it on the payment portal and link it from every pay button.

At minimum it should state: how far ahead a session can be canceled or
rescheduled without charge, what happens to a paid session if one party doesn't
attend, and whether document-preparation fees are refundable once work has begun
(the Court Packet includes up to two revisions, so where "begun" falls matters).

---

## Sequence

1. Create the 6 products and links above.
2. Enable ACH on each.
3. Paste the URLs into `site/_build/stripe-links.json`, plus your
   `ENGAGEMENT_URL`.
4. Send me your refund policy text.
5. Run `python3 site/_build/generate.py`.
6. **Test one real payment end to end**, then refund it. Confirm the amount, the
   receipt, and that the Engagement Agreement and Disclosure gates both blocked
   the button until checked.

Step 6 is not optional. A payment button that silently fails is worse than no
payment button.
