// Weekly article generator. Run by .github/workflows/weekly-article.yml.
//
// Flow: take the first queued topic -> research it with web search ->
// draft it under the site's compliance rules -> run the compliance gate ->
// write the page and register it -> build. The workflow commits only if
// every step passes. Any failure leaves the repo untouched.
//
// Two calls rather than one: the research pass uses the web_search server
// tool, and the drafting pass uses structured outputs. Citations and
// output_config.format do not combine, so they are kept apart.

import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { checkCompliance, htmlToText } from "./compliance-check.mjs";

const MODEL = "claude-opus-5";
const QUEUE = "content/topic-queue.json";
const LIB = "src/lib/articles.ts";
const PAGES = "src/pages/process";

const client = new Anthropic();

/** Today as YYYY-MM-DD, UTC. The workflow runs on a UTC cron. */
const today = new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------- queue

const queue = JSON.parse(fs.readFileSync(QUEUE, "utf8"));
const topic = queue.topics.find((t) => t.status === "queued");

if (!topic) {
  // Not an error. An empty queue means there is nothing worth saying this
  // week, and publishing filler to hit a cadence is how sites get flagged.
  console.log("No queued topics. Nothing to publish.");
  process.exit(78); // neutral: the workflow treats this as a clean no-op
}
if (fs.existsSync(path.join(PAGES, `${topic.slug}.astro`))) {
  console.error(`Page already exists for "${topic.slug}". Fix the queue.`);
  process.exit(1);
}
console.log(`Topic: ${topic.title}`);

// ------------------------------------------------------------- research

console.log("Researching...");
const research = await client.messages.create({
  model: MODEL,
  max_tokens: 8000,
  thinking: { type: "adaptive" },
  tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }],
  messages: [
    {
      role: "user",
      content: `Research this question for a Florida mediation practice's explainer article: "${topic.question}"

Angle to cover: ${topic.angle}

Report back:
1. The current state of the relevant Florida rule or statute, with its number, and the date of the most recent change you can confirm.
2. Anything that changed recently enough that older articles on this topic are now wrong.
3. Facts you could NOT confirm from a reliable source. Be explicit — an unconfirmed fact must not reach the draft.

Do not write the article. Report findings only. Prefer flcourts.gov, leg.state.fl.us, floridabar.org and Florida court sites over marketing blogs.`,
    },
  ],
});

const researchText = research.content
  .filter((b) => b.type === "text")
  .map((b) => b.text)
  .join("\n");

if (research.stop_reason === "refusal") {
  console.error("Research call refused:", research.stop_details);
  process.exit(1);
}
console.log(`Research: ${researchText.length} chars`);

// --------------------------------------------------------------- draft

const RULES = `You write for Pro Se Fair Play Mediation, LLC — a Florida mediation and
document-preparation practice run by Marie VanGinHoven. These rules are absolute.
A draft that breaks one is discarded.

1. NOT A LAW FIRM. Describe process. Never tell the reader what to do in their
   own case, never predict what a court will do, never evaluate whether an offer
   is good. Route legal questions to "an attorney who represents you".
2. THE CLIENT FILES. We prepare documents court-ready. We never file, e-file, or
   submit anything to a court, and never "on your behalf".
3. NO CERTIFICATION CLAIM. Do not describe Marie as certified. Her Florida
   Supreme Court certification is pending and must not be advertised.
4. INVENT NOTHING. No statistics, reviews, testimonials, case examples, or
   client quotes. If the research did not confirm it, leave it out.
5. Permanent alimony ENDED in Florida on 2023-07-01. Only ever refer to it in
   the past tense.
6. Mediation is confidential and the mediator is a neutral serving both parties.

VOICE: plain, calm, second person, short sentences, no marketing hype. Match a
site that says things like "Most people arrive expecting a fight. What usually
happens instead is a long conversation about logistics." No em dashes — use a
comma or a full stop. Around 500-700 words.

HTML: the body is fragment HTML for insertion into an article. Use only <h2>,
<h3>, <p>, <ul>, <li>, <strong>, and <a class="link-underline" href="...">.
No <h1>, no wrapper div, no classes other than link-underline. Link to these
internal pages where genuinely relevant, never more than three times total:
/services/divorce-mediation, /services/hourly-mediation, /services/parenting-plan,
/services/court-packet, /process/how-mediation-works, /process/alimony-rules,
/process/child-support-rules, /faq, /book`;

