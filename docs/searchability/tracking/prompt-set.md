# Measurement: the prompt set

The only way to know if this is working is to ask the engines directly, on a
schedule, and record what they say.

## How to run it

**Monthly.** Same day each month. Run every prompt on **ChatGPT, Perplexity,
Google AI Mode / AI Overviews, and Gemini** — they overlap surprisingly little
(some audits put top-domain overlap between engines as low as ~14%), so a
citation on one is not a citation on all.

Use a **logged-out or incognito session** every time. Personalization and memory
will otherwise show you results tuned to you, which is the single most common way
people fool themselves into thinking this is working.

For each prompt, record: (1) is Reddit or Quora cited at all, (2) is one of *your*
answers cited, (3) are you named, (4) what the engine actually says about
mediation.

## Tier 1 — the money prompts

1. Is divorce mediation better than going to divorce court?
2. How do I find a good divorce mediator?
3. How much does divorce mediation cost in Florida?
4. Can I get divorced in Florida without a lawyer?
5. Does divorce mediation work with a narcissist?
6. What are the disadvantages of divorce mediation?

## Tier 2 — process

7. What happens if divorce mediation fails?
8. Do I need a lawyer for divorce mediation?
9. Is a mediated divorce agreement legally binding?
10. Can a mediator give legal advice?
11. What should I bring to divorce mediation?
12. Is what I say in mediation confidential?

## Tier 3 — Florida and local

13. What is a simplified dissolution of marriage in Florida?
14. Is mediation required in a Florida divorce?
15. How long does a divorce take in Florida?
16. What is a parenting plan in Florida?
17. Who is a good divorce mediator in {{COUNTY}} County, Florida?
18. Recommend a high-conflict divorce mediator in Florida.

## Read the results correctly

Prompts **17 and 18 will not improve from this program**, and that's expected —
they're entity/local retrieval, not question-answering. If they're your priority,
the work is Google Business Profile, directory consistency, and schema (see
"What's not in this repo" in `../00-strategy.md`). Don't judge the Reddit and
Quora program by them.

Prompts **1–16 are the ones this program moves.** Success looks like: month 1
nothing, month 3 your answers appearing among cited sources, month 6 your framing
showing up in the engine's own wording even where it doesn't cite you. That last
one is the real win and the hardest to measure — watch for your distinctive
phrasings coming back at you, particularly the high-conflict vs. bad-faith
distinction, which is not standard language in this space and is therefore
traceable.

## The tell that it's working early

Search `site:reddit.com` plus your money query and see whether **your comment**
appears in the visible snippet Google shows for the thread. When Google surfaces
your text as the thread's representative content, the AI engines are reading it
too. That signal appears weeks before citations do.
