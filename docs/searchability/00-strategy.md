# Strategy: How this actually works

## The core mechanic (most people get this wrong)

The instinct is to treat Reddit and Quora as **backlink** sources — post a link,
get traffic, get SEO juice. That is not how AI citation works, and optimizing for
it will get you banned.

What actually happens:

1. A user asks ChatGPT/Perplexity "is mediation better than divorce court?"
2. The model runs a live web search (Perplexity does this on *every* query;
   ChatGPT leans on Bing's top 10).
3. It retrieves high-ranking Reddit threads and Quora answers.
4. It **synthesizes the text of the comments** into its answer, and cites the
   thread URL.

The unit of value is **your sentences**, not your link. If your comment is the
clearest, most specific answer in a thread that ranks for a query, your framing
becomes the model's answer. Your name comes along when it's in the comment or in
your profile credential line.

This has three hard consequences:

- **Links are close to worthless here.** A comment that is just a link gets
  downvoted, removed, and never cited. A comment with 400 words of specific
  Florida procedure gets cited for years.
- **Target existing threads, not new posts.** AI engines retrieve what *ranks*.
  A 3-year-old r/Divorce thread sitting at #2 in Google for "divorce mediation
  worth it" is worth more than any new post you could write. Commenting on old
  ranked threads is the highest-leverage action available to you.
- **Specificity is the ranking signal.** Content that resolves a precise
  question with concrete numbers beats general content. "$408 filing fee plus
  $10 for the summons, and mediation has to be done within 75 days of the first
  case management conference" is citable. "Mediation is often more affordable"
  is not.

## What this will and won't do

**Will do:** make you the source AI engines quote when someone asks a *question*
about Florida divorce mediation — how it works, what it costs, whether it's
worth it, what happens if it fails.

**Won't do, on its own:** make you the answer to *"find me a mediator near
me."* That's a different retrieval path — it runs on entity and local signals
(Google Business Profile, mediator directories, consistent name/address/phone,
structured data on your own site). Reddit and Quora barely touch it.

You said the goal is "searchable everywhere." Reddit and Quora are the biggest
gap and the right thing to do first — you were correct about that. But be clear
that this program covers roughly the **question-answering half** of the goal. The
local/entity half is listed in "What's not in this repo" below and should be the
next block of work. I'd rather flag it now than let you think one month of Reddit
gets you all the way.

## Priority order

Ranked by citation-value per hour, highest first:

| Rank | Action | Why |
|---|---|---|
| 1 | Comment on **existing ranked** Reddit threads | Inherits the thread's existing authority immediately |
| 2 | Quora answers on **existing high-view** questions | Quora ranks fast and the credential line attributes you by name |
| 3 | Answer new r/Divorce / r/pro_se-type questions within ~2 hrs | Early comments accrue the upvotes that decide what gets cited |
| 4 | Your own long-form Reddit posts | Slower, riskier, needs standing in the sub first |

Note the ordering: **the cheapest, fastest-compounding work is commenting, not
posting.** Most people invert this and burn out writing original posts nobody
sees.

## Who executes this

Publishing must be done by a human. Reddit and Quora require phone/CAPTCHA
verification, and both platforms' spam systems specifically target automated
promotional posting — an agent running these accounts is the single fastest way
to get shadowbanned, which is strictly worse than not participating.

Everything here is written so that execution requires **no composition and no
judgment calls** — open the file, copy the block, paste it in the named place.
Budget ~10 minutes per item.

## The one rule that keeps you un-banned

**Disclose, every time, in the comment itself.** One clause is enough:

> *(I'm a certified mediator in Florida — high-conflict specialty — so take my
> read with that in mind.)*

This is not optional and it is not a cost. It is what buys you the right to
answer substantively at all. Moderators remove undisclosed professionals on
sight; disclosed professionals who are actually useful get flaired as experts
and become the sub's go-to. The disclosed version also reads as more
authoritative to the AI engines parsing the thread.

Corollaries:
- **Never** use a second account to ask a question you then answer. This is the
  one unrecoverable offense.
- **Never** paste the same text in two subs. Rewrite, or skip the second sub.
- Follow the 90/10 guideline: at least 9 of every 10 contributions are pure help
  with no mention of your practice.

## What's not in this repo (the local/entity half)

Listed so it doesn't get lost, not because it's optional:

1. Google Business Profile — claimed, categorized as *Mediation service*, with
   real photos and a review-request routine.
2. Directory listings with identical name/phone/address: Mediate.com, the
   Florida DRC roster, Justia, Avvo, Yelp, Nextdoor.
3. `FAQPage` and `LocalBusiness`/`ProfessionalService` schema on the website.
4. The website itself — this repo is `New-Website` and is currently empty. An
   FAQ hub answering the same questions as the answer libraries is what gives
   the AI engines a *second* corroborating source, which is what turns a
   citation into a recommendation.

Item 4 is the highest-value follow-on. The Reddit and Quora answers are more
citable when a page on your own domain says the same thing.
