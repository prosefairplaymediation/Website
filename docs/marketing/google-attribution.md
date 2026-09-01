# Google, connected to the whole funnel

Written 2026-09-01. The point of this page is one distinction:

> Do not tell Google that a form submission is the goal. Tell it what happened
> after the lead came in.

```
Google Search → Visitor → Lead → Qualified → Consultation → Paid mediation
                          └─ what most sites report ─┘        └─ what actually matters ─┘
```

A campaign optimized on form fills finds people who fill in forms. A campaign
optimized on paid mediations finds people who pay Marie. Same budget, different
business.

## What the site does now

**The click ID is captured on arrival and stored with the lead.** This is the
half that cannot be added later — a `gclid` that was not read off the URL on
the visit is gone, and with it any chance of ever matching that person's
eventual payment back to the ad that won them. It works whether or not the
Google Ads side is ever configured, so identifiers accumulate in Referent from
today.

| Where | What |
|---|---|
| `src/layouts/BaseLayout.astro` | Reads `gclid` / `gbraid` / `wbraid` and the five `utm_*` parameters on every arrival, before the analytics script loads |
| `src/lib/attribution.ts` | The 90-day window, the storage key, and the Ads tag IDs (empty until there is an account) |
| `worker/referent.ts` | Puts the click ID in the CRM's own `gclid` field if it has one, and in the note either way |
| `src/components/LeadCapture.astro` | Sends it with the lead; fires `generate_lead` and, once configured, the Ads conversion |

Both **first touch** and **last touch** are kept. Family law has a long
consideration cycle — people read for weeks and arrive several times — so the
first arrival is recorded once and never overwritten, while the most recent is
updated on every visit. The last-touch click ID is what goes in the CRM's
`gclid` field, because that is what Google's own attribution expects; the first
is in the note for anyone reading the record.

Nothing here is a third-party advertising cookie. These are Google's own click
parameters, already in the URL Google sent the visitor to, plus the campaign
tags the practice puts on its own links. `/legal/privacy` says so.

### GA4

Already live (`G-NH6HKR18MZ`, configured directly in `BaseLayout.astro` — there
is no Tag Manager container, and for a site this size there does not need to be
one). The capture form now also fires **`generate_lead`**, which is GA4's own
recommended event name, so it is understood without configuration. The existing
`lead_capture_view` / `lead_capture_submit` / `lead_capture_fallback` events are
unchanged.

## Switching on the Google Ads half

### 1. The conversion action and the tag

In Google Ads → **Goals → Conversions → New conversion action → Website**,
create the action for a website lead. Take the two values from its **Tag setup**
and put them in `src/lib/attribution.ts`:

```ts
export const AW_CONVERSION_ID = "AW-123456789";
export const AW_LEAD_CONVERSION_LABEL = "abcDEFghiJKL_mnoP";
```

Push. Until both are filled in, the site carries no Ads tag at all and sends no
conversion. Once they are, the tag is configured with
`allow_enhanced_conversions`, and on submit the form sends the email the visitor
typed with the conversion — that address is the match key Google uses to tie the
later CRM outcome back to this click.

### 2. Enhanced conversions for leads

This is the mechanism that carries a *downstream* event — Qualified, or Paid —
back to Google. It is the upgrade of the old offline conversion import, and it
accepts a `gclid`, hashed user-provided data such as an email, or both. Include
the `gclid` wherever there is one: it is the strongest match, and it is required
if you are not collecting user-provided data through the tag.

Two 2026 changes matter and they are easy to get wrong:

- **From April 2026** Google Ads accepts user-provided data from website tags,
  Data Manager *and* API connections under one unified setting — there is no
  longer a choice to make between implementation methods, and existing accounts
  were migrated automatically.
- **From 15 June 2026** offline conversion imports and enhanced-conversions-for-
  leads uploads moved to the **Data Manager API** and are **blocked in the Google
  Ads API**. Anything written against the old Google Ads API upload endpoints
  will not work. Build against Data Manager.

Sources, worth re-reading before building rather than trusting this page a year
from now:
[About enhanced conversions for leads](https://support.google.com/google-ads/answer/15713840?hl=en) ·
[Upgrade offline conversion import](https://support.google.com/google-ads/answer/14274408?hl=en) ·
[Set up offline conversions using GCLID](https://support.google.com/google-ads/answer/7012522?hl=en) ·
[Data Manager API](https://developers.google.com/data-manager/api/) ·
[`events.ingest`](https://developers.google.com/data-manager/api/reference/rest/v1/events/ingest)

### 3. Sending the downstream conversion

Two roads, and the first is the right one to start on:

**By hand or by Referent automation, through Data Manager.** Export or push the
leads that reached a stage — Consultation Completed, Paid — with their `gclid`
and email, into Data Manager against the matching conversion action. No code.
For a solo practice's volume this is genuinely sufficient, and it proves the
match rate before anything is automated.

**Automatically, from the Worker.** When the volume justifies it, a second route
alongside `/api/lead` posts to
`POST https://datamanager.googleapis.com/v1/events:ingest` when Referent moves a
contact to a paying stage — triggered by a Referent webhook, or by a scheduled
Worker pass over recently-changed contacts. It needs a Google Cloud service
account with the `https://www.googleapis.com/auth/datamanager` scope, and the
credential belongs in a Worker secret exactly like `REFERENT_API_TOKEN`. That is
the reason `/api/lead` was built as a Worker in the first place: there is now a
server-side place for this to live.

Whichever road, the conversion actions to create are the stages, not the form:

| Stage in Referent | Conversion action | Why |
|---|---|---|
| Consultation Completed | Qualified Lead | The first signal that a lead was real |
| Paid | Converted Lead, with value | What the bidding should actually chase |

Give the paid action a real value. A conversion with a value teaches Google the
difference between a notary appointment and a Gold Service mediation; a
valueless one teaches it that they are the same.

## Test before trusting any of it

1. Visit the live site with `?gclid=TEST123&utm_source=google&utm_medium=cpc`
   appended, then browse to another page so the parameters are gone from the
   URL.
2. Submit the capture form.
3. Open the contact in Referent. The note must contain
   `Advertising attribution` and `gclid=TEST123`. If it does not, nothing
   downstream can work and the Ads setup is not the problem.
4. Only then check the conversion in Google Ads (allow up to 24 hours, and
   expect "unverified" until it has real traffic).

Step 3 is the one that matters. Everything else in this document is recoverable;
a click ID that never reached the CRM is not.
