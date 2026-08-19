// Single source of truth for the FAQ.
//
// Consumed by /faq (the accordion and its FAQPage schema) and by the chat
// widget's data endpoint. Keeping one copy is the point: an answer shown in
// chat that no longer matches the page would be worse than no chat at all.

export interface Faq {
  q: string;
  a: string;
}

export const faqs = [
  {
    q: "Why should I choose mediation instead of letting a judge decide?",
    a: `Mediation allows you to maintain control over decisions that directly affect your life and your family. In court, outcomes are determined by a judge with limited time and limited insight into your day-to-day reality. Mediation provides a structured environment where you can actively participate in shaping the outcome — heard, understood, and involved in meaningful decision-making. This often leads to more practical, sustainable, and thoughtful resolutions.`,
  },
  {
    q: "How do I know this process will be fair?",
    a: `Fairness in mediation comes from structure — not chance. I manage the process to ensure balanced participation from both parties, controlled and respectful communication, and clear boundaries that prevent one-sided discussions. My role is not to take sides, but to maintain a neutral, structured environment where both parties can engage productively.`,
  },
  {
    q: "Will I actually be heard, or will this feel like another stressful conversation?",
    a: `You will be heard. Many clients come into mediation feeling overlooked, interrupted, or unable to fully express themselves. My role is to ensure that does not happen. I create a setting where each party has the opportunity to speak clearly, conversations are guided rather than chaotic, and communication remains focused and productive. The process is designed so you feel seen, respected, and engaged — not overwhelmed.`,
  },
  {
    q: "What if the other party is difficult, controlling, or unwilling to cooperate?",
    a: `This is one of the most common concerns — and one of the primary reasons mediation is needed. I guide the process in a way that maintains structure regardless of behavior, prevents conversations from escalating, and keeps discussions moving forward. While I cannot control the other party, I control the framework of the process, which is often what creates progress even in high-conflict situations.`,
  },
  {
    q: "Is mediation a safe and confidential environment?",
    a: `Yes. Mediation is conducted in a private, controlled, and confidential setting. This allows both parties to speak openly without unnecessary exposure, explore solutions without pressure, and focus on resolution rather than conflict. Confidentiality supports a more productive process and helps create a space where meaningful progress can occur.`,
  },
  {
    q: "How are you selected as a mediator, and can attorneys be involved?",
    a: `I am engaged as a mediator in two primary ways. Parties may privately and mutually choose me as their mediator — whether they are represented by counsel, unrepresented, or a combination of both. In other cases, the court requires mediation, and I may be appointed or selected to serve within that structure. In both situations I regularly work with parties represented by counsel as well as situations where only one party has an attorney. I remain a neutral facilitator throughout, maintaining a structured and balanced process.`,
  },
  {
    q: "Do I need an attorney to work with you?",
    a: `No. I work with individuals navigating matters independently, as well as clients who are represented by counsel. If attorneys are involved, I coordinate within that framework. If not, I ensure the process remains structured, clear, and accessible.`,
  },
  {
    q: "Will you tell me what I should do or give legal advice?",
    a: `My role is to guide the process — not to make decisions for you. I facilitate discussions, maintain structure, and help organize outcomes. All decisions remain yours. If legal advice is needed, you may consult with an attorney at any time.`,
  },
  {
    q: "What if we don't reach an agreement?",
    a: `Not all matters resolve immediately, and that is part of the process. Even without a full agreement, mediation often narrows the issues, improves communication, and creates a clearer path forward. This alone can significantly reduce time, stress, and cost moving forward.`,
  },
  {
    q: "How does mediation help families specifically?",
    a: `Mediation creates a structured environment where families can make thoughtful decisions without relying solely on the court. It allows you to create solutions that reflect your real-life needs, maintain greater control over outcomes, and reduce unnecessary conflict and disruption. Most importantly, it provides a setting where you can feel safe in the process, heard in your concerns, and seen in your role and perspective.`,
  },
  {
    q: "What is the biggest benefit of working with you as a mediator?",
    a: `The ability to move forward with clarity, control, and confidence. My approach is designed to reduce chaos and confusion, provide structure where it's needed most, and create outcomes that are organized and practical. This is not just about resolving a dispute — it's about creating a path forward that works.`,
  },

  // ---------------------------------------------------------------
  // Practical questions people actually search for. Added to widen
  // search coverage and to give the FAQPage schema more to work with.
  // Every answer describes the PROCESS. None of them tells anyone what
  // to do in their own case, which is the line the disclaimer draws.
  // ---------------------------------------------------------------
  {
    q: "How much does divorce mediation cost in Florida?",
    a: `Rates depend on the service. Mediation is billed hourly at a combined rate that is most often split between the two parties, and document preparation is a flat fee. Every current rate, along with the refund and cancellation policy, is listed on the pricing page.`,
  },
  {
    q: "How long does mediation take?",
    a: `Many matters are resolved in a single session. Sessions are booked in one-hour, half-day, or full-day blocks, and more complex situations, several disputed issues, or high-conflict dynamics can take more than one. You will have a realistic estimate before anything is scheduled.`,
  },
  {
    q: "Is mediation required before a divorce in Florida?",
    a: `In most Florida circuits, family cases are ordered to mediation before a final hearing. The exact requirement depends on the circuit and on the case, and the court handling your matter is what sets it. Many people also choose to mediate voluntarily before anything is filed.`,
  },
  {
    q: "Can we mediate before filing for divorce?",
    a: `Yes, and it is often the better order. Reaching an agreement before anyone files means filing an uncontested case rather than a contested one, with the terms already settled and signed. Nothing is lost if you do not reach agreement, because the court route stays exactly where it was.`,
  },
  {
    q: "Do both parties have to agree to mediation?",
    a: `For private mediation, yes. Both sides choose to attend, which is why the first step is usually a conversation about whether the other party is willing. When a court orders mediation, attendance is directed by the court rather than chosen.`,
  },
  {
    q: "Do I have to be in the same room as the other party?",
    a: `No. Sessions are held over Zoom, and part of the process happens in private conversations where each party speaks with me separately. If being in a shared space with the other party is a concern, the structure of the session can account for that.`,
  },
  {
    q: "Is a mediated agreement legally binding?",
    a: `When a full agreement is reached, it is put in writing and signed during the session. You leave with a court-ready document, and clients are responsible for filing their own documents with the appropriate court. What a signed agreement means for your specific circumstances is a legal question rather than a process question, and you are encouraged to have an independent attorney review any agreement before you sign it.`,
  },
  {
    q: "Who pays for mediation?",
    a: `The hourly rate is a combined rate, most commonly split evenly between the two parties. One party may also choose to pay in full. Document preparation is generally paid by the person requesting it.`,
  },
  {
    q: "How do I prepare for a mediation session?",
    a: `Come knowing which issues you want resolved and bring any financial information relevant to them. The intake forms and the engagement agreement are on the document portal, and completing those in advance keeps the session focused. Most of the preparation is simply being clear with yourself about what matters most before the conversation starts.`,
  },
  {
    q: "Is mediation cheaper than going to court?",
    a: `It is generally far less expensive than a contested case, because it takes less time and involves fewer hearings. No cost can be guaranteed, and the total depends on how much is genuinely in dispute, but resolving issues in a session rather than through repeated court appearances removes a significant amount of expense.`,
  },
  {
    q: "What areas of Florida do you serve?",
    a: `Sessions are conducted over Zoom, so the practice serves clients throughout Florida. The office is in West Palm Beach, in Palm Beach County, and evening and weekend sessions are available to work around your schedule.`,
  },
  {
    q: "What is a parenting plan?",
    a: `A parenting plan sets out how parents will share time with their children and how decisions about the children will be made. Florida courts require one in cases involving minor children. It is prepared to be clear, practical, and court-ready.`,
  },
  {
    q: "What forms do I need to file for a divorce in Florida?",
    a: `The Florida Supreme Court publishes the official family law forms, and which ones apply depends entirely on your circumstances. The document portal links the official forms directly, and the Turn-Key Court Packet assembles a complete, filing-ready set with notarization where applicable. Which forms your particular case requires is a legal question, not something I decide for you.`,
  },
  {
    q: "What is the difference between mediation and arbitration?",
    a: `In arbitration, a third party listens to both sides and then issues a decision that binds them. In mediation, nobody decides anything for you. My role is to guide the conversation and hold the structure, and any agreement reached is one you chose to make.`,
  },
];

