# Lead automation: website → Lawmatics → Zapier → Claude → Lawmatics


> **Referent was removed on 2026-09-04**, at the owner's instruction: "I will
> not be using Referent as my CRM." Every mention of it below is history, not
> the current build. **Lawmatics is the intended replacement and has not been
> signed up for yet**, so at the time of writing the site has no CRM at all:
> `/api/lead` screens the inquiry, emails the practice and acknowledges the
> visitor, and the practice alert is the record of the lead. Nothing here
> describes anything the site currently does.

Written 2026-08-28. This is the build spec for the pipeline. The site half is
done and pushed; the Zapier half has to be built in Zapier's own UI, which
cannot be done from here — every step is written out below so it can be
followed click by click.

> **Superseded 2026-09-01 as to its plumbing.** The CRM is Referent, not
> Lawmatics, and the site posts to it directly through a Cloudflare Worker
> rather than through a Zapier catch hook — see
> [`referent-crm.md`](./referent-crm.md). Step 1 below no longer applies:
> `LEAD_WEBHOOK_URL` is not the switch any more.
>
> **The rest of this page is still the plan.** The classification prompt in
> Step 2, the parsing fallback in Step 3, the two-path routing in Step 4 and
> the four-test checklist at the end are all independent of which CRM holds
> the contact. The safety rule in particular — an inquiry mentioning abuse, an
> injunction or a threat must never receive an automated marketing email — has
> to be carried into Referent's automations verbatim.

## Verified before building

