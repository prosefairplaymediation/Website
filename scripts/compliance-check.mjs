// Compliance gate for automatically generated articles.
//
// Publishing runs with no human in the loop, so this is the only thing
// standing between a bad generation and the live site. It is deliberately
// blunt: any hit fails the run and nothing is committed. A missed post is
// cheap; a post telling someone what to file is not.
//
// Every rule here traces to a standing rule in CLAUDE.md. Do not soften one
// to get a draft through — fix the draft, or drop the topic.

/** @typedef {{ rule: string, why: string, match: string, line: number }} Finding */

const RULES = [
  {
    rule: "legal-advice",
    why: "Not a law firm. Describe the process; never tell a reader what to do in their own case.",
    // A directive is only advice when it points at a legal act. Matching
    // "you should" alone flagged "everything you need to get started" on the
    // live Documents page, so the verb has to be a legal one.
    patterns: [
      /\byou\s+(?:should|must|need to|ought to|have to)\s+(?:\w+\s+){0,3}?(?:file|sign|accept|reject|agree to|petition|serve|submit|request|waive|contest|settle|litigate|sue|countersue|hire an attorney)\b/gi,
      /\b(?:I|we)\s+(?:advise|recommend that you|suggest that you)\b/gi,
      /\byour best (?:option|course|move|bet)\b/gi,
      /\bin your (?:case|situation),?\s+(?:you|the court|a judge)\b/gi,
    ],
    // Clears the disclaimer framing this site uses constantly: "I will not
    // tell you ... what you should accept."
    unless: /\b(?:not|cannot|can't|never|neither|no|do not|don't|does not|doesn't|will not|won't)\b/i,
  },
  {
    rule: "outcome-prediction",
    why: "Never predict what a court will do. That is legal advice and it is often wrong.",
    patterns: [
      /\b(?:the court|a judge|the judge)\s+will\s+(?:likely|probably|almost certainly|award|grant|order|rule)\b/gi,
      // Winning and losing are predictions on their own. Nobody wins a
      // confirmation email, so these need no object to be a violation.
      /\byou (?:will|would) (?:(?:not|never|likely|probably|almost certainly)\s+)*(?:win|lose|prevail)\b/gi,
      // Receiving is an everyday word, so it only predicts an outcome when the
      // thing received is one a court decides. Bare "you will get" flagged
      // "you will get a short acknowledgement", a sentence about an email,
      // on 17 live pages, which is the same over-matching the legal-advice
      // rule was already narrowed to avoid. Same fix: require the legal object.
      /\byou (?:will|would) (?:(?:not|never|likely|probably|almost certainly)\s+)*(?:receive|get|be awarded|be granted|keep|retain)\s+(?:\w+\s+){0,3}?(?:custody|time-?sharing|parental responsibility|alimony|spousal support|child support|equitable distribution|marital home|marital residence|the (?:house|home|property|car|vehicle)|primary (?:custody|residence)|majority (?:custody|time-?sharing)|a favou?rable (?:ruling|outcome|result|judgment|judgement)|more than half)\b/gi,
    ],
    // Clears the disclaimer framing ("no one can tell you what a judge will
    // award") while deliberately NOT clearing a negative prediction: "you will
    // not get custody" predicts an outcome just as much as the positive does,
    // so a plain negation window would be too generous here.
    unless:
      /\b(?:cannot|can't|can not|could not|couldn't|no one|nobody|never|not able to|impossible to|unable to)\s+(?:\w+\s+){0,3}?(?:tell|say|predict|promise|guarantee|know|forecast)\b/i,
  },
  {
    rule: "certification-claim",
    why: "The Florida Supreme Court certification is PENDING and must not be advertised anywhere.",
    patterns: [
      /\bcertified\s+(?:family\s+)?mediator\b/gi,
      /\bflorida supreme court certified\b/gi,
      /\bsupreme court[- ]certified\b/gi,
    ],
  },
  {
    rule: "we-file",
    why: "Settled: clients file their own documents. Never imply we submit or e-file anything.",
    patterns: [
      /\b(?:we|I|our office|the mediator)\s+(?:will\s+)?(?:file|e-file|submit)\b(?![^.]*\bnot\b)/gi,
      /\bfiled?\s+(?:with the court\s+)?on (?:your|the parties'?|their) behalf\b/gi,
      /\bcourt[- ]submitted\b/gi,
    ],
  },
  {
    rule: "stale-alimony",
    why: "Permanent alimony ended in Florida on 2023-07-01. Referring to it as current is factually wrong.",
    patterns: [/\bpermanent alimony\b/gi],
    // Fine when the sentence marks it as historical. Checked across the whole
    // sentence rather than as a lookahead, because the qualifier is as often
    // before the phrase ("Prior to 2023, permanent alimony was...") as after.
    unless:
      /\b(?:ended|eliminated|abolished|repealed|no longer|until|before|prior to|formerly|used to|was available|had been|pre-2023|2023)\b/i,
  },
  {
    rule: "fabricated-proof",
    why: "Never invent a review, testimonial, statistic, or credential.",
    patterns: [
      /\b(?:one|a recent|a former|a past)\s+client\s+(?:said|told|shared|wrote|reported)\b/gi,
      /\b(?:studies|research|statistics)\s+show\s+that\b/gi,
      /\b\d{1,3}%\s+of\s+(?:clients|couples|cases|mediations|divorces)\b/gi,
    ],
  },
  {
    rule: "law-firm-framing",
    why: "This is not a law firm and the mediator represents neither party.",
    patterns: [
      /\bour (?:attorneys|lawyers|legal team)\b/gi,
      /\b(?:we|I)\s+represent\s+(?:you|your interests|clients)\b/gi,
      /\blegal advice\b/gi,
    ],
    // "I do not provide legal advice" and "No legal advice — just clarity"
    // are the disclaimers we want, not violations.
    unless: /\b(?:not|cannot|can't|does not|doesn't|do not|don't|never|no|without|instead of|rather than|will you|do you)\b/i,
  },
];

/**
 * Text around `index` used to test a rule's `unless`.
 *
 * A window rather than a strict sentence: real disclaimers put the negation
 * in a neighbouring clause as often as the same one ("...is not a law firm.
 * I do not provide legal advice."). A sentence-only check produced four
 * false positives against the live site; this window produced none.
 */
function contextAt(text, index, radius = 260) {
  return text.slice(Math.max(0, index - radius), index + radius);
}

/**
 * @param {string} text Rendered article prose. Pass visible copy, not markup.
 * @returns {Finding[]} Empty means the draft passed.
 */
export function checkCompliance(text) {
  /** @type {Finding[]} */
  const findings = [];
  const lines = text.split("\n");

  for (const { rule, why, patterns, unless } of RULES) {
    for (const pattern of patterns) {
      // Fresh lastIndex each pass — these are /g regexes and are reused
      // across calls, which otherwise silently skips matches.
      pattern.lastIndex = 0;
      let m;
      while ((m = pattern.exec(text)) !== null) {
        if (unless && unless.test(contextAt(text, m.index))) continue;
        const before = text.slice(0, m.index);
        const line = before.split("\n").length;
        findings.push({
          rule,
          why,
          match: m[0].replace(/\s+/g, " ").trim(),
          line,
        });
        if (m[0].length === 0) pattern.lastIndex++; // guard against zero-width loops
      }
    }
  }
  return findings;
}

/** Strip tags so the rules see prose rather than attributes and class names. */
export function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ");
}

/**
 * Calibration fixtures.
 *
 * A gate has two failure modes and both are silent. It can stop matching, and
 * then it passes everything; or it can match too broadly, and then it cries
 * wolf until someone starts ignoring it. The second one is what happened: a
 * bare "you will get" flagged an ordinary sentence about an email on 17 live
 * pages. So both directions are pinned here.
 *
 * Add a case whenever a rule is changed. MUST_FAIL keeps the rules honest;
 * MUST_PASS is real copy from the live site and keeps them proportionate.
 */
const MUST_FAIL = [
  ["legal-advice", "You should file a motion to compel."],
  ["legal-advice", "In your case, the court will decide timesharing."],
  ["outcome-prediction", "The judge will likely award primary residence to the mother."],
  ["outcome-prediction", "You will probably get custody of the children."],
  ["outcome-prediction", "You will be awarded the marital home."],
  ["outcome-prediction", "If you hold firm, you will win."],
  ["outcome-prediction", "You will not get custody if you move out."],
  ["certification-claim", "Marie is a certified family mediator."],
  ["we-file", "We will file the petition with the court."],
  ["we-file", "The agreement is filed with the court on your behalf."],
  ["stale-alimony", "Permanent alimony may be available to you."],
  ["fabricated-proof", "One client said the process changed her life."],
  ["fabricated-proof", "Studies show that mediation is faster."],
  ["fabricated-proof", "94% of couples settle at the first session."],
  ["law-firm-framing", "Our attorneys will review the agreement."],
];

const MUST_PASS = [
  "Leave your first name and email and you will get a short acknowledgement straight away.",
  "Once it is booked, a confirmation and Zoom details will be emailed to you.",
  "I do not provide legal advice.",
  "No legal advice, just clarity on what is possible and what comes next.",
  "Everything you need to get started.",
  "Clients are responsible for filing their own documents with the appropriate court.",
  "Prior to 2023, permanent alimony was available in Florida.",
  "No one can tell you what a judge will award in your matter.",
  "I will not tell you what you should accept.",
  "Document preparation covers the document only, and the client files it themselves.",
];

/** @returns {string[]} Empty means the gate is calibrated. */
export function selfTest() {
  const problems = [];
  for (const [rule, text] of MUST_FAIL) {
    const hit = checkCompliance(text).some((f) => f.rule === rule);
    if (!hit) problems.push(`MISSED [${rule}]  ${text}`);
  }
  for (const text of MUST_PASS) {
    for (const f of checkCompliance(text)) {
      problems.push(`FALSE POSITIVE [${f.rule}] on "${f.match}"  ${text}`);
    }
  }
  return problems;
}

// CLI: node scripts/compliance-check.mjs <file>
//      node scripts/compliance-check.mjs --selftest
if (process.argv[1] && process.argv[1].endsWith("compliance-check.mjs")) {
  const fs = await import("node:fs");
  const file = process.argv[2];
  if (file === "--selftest") {
    const problems = selfTest();
    if (problems.length === 0) {
      console.log(`PASS  gate calibrated (${MUST_FAIL.length} caught, ${MUST_PASS.length} cleared)`);
      process.exit(0);
    }
    console.error(`FAIL  gate is miscalibrated, ${problems.length} problem(s)\n`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  if (!file) {
    console.error("usage: node scripts/compliance-check.mjs <file|--selftest>");
    process.exit(2);
  }
  const findings = checkCompliance(htmlToText(fs.readFileSync(file, "utf8")));
  if (findings.length === 0) {
    console.log(`PASS  ${file}`);
    process.exit(0);
  }
  console.error(`FAIL  ${file} — ${findings.length} compliance finding(s)\n`);
  for (const f of findings) {
    console.error(`  line ${f.line}  [${f.rule}]  "${f.match}"`);
    console.error(`         ${f.why}\n`);
  }
  process.exit(1);
}