// Common questions the FAQ does not answer. These do not invent an answer;
// each gives one factual line and points at the page that actually holds it.
export interface Route extends Faq {
  keys: string;
  href: string;
  cta: string;
}

export const routes: Route[] = [
  {
    q: "How much does it cost?",
    a: `Rates depend on the service, and they are all listed on the pricing page along with the refund and cancellation policy.`,
    keys: "cost costs price pricing fee fees rate rates how much charge expensive afford payment pay",
    href: "/pricing",
    cta: "See pricing",
  },
  {
    q: "How do I book a consultation?",
    a: `The first consultation is free and runs about fifteen minutes. You can pick a time that suits you on the booking page.`,
    keys: "book booking schedule appointment consultation consult available availability calendar time slot",
    href: "/book",
    cta: "Book a free consultation",
  },
  {
    q: "Where do sessions take place?",
    a: `Sessions are held over Zoom, so they work anywhere in Florida. Evening and weekend times are available.`,
    keys: "where location located office in person meet meeting zoom online remote virtual travel address florida county",
    href: "/book",
    cta: "See available times",
  },
  {
    q: "Can I speak to Marie directly?",
    a: `Yes. You can reach the practice by email or phone, and Marie responds personally.`,
    keys: "speak talk call phone email contact reach directly human person marie someone",
    href: "/contact",
    cta: "Contact details",
  },
  {
    q: "What documents do I need?",
    a: `The intake forms, the engagement agreement, and the official Florida family law forms are all gathered on the document portal.`,
    keys: "documents document forms paperwork intake packet agreement download",
    href: "/documents",
    cta: "Open document portal",
  },
];