- **Lawmatics has a Zapier app** with triggers including *Contact created*,
  *Matter created*, *Custom form added*, *Appointment created*, *PNC matter
  converted*; and actions including *Create contact*, *Create matter*, *Update
  existing records*, *Fill out a custom form*.
  ([Lawmatics on Zapier](https://zapier.com/apps/lawmatics/integrations))
- **Anthropic (Claude) has a Zapier app.** It needs a **paid Anthropic API
  account** — separate from a Claude.ai subscription — and an API key from
  console.anthropic.com. The action sends a message to Claude and returns the
  reply as text.
  ([Getting started with Anthropic on Zapier](https://help.zapier.com/hc/en-us/articles/15790125155853-How-to-get-started-with-Anthropic-Claude-on-Zapier))

So the architecture works as described. Two things about it are worth knowing
before spending an afternoon on it.

## The gap that had to be closed first

The capture form collected a first name, an email and a timeframe. **Claude
cannot determine whether an inquiry is family, unmarried-parents, business or
real estate from a name and an email address.** There was nothing to classify.

The form now has one optional free-text line — *"In one line, what is this
about?"* — capped at 140 characters, with a note that names and details of the
dispute do not belong there. That line is what the classifier reads.

One line, not a text area, is deliberate. It is enough for a four-way
classification and it discourages someone from typing three paragraphs of case
substance into a web form.

## Why Claude rather than a dropdown

A dropdown would do the four-way tag on its own, for free. Claude earns its
place by doing three things a dropdown cannot:

1. Classifying from natural language, including the inquiries that do not fit
   the categories a dropdown offers.
2. Reading urgency out of the phrasing — "hearing next month" is not the same
   lead as "we're just starting to think about it."
3. **Flagging matters that should not receive an automated booking email at
   all.** An inquiry mentioning abuse, an injunction, threats or a safety
   concern must go to a personal-review path, never a cheerful automated
   "here's my calendar." That single rule is the strongest argument for
   putting a model in this pipeline.

## Data protection, before anything is switched on

Turning this on means prospect-entered text is processed by **Zapier** and
**Anthropic** as well as **Lawmatics**. Three consequences:

- **The privacy policy has to say so.** It now does — see `/legal/privacy`.
- **Mediation communications stay out of it.** Fla. Stat. § 44.405 privileges
  what is said in the course of a mediation. A pre-engagement inquiry from
  someone who is not yet a party is not that, but the boundary is worth
  respecting on purpose: this pipeline handles intake routing only. Once
  somebody becomes a party, nothing about the substance of their matter goes
  into Zapier or an API call.
- **Anthropic API data is not used for training** and the Console shows the
  retention setting for the account. Worth confirming on the account before go
  live rather than assuming.

---

# Build it

## Step 0 — accounts

| What | Where | Note |
|---|---|---|
| Lawmatics | already purchased | ~$199/mo, 3-user minimum |
| Zapier | zapier.com | needs a paid plan — this uses multi-step Zaps |
| Anthropic API | console.anthropic.com | **separate from Claude.ai**; pay-as-you-go, add credit |

### What the Claude calls will cost

Each lead is roughly 700 input tokens and 200 output tokens.

| Model | Input / MTok | Output / MTok | ~100 leads/month |
|---|---|---|---|
| Claude Haiku 4.5 | $1.00 | $5.00 | **~$0.17** |
| Claude Sonnet 5 | $2.00 | $10.00 | ~$0.34 |
| Claude Opus 5 | $5.00 | $25.00 | ~$0.85 |

**Use Sonnet 5.** The classification itself is easy enough for Haiku, but this
call also makes the safety judgment above, and thirty-four cents a month is not
a number worth optimizing. Zapier's model dropdown sometimes lags behind the
current model list — pick the newest Sonnet it offers.

## Step 1 — get website leads into Lawmatics

In Zapier: **Create Zap → Trigger: Webhooks by Zapier → Catch Hook.** Copy the
custom webhook URL it generates.

Paste it into `src/lib/leadCapture.ts`:

```ts
export const LEAD_WEBHOOK_URL = "https://hooks.zapier.com/hooks/catch/…";
```

Commit and push. The form then POSTs this JSON:

```json
{
  "first_name": "Dana",
  "email": "dana@example.com",
  "timeframe": "Within a month",
  "topic": "divorce with two kids, we agree on most things",
  "source_page": "/process/pro-se-divorce-florida",
  "source_url": "https://prosefairplaymediation.com/process/pro-se-divorce-florida",
  "captured_at": "2026-08-28T17:04:00.000Z"
}
```

Submit the form once on the live site so Zapier has a real sample to map.

**Action: Lawmatics → Create Contact.** Map `first_name`, `email`, and put
`topic`, `timeframe` and `source_page` into Lawmatics custom fields (create
them in Lawmatics first: *Intake Topic*, *Timeframe*, *Source Page*).

That is Zap 1. It does no classifying — it just gets the lead in the door.

## Step 2 — the classification Zap

**Trigger: Lawmatics → Contact Created.**

Triggering off Lawmatics rather than off the website is the right call, and
it is worth being explicit about why: it means a lead typed in by hand after a
phone call, or one that arrives from a referral, gets classified exactly the
same way a web lead does. The pipeline is about the CRM, not about the form.

### Action 2 — Anthropic (Claude) → Send Message

**System prompt:**

```
You classify new inquiries for a Florida mediation practice so they can be
routed to the right follow-up. You are not writing to the prospect and you are
not giving legal advice.

The practice offers private, pre-filing mediation and family-law document
preparation in Florida. It does not offer court-ordered mediation, and the
mediator is not an attorney.

Reply with ONE minified JSON object and nothing else. No preamble, no code
fence, no explanation.

{
  "matter_type": one of "family_divorce", "family_unmarried", "business",
                 "real_estate", "other",
  "urgency":     one of "researching", "soon", "urgent", "already_filed",
  "fit":         one of "good", "unclear", "review_personally",
  "reason":      a short phrase, under 15 words, explaining the fit value,
  "summary":     one neutral sentence a mediator could read at a glance
}

Definitions:
- "family_divorce": married parties separating or divorcing.
- "family_unmarried": unmarried parents — paternity, time-sharing or support
  where there is no marriage. This is a different track in Florida and must
  not be folded into family_divorce.
- "business": partnership, contract, employment or commercial disputes.
- "real_estate": property, title, boundary, landlord-tenant, or the division
  of real property outside a divorce.
- "other": anything else, including inquiries that are not about mediation.

Set "fit" to "review_personally" — regardless of matter type — if the inquiry
mentions or implies domestic violence, abuse, an injunction or restraining
order, threats, coercion, fear of the other party, or a concern for anyone's
safety. Mediation may be the wrong forum, and these must never receive an
automated marketing sequence. When in doubt between "unclear" and
"review_personally", choose "review_personally".

If there is too little information to classify, use "other" and "unclear"
rather than guessing.
```

**User message:**

```
Timeframe: {{timeframe}}
Page they were reading: {{source_page}}
What they wrote: {{topic}}
```

Map those three from the Lawmatics custom fields created in Step 1. Leave
`topic` blank-safe — plenty of people will skip it, and the prompt handles that.

### Action 3 — Code by Zapier → Run JavaScript

The Anthropic action returns text, not structured fields. This parses it and
guarantees every downstream step gets a usable value even if a reply comes back
malformed:

```js
// inputData: { reply }
const FALLBACK = {
  matter_type: "other",
  urgency: "researching",
  fit: "unclear",
  reason: "classifier output could not be parsed",
  summary: "",
};

let out = FALLBACK;
try {
  const raw = (inputData.reply || "").trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "");
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end > start) {
    out = { ...FALLBACK, ...JSON.parse(raw.slice(start, end + 1)) };
  }
} catch (e) {
  // Leave the fallback in place. A lead routed to the generic path is
  // recoverable; a Zap that errors out and drops the lead is not.
}

const TAGS = {
  family_divorce: "Family - Divorce",
  family_unmarried: "Family - Unmarried Parents",
  business: "Business Dispute",
  real_estate: "Real Estate",
  other: "Needs Review",
};

output = {
  ...out,
  tag: out.fit === "review_personally" ? "Personal Review" : (TAGS[out.matter_type] || TAGS.other),
  needs_human: out.fit === "review_personally",
};
```

Map `inputData.reply` to the Anthropic step's text output.

### Action 4 — Paths by Zapier

Two paths, on `needs_human`:

- **`needs_human` is true** → Lawmatics *Update Contact*: apply the
  **Personal Review** tag and **no automation**. Then *Email by Zapier* or a
  Slack/SMS step to alert immediately. Nothing automated goes to the prospect.
  This person gets a human reply or none at all.

- **`needs_human` is false** → Lawmatics *Update Contact*: apply `tag`, write
  `summary`, `urgency` and `reason` into custom fields, and enroll them in the
  matching Lawmatics automation.

### Step 3 — the four Lawmatics automations

Built in Lawmatics, not Zapier. One per tag, each sending the right first email
with the consultation link, then the follow-up sequence. Keep to what the site
promises: one substantive note, one check-in, then stop.

Compliance rules for every one of them:

- No outcome or success-rate claims — Rule 10.610.
- Never reference a real matter, even anonymized — § 44.405.
- Never state or imply Florida Supreme Court certification; the three
  observations are still outstanding.
- Every email needs a working unsubscribe.
- Nothing that reads as legal advice — Rule 10.370.

## Test before going live

Submit the form four times on the live site with these in the topic line, and
confirm each lands on the right tag:

| Test input | Expected |
|---|---|
| "divorce, two kids, we mostly agree" | Family - Divorce |
| "never married, need a time-sharing schedule" | Family - Unmarried Parents |
| "dispute with my business partner over the LLC" | Business Dispute |
| "my ex is threatening me and I have an injunction" | **Personal Review**, no automated email |

The fourth is the one that matters. Run it before the automations are live so a
misconfiguration cannot send an automated marketing email to someone describing
abuse.

## What the site does today

`src/lib/leadCapture.ts` has `LEAD_WEBHOOK_URL` empty, so the form is in mailto
fallback: submissions open the visitor's mail client addressed to the practice.
Nothing is lost while the Zaps are being built. Filling in the webhook URL and
pushing is the only site change the whole pipeline needs.
