// Service definitions for the per-page Service schema.
//
// Only /services/divorce-mediation carried its own structured data; the other
// five had nothing beyond the site-wide ProfessionalService block, so a search
// or answer engine could see that the practice offers a Parenting Plan but not
// that /services/parenting-plan is the page about it, nor what it costs.
//
// Prices here must match the pages and the Stripe products. They are the same
// figures as the hasOfferCatalog block in BaseLayout.astro.

export interface ServiceDef {
  slug: string;
  name: string;
  description: string;
  /** Omit for services with no single published price. */
  price?: string;
  /** "HUR" marks an hourly rate; omit for a flat fee. */
  unit?: string;
  /** Short label for the /services index and breadcrumbs. */
  short: string;
  /** Human-readable price for display. */
  priceLabel: string;
}

export const services: ServiceDef[] = [
  {
    // NOTE: /services/divorce-mediation keeps its own inline Service block —
    // it is a hub page and its schema is shaped differently. This entry
    // exists so the page appears in the /services index and in breadcrumbs.
    // Do NOT add <ServiceSchema slug="divorce-mediation" /> to that page or
    // it will emit two Service blocks.
    slug: "divorce-mediation",
    short: "Divorce Mediation",
    priceLabel: "$600 / hour",
    name: "Divorce Mediation",
    description:
      "Neutral, confidential divorce mediation via Zoom, covering time-sharing, child support, alimony and division of property.",
  },
  {
    slug: "hourly-mediation",
    short: "Hourly Mediation",
    priceLabel: "$600 / hour",
    name: "Hourly Family Mediation",
    description:
      "Neutral, structured family mediation conducted via Zoom, sold by the hour or in two, four and eight hour blocks.",
    price: "600.00",
    unit: "HUR",
  },
  {
    // No published price. Gold arrangements are bespoke -- they can include a
    // private off-site venue and multi-day formats, some carrying third-party
    // costs -- so a figure is quoted per matter. Leaving `price` unset makes
    // ServiceSchema omit the Offer price rather than assert one.
    slug: "gold-service",
    short: "Gold Service",
    priceLabel: "Inquire within",
    name: "Gold Service Mediation",
    description:
      "The premium mediation tier, emphasizing discretion, privacy and close professional oversight throughout. Priced per matter.",
  },
  {
    slug: "parenting-plan",
    short: "Parenting Plan",
    priceLabel: "$400 flat",
    name: "Parenting Plan Preparation",
    description:
      "A Parenting Plan customised to one family's schedule and structure, delivered in a clear, court-ready format.",
    price: "400.00",
  },
  {
    slug: "court-packet",
    short: "Turn-Key Court Packet",
    priceLabel: "$600 flat",
    name: "Turn-Key Court Packet",
    description:
      "A complete family law document package, organised and assembled into a filing-ready packet, with notarisation where applicable.",
    price: "600.00",
  },
  {
    slug: "notary",
    short: "Online Notary",
    priceLabel: "$10 add-on",
    name: "Online Notary Services",
    description:
      "Remote online notarisation for family law forms, parenting plans, affidavits and business documents. Included with the Turn-Key Court Packet.",
    price: "10.00",
  },
];

export function findService(slug: string): ServiceDef | undefined {
  return services.find((s) => s.slug === slug);
}
