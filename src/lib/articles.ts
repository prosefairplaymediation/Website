// The Mediation Process articles — one source of truth for the index page
// at /process and for each article's own Article schema.
//
// Same shape as src/lib/faq.ts: the data lives here, the pages read from it,
// so a new article is added in one place and appears everywhere at once.
//
// Dates are real, taken from the git history of each file rather than
// invented. `updated` matters more than `published` for search and answer
// engines, both of which weigh recency. When you materially revise an
// article, bump its `updated` date here.

export interface Article {
  /** Path segment under /process. */
  slug: string;
  /** Title as it appears in the index list. */
  title: string;
  /** Eyebrow label, matching the .kicker on the article itself. */
  kicker: string;
  /** One or two sentences for the index. Not the meta description. */
  blurb: string;
  /** ISO date, first published. */
  published: string;
  /** ISO date, last materially revised. */
  updated: string;
}

// Two articles have been removed for the same reason, which is why this note
// sits above the list rather than in a commit message nobody will read again.
//
//   "pro-se-divorce-florida" ("Filing for Divorce in Florida Without a Lawyer")
//   removed 2026-09-01: stated Florida filing requirements, eligibility rules
//   and dollar costs that could not be verified.
//
//   "is-mediation-required-before-divorce-in-florida" removed 2026-09-03: its
//   whole thesis was a contrast between Rule 12.740 ("may" refer) and section
//   44.102 ("shall" refer), which the owner identified as not accurate. The
//   claim ran through the body, the lede and the meta description, so the page
//   went rather than the summary.
//
//   "child-support-rules", "alimony-rules" and "real-estate-mediation" removed
//   2026-09-03, on the owner's instruction that none of this had been approved.
//   Between them they stated section 61.30 and section 61.075, the Income
//   Shares Model, durational alimony caps of 50/60/75 percent of the length of
//   the marriage, an award formula of 35 percent of the difference in net
//   incomes, enforcement powers, and a set of "what changed in 2026" claims
//   including a July 1 2026 paternity procedure. Precise numbers are the worst
//   kind of unverified claim: wrong by a little is still wrong, and a reader
//   plans around them.
//
// Anything added here makes factual claims about Florida family law under the
// practice's name. Check every one with the owner before publishing.
export const articles: Article[] = [
  {
    slug: "how-mediation-works",
    title: "How Mediation Works",
    kicker: "The Process",
    blurb:
      "What actually happens in a session, from preparation through negotiation to a signed, court-ready agreement, and what each possible outcome means.",
    published: "2026-06-26",
    updated: "2026-08-22",
  },
  {
    slug: "pre-litigation-disputes",
    title: "Pre-Litigation Disputes",
    kicker: "Before You File",
    blurb:
      "Mediating before anyone files. What a signed agreement means when no case exists, and how to file a family case with an agreement already in hand.",
    published: "2026-08-19",
    updated: "2026-08-22",
  },
];

/** Lookup used by ArticleSchema.astro. Returns undefined for unknown slugs. */
export function findArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

/** "August 22, 2026" — for display in the index. */
export function formatDate(iso: string): string {
  // Parse the parts by hand rather than through Date(): `new Date("2026-08-22")`
  // is treated as UTC midnight and can render as the previous day west of
  // Greenwich, which is exactly where this site's readers are.
  const [y, m, d] = iso.split("-").map(Number);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[m - 1]} ${d}, ${y}`;
}