console.log("Drafting...");
const draft = await client.messages.create({
  model: MODEL,
  max_tokens: 8000,
  thinking: { type: "adaptive" },
  system: RULES,
  output_config: {
    format: {
      type: "json_schema",
      schema: {
        type: "object",
        properties: {
          blurb: {
            type: "string",
            description: "One or two sentences for the index page. Under 200 characters.",
          },
          metaDescription: {
            type: "string",
            description: "Meta description, 140-158 characters, leading with the search term.",
          },
          lede: {
            type: "string",
            description: "One or two sentences under the page title. Plain text, no markup.",
          },
          bodyHtml: {
            type: "string",
            description: "The article body as fragment HTML.",
          },
        },
        required: ["blurb", "metaDescription", "lede", "bodyHtml"],
        additionalProperties: false,
      },
    },
  },
  messages: [
    {
      role: "user",
      content: `Write the article "${topic.title}".

Angle: ${topic.angle}

Verified research to work from. Use only what is confirmed here; anything the
researcher flagged as unconfirmed must not appear:

${researchText}`,
    },
  ],
});

if (draft.stop_reason === "refusal") {
  console.error("Draft call refused:", draft.stop_details);
  process.exit(1);
}

const article = JSON.parse(
  draft.content.filter((b) => b.type === "text").map((b) => b.text).join("")
);

// ------------------------------------------------------- compliance gate

const findings = checkCompliance(
  htmlToText([article.lede, article.bodyHtml, article.blurb, article.metaDescription].join("\n"))
);
if (findings.length) {
  console.error(`\nCOMPLIANCE FAIL — ${findings.length} finding(s). Nothing written.\n`);
  for (const f of findings) {
    console.error(`  [${f.rule}] "${f.match}"`);
    console.error(`      ${f.why}\n`);
  }
  process.exit(1);
}
console.log("Compliance: clean");

// Structural sanity, cheap to check and expensive to miss.
for (const [label, bad] of [
  ["contains <h1>", /<h1[\s>]/i],
  ["contains an em dash", /—/],
  ["contains a script tag", /<script/i],
  ["links off-site", /href="https?:\/\/(?!prosefairplaymediation\.com)/i],
]) {
  if (bad.test(article.bodyHtml)) {
    console.error(`Draft ${label}. Nothing written.`);
    process.exit(1);
  }
}
const words = htmlToText(article.bodyHtml).split(/\s+/).filter(Boolean).length;
if (words < 300 || words > 1200) {
  console.error(`Draft is ${words} words, outside the 300-1200 range. Nothing written.`);
  process.exit(1);
}
console.log(`Structure: clean (${words} words)`);

// ----------------------------------------------------------- write page

// ArticleLayout carries the header, prose styling and closing CTA, so the
// generated file is metadata plus body and nothing else.
const page = `---
import ArticleLayout from "../../components/ArticleLayout.astro";
---

<ArticleLayout
  slug=${JSON.stringify(topic.slug)}
  title=${JSON.stringify(topic.title)}
  kicker=${JSON.stringify(topic.kicker)}
  lede=${JSON.stringify(article.lede)}
  description=${JSON.stringify(article.metaDescription)}
>
${article.bodyHtml.split("\n").map((l) => (l.trim() ? "  " + l.trim() : "")).join("\n")}
</ArticleLayout>
`;

fs.writeFileSync(path.join(PAGES, `${topic.slug}.astro`), page);
console.log(`Wrote ${PAGES}/${topic.slug}.astro`);

// ------------------------------------------------------- register in lib

const lib = fs.readFileSync(LIB, "utf8");
const entry = `  {
    slug: ${JSON.stringify(topic.slug)},
    title: ${JSON.stringify(topic.title)},
    kicker: ${JSON.stringify(topic.kicker)},
    blurb:
      ${JSON.stringify(article.blurb)},
    published: ${JSON.stringify(today)},
    updated: ${JSON.stringify(today)},
  },
`;
const anchor = "export const articles: Article[] = [\n";
if (!lib.includes(anchor)) {
  console.error(`Could not find the articles array in ${LIB}. Nothing registered.`);
  process.exit(1);
}
fs.writeFileSync(LIB, lib.replace(anchor, anchor + entry));
console.log(`Registered in ${LIB}`);

// ------------------------------------------------------------ mark done

topic.status = "published";
topic.publishedOn = today;
fs.writeFileSync(QUEUE, JSON.stringify(queue, null, 2) + "\n");
console.log(`Marked "${topic.slug}" published in the queue`);

// Surface for the workflow's commit message.
fs.writeFileSync(
  ".article-meta.json",
  JSON.stringify({ slug: topic.slug, title: topic.title, words }, null, 2)
);