// Extra search terms per FAQ entry, indexed by question. Held here rather than
// on the entries themselves so the client-facing copy stays clean, and so a
// missed match is fixed by adding a word here instead of editing an answer.
export const faqKeys: Record<string, string> = {
  "Why should I choose mediation instead of letting a judge decide?": "judge court why instead decide decision control trial litigation courtroom",
  "How do I know this process will be fair?": "fair fairness balanced bias biased sides neutral equal unfair",
  "Will I actually be heard, or will this feel like another stressful conversation?": "heard listen listened voice express speak stressful stress overwhelmed interrupted ignored",
  "What if the other party is difficult, controlling, or unwilling to cooperate?": "difficult controlling uncooperative cooperate refuses hostile angry ex spouse husband wife narcissist manipulative escalate impossible deal handle unreasonable stubborn toxic bully abusive combative",
  "Is mediation a safe and confidential environment?": "safe safety confidential confidentiality private privacy secret disclosed public record",
  "How are you selected as a mediator, and can attorneys be involved?": "selected chosen choose appointed ordered attorneys involved counsel represented",
  "Do I need an attorney to work with you?": "need attorney lawyer require representation represented alone myself without hire",
  "Will you tell me what I should do or give legal advice?": "legal advice advise recommend opinion guidance decide",
  "What if we don't reach an agreement?": "agreement agree impasse fail fails stuck unresolved settle settlement",
  "How does mediation help families specifically?": "family families kids children child parenting custody timesharing",
  "What is the biggest benefit of working with you as a mediator?": "benefit benefits best advantage different difference special",
  "How much does divorce mediation cost in Florida?": "divorce cost costs price how much fee expensive",
  "How long does mediation take?": "long duration hours session sessions time takes quick fast",
  "Is mediation required before a divorce in Florida?": "required require mandatory have to must ordered order divorce before",
  "Can we mediate before filing for divorce?": "before filing file divorce petition uncontested prelitigation",
  "Do both parties have to agree to mediation?": "both parties agree consent willing refuse other side",
  "Do I have to be in the same room as the other party?": "same room together separate apart alone caucus face",
  "Is a mediated agreement legally binding?": "binding legally enforceable contract signed judgment final",
  "Who pays for mediation?": "who pays paying split cost share half responsible",
  "How do I prepare for a mediation session?": "prepare preparation ready bring paperwork beforehand expect",
  "Is mediation cheaper than going to court?": "cheaper cheap less expensive save money compare court trial",
  "What areas of Florida do you serve?": "area areas serve county counties palm beach florida statewide region",
  "What is a parenting plan?": "parenting plan timesharing custody schedule children",
  "What forms do I need to file for a divorce in Florida?": "forms form file filing divorce paperwork packet supreme court",
  "What is the difference between mediation and arbitration?": "arbitration arbitrator difference versus compare litigation",
};
