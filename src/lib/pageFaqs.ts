/**
 * Page-specific question and answer sets.
 *
 * Separate from `faq.ts`, which holds the twenty-five general questions on
 * /faq. Nothing here repeats one of those: a question answered identically on
 * two pages splits the signal and gives an answer engine no reason to prefer
 * either. These are the questions that only make sense on the page they sit
 * on — what a specific fee covers, what a specific service excludes.
 *
 * Every answer is drawn from copy already published on that page. If a fee or
 * a policy changes on the page, it has to change here too.
 */
export interface Faq {
  q: string;
  a: string;
}

export const pageFaqs: Record<string, Faq[]> = {
  "hourly-mediation": [
    {
      q: "Is the $600 hourly rate per person or for both parties together?",
      a: "It is a combined rate for the session rather than a charge per person. Most parties split it evenly, which comes to $300 each per hour, and one party may also choose to pay the full amount.",
    },
    {
      q: "Can I book a single hour, or do I have to reserve a longer block?",
      a: "A single hour can be booked. Half-day, full-day and same-day sessions are also available, and longer matters are commonly reserved in blocks of two, four or eight hours. Which one fits is one of the things the free consultation is for.",
    },
    {
      q: "Is notarization charged separately?",
      a: "No. Marie VanGinHoven is a Notary Public, so documents arising from the mediation process that require notarization are notarized at no additional cost.",
    },
    {
      q: "Are evening and weekend mediation sessions available?",
      a: "Yes. Evening and weekend sessions are offered to accommodate work schedules, which matters when two people have to find the same free hours.",
    },
  ],

  "divorce-mediation": [
    {
      q: "What actually gets decided in a Florida divorce mediation?",
      a: "Four things, in most cases. Time-sharing and parental responsibility, which becomes your Parenting Plan. Child support, which Florida sets by statutory guidelines. Alimony, reshaped by the 2023 reform that ended permanent alimony. And the division of property, debts and the marital home, which is usually the hardest of the four.",
    },
    {
      q: "Are divorce mediation sessions held in person or over Zoom?",
      a: "Over Zoom, and they are confidential. Sessions being online is what makes the service workable for parties anywhere in Florida, and for two people who would rather not sit in the same room.",
    },
    {
      q: "Will the mediator tell us what a judge would probably order?",
      a: "No. Marie VanGinHoven is a neutral third party, not an attorney, and this is not a law firm. That means you will not be told what a court would likely do in your situation, whether an offer on the table is a good one, or what you should accept. Those are legal questions and they belong with an attorney who represents you. Either party may consult one at any point, and many people do exactly that between sessions.",
    },
    {
      q: "What happens once we reach an agreement?",
      a: "The terms are written up while everyone is still at the table, so that what you agreed to is captured accurately rather than reconstructed a week later. From there the supporting documents can be prepared in court-ready form, either as the Parenting Plan alone or as a complete Turn-Key Court Packet. Clients are responsible for filing their own documents with the appropriate court.",
    },
    {
      q: "What if we only agree on some of it?",
      a: "That is a normal outcome and not a wasted session. A partial agreement narrows what is left in dispute, which is worth real money if the remainder does go before a judge.",
    },
  ],

  "court-packet": [
    {
      q: "What is included in the $600 Turn-Key Court Packet?",
      a: "The preparation and completion of the mandatory family court forms and supporting documents required for filing, including financial affidavits, parenting plans, child support documentation, settlement agreements, supplemental petitions and other court-required filings as applicable to the matter. Documents are organized in filing-ready form and notarized where required. Up to two revisions are included.",
    },
    {
      q: "Does the Turn-Key Court Packet include filing the documents with the court?",
      a: "No. The packet is prepared so that it is ready to file, but clients are responsible for filing their own documents with the appropriate court. The preparation is the service; the filing is yours.",
    },
    {
      q: "Is notarization an extra charge on the Court Packet?",
      a: "No. Marie VanGinHoven is a Notary Public, so any forms in the packet that require notarization are handled as part of the process at no additional cost.",
    },
    {
      q: "How is the Court Packet different from Paternity Cases – Parenting Plan?",
      a: "Paternity Cases – Parenting Plan, at $600 flat, produces only the Parenting Plan document and none of the other court forms. The Turn-Key Court Packet, at $600 flat, is the full-service option and assembles the whole filing-ready set. If you are comfortable handling the remaining court forms yourself, the Parenting Plan service is the cheaper route.",
    },
    {
      q: "Can I get a refund on document preparation?",
      a: "Refunds are available before drafting or document preparation work begins. Once work has started, payments may instead be applied as a credit toward ongoing or future services, based on the status of the matter and the work completed. Once completed drafts or finalized documents have been delivered, the service is considered earned and non-refundable. Unforeseen circumstances are considered with care on a case-by-case basis.",
    },
  ],

  "parenting-plan": [
    {
      q: "What does the $600 Paternity Cases – Parenting Plan service include?",
      a: "A Parenting Plan customized to your family's schedule and structure, which may address time-sharing schedules, holidays, transportation, parental responsibility, communication guidelines and child support provisions. It is delivered in a clear, court-ready format.",
    },
    {
      q: "Does this include the other Florida court forms I need to file?",
      a: "No. This service is limited strictly to preparing the Parenting Plan document itself. The remaining Florida Supreme Court family law forms are available free from the Florida Courts website, or the Turn-Key Court Packet assembles the complete filing-ready set for $600 flat.",
    },
    {
      q: "Can the Parenting Plan be notarized?",
      a: "Yes. Online notarization of relevant documents may be added to this service for a $10 fee if it is needed.",
    },
    {
      q: "Who files the Parenting Plan with the court?",
      a: "You do. Clients are responsible for filing the completed Parenting Plan with the court independently.",
    },
  ],

  notary: [
    {
      q: "What kinds of documents can be notarized online?",
      a: "Family law forms, parenting plans, affidavits, business documents and other documents requiring notarization.",
    },
    {
      q: "How much does online notarization cost?",
      a: "It depends on the service it accompanies. Online notary services are included at no additional cost as part of the Turn-Key Court Packet, and documents arising from the mediation process are notarized at no additional cost as well. Clients using the Parenting Plan Only service may add online notarization for a $10 fee if needed.",
    },
    {
      q: "Do I have to come to an office to have a document notarized?",
      a: "No. Notarization is handled online through a certified online notary, so the document process stays remote.",
    },
  ],

  "gold-service": [
    {
      q: "What does Gold Service Mediation cost?",
      a: "It is quoted per matter rather than published as a rate. Arrangements are built around the matter and can include a private off-site venue or a multi-day format, some of which carry third-party costs, so a figure is given individually. Working out the format and the figure takes about fifteen minutes by Zoom, at no cost.",
    },
    {
      q: "Who is Gold Service Mediation designed for?",
      a: "High-profile individuals, executives, athletes, entertainers and business owners, and parties involved in sensitive or high-conflict disputes — anyone for whom confidentiality, reputation and a professionally managed environment are as important as the outcome.",
    },
    {
      q: "What does Gold Service include that hourly mediation does not?",
      a: "Private virtual or in-person sessions, controlled communication protocols, flexible evening and weekend scheduling, customized session structures and enhanced confidentiality measures. It also gives access to an in-house real estate professional for complex property matters, and an in-house financial specialist for business valuations, high-income situations, cryptocurrency and foreign-currency holdings, investments and detailed financial analysis.",
    },
    {
      q: "Can Gold Service sessions be held in person rather than over Zoom?",
      a: "Yes. Gold Service may include private in-person sessions as well as private virtual ones, which is part of what distinguishes it from the standard hourly service.",
    },
  ],

  pricing: [
    {
      q: "Is a processing fee added on top of the listed prices?",
      a: "No. The prices listed on this page are the prices charged, with no surcharge added at checkout. Payment by Zelle carries no processing fee either.",
    },
    {
      q: "What happens if I need to cancel a mediation session?",
      a: "Cancellations or rescheduling requests made more than twenty-four hours before a session are eligible for either a full refund to the original payment method or a full session credit toward a future session. Inside twenty-four hours, fifty percent of the mediation retainer is retained as a reserved session and preparation fee, and the remaining balance may be applied as a one-time credit toward a session rescheduled within thirty days, subject to availability. The Cancellation and Rescheduling Policy and the Refund Policy each have their own page and set out the remaining terms, including failure to appear.",
    },
    {
      q: "Can one party pay the whole mediation fee?",
      a: "Yes. The $600 hourly rate is a combined rate for the session, so it is commonly split evenly at $300 each per hour, but one party may pay it in full instead.",
    },
    {
      q: "Can I pay by Zelle instead of by card?",
      a: "Yes. Scan the Zelle code on this page in your banking app and the payment is addressed to Pro Se Fair Play Mediation LLC automatically. Enter the amount for the service you agreed on and put your name in the memo, and read the Engagement Agreement before paying. A Zelle payment does not send you on to a scheduling page the way the card options do, so book your session separately once it clears.",
    },
  ],

  "areas-served": [
    {
      q: "Do I have to live in Palm Beach County to work with you?",
      a: "No. Sessions are held over Zoom, so where you live in Florida does not limit whether we can work together. The office address is in West Palm Beach, but the sessions themselves are online.",
    },
    {
      q: "What is the difference between court-referred and private mediation in Florida?",
      a: "Court-referred mediation follows a filed case: a judge orders the parties to mediate and the circuit's own program handles it, under rules and income limits that circuit sets. Private mediation is chosen voluntarily by both parties and requires no filed case, no judge's order and no involvement from the court at all. Parties often use it before filing, so that what they eventually file is uncontested. Private mediation is the service offered here.",
    },
    {
      q: "We earn too much for the court's mediation program. What are our options?",
      a: "Several Florida circuits limit their staff mediation programs to households under roughly $100,000 in combined income. Couples above that threshold are generally not eligible for the court's own mediators and arrange private mediation instead. Whether mediation is required in your particular case, and which programs you qualify for, are questions for the court where the case would be filed or for an attorney who represents you.",
    },
  ],
};
