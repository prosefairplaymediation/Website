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

export const articles: Article[] = [
  {
    slug: "pro-se-divorce-florida",
    title: "Filing for Divorce in Florida Without a Lawyer",
    kicker: "Self-Represented",
    blurb:
      "Florida has two pro se routes and which applies turns on whether there are minor children. Eligibility, real costs, and where a mediator is worth paying for.",
    published: "2026-08-28",
    updated: "2026-08-28",
  },
  {
    slug: "is-mediation-required-before-divorce-in-florida",
    title: "Is Mediation Required Before Divorce in Florida?",
    kicker: "Florida Law",
    blurb:
      "Rule 12.740 says a contested family matter may be referred to mediation. Section 44.102 says parental responsibility disputes shall be. The difference is the whole answer.",
    published: "2026-08-24",
    updated: "2026-08-24",
  },
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
    slug: "child-support-rules",
    title: "Updated Child Support Rules",
    kicker: "Florida Law",
    blurb:
      "Florida uses statutory guidelines to calculate support. The 2023 changes altered how overnights factor into the number.",
    published: "2026-06-26",
    updated: "2026-07-12",
  },
  {
    slug: "alimony-rules",
    title: "Updated Alimony Rules",
    kicker: "Florida Law",
    blurb:
      "Florida's alimony laws changed on July 1, 2023. Permanent alimony ended, and what remains is shorter-term support aimed at financial independence.",
    published: "2026-06-26",
    updated: "2026-08-22",
  },
  {
    slug: "real-estate-mediation",
    title: "Real Estate Mediation",
    kicker: "Property & Real Estate",
    blurb:
      "The marital home is usually the largest asset and the hardest to divide. How real property is handled, what happens to the mortgage, and where mediation fits.",
    published: "2026-08-19",
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
