/**
 * The first five minutes.
 *
 * Someone reads about divorce at 10:30 at night, leaves an email, and closes
 * the laptop. Everything here exists so that they hear something back before
 * they have finished making tea, and so that Marie knows about them before
 * morning.
 *
 * Three messages, at most:
 *
 *   1. An alert to the practice. Always.
 *   2. A short acknowledgement to the visitor, with the booking link.
 *   3. The same, by text, but only if they gave a mobile number and ticked
 *      the box. See the consent section below — that box is not decoration.
 *
 * ## The screen that comes before any of it
 *
 * `docs/marketing/lead-automation.md` states the rule this file is built
 * around: an inquiry that mentions abuse, an injunction, threats or a fear for
 * anyone's safety must never receive an automated marketing message. Mediation
 * may be the wrong forum entirely, and a cheerful "here's my calendar!" sent
 * to someone describing violence is the worst thing this site could do.
 *
 * So `screen()` runs first, and it is deliberately trigger-happy. A false
 * positive costs one automated email that a human sends by hand instead. A
 * false negative is unforgivable. It is a keyword screen rather than a
 * language model on purpose: it is inspectable, it cannot be talked out of a
 * match, and it fails the same way every time.
 *
 * ## Consent, before any text message
 *
 * Texting a Florida prospect without prior express written consent is a live
 * exposure under both the federal TCPA and the Florida Telephone Solicitation
 * Act, and the FTSA is the aggressive one. So: the number is optional, the
 * consent box is separate, unticked, and next to the disclosure; no box means
 * no text, ever, regardless of what else is known about the person; and the
 * wording shown plus the moment it was agreed to are written into the CRM note
 * so the consent can be produced later. Reply STOP is honoured by the carrier
 * and by Twilio automatically; someone still has to action a "stop" that
 * arrives by email.
 *
 * ## Failure
 *
 * Nothing in this file can fail the lead. The contact is created in Referent
 * first and the visitor is answered; these run after, and a dead provider
 * produces a log line, not a lost lead.
 */
import type { Lead } from "./referent.ts";

export interface NotifyEnv {
  /** Resend. Without a key, no email is sent and it says so in the log. */
  RESEND_API_KEY?: string;
  /** Must be a domain verified in Resend. */
  NOTIFY_FROM?: string;
  /** Where practice alerts go. */
  NOTIFY_TO?: string;

  /** Twilio. Without all three, no text is sent. */
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM?: string;
  /** Marie's mobile, for the out-of-hours alert. Optional. */
  PRACTICE_SMS?: string;

  /** Override the consultation link if Calendly ever moves. */
  BOOKING_URL?: string;
}

const DEFAULT_BOOKING_URL =
  "https://calendly.com/prosefairplaymediation-info/free-consultation";
const PRACTICE_EMAIL = "info@prosefairplaymediation.com";
const PRACTICE_PHONE = "561-941-0896";
const PRACTICE_NAME = "Pro Se Fair Play Mediation";

/**
 * The exact wording shown next to the consent box, versioned. If the wording
 * on the form changes, add a version here and change it there in the same
 * commit — the pair is the evidence that consent was informed.
 */
export const SMS_CONSENT_WORDING_V1 =
  "Text me at this number about my inquiry. Message and data rates may apply. " +
  "Reply STOP at any time to stop.";

/* ------------------------------------------------------------------ screen */

/**
 * Words that mean a person, not an automation, answers this one.
 *
 * Kept broad and readable rather than clever. Anything matching here suppresses
 * every automated message to the visitor and turns the practice alert urgent.
 */
const CONCERNS: Array<[RegExp, string]> = [
  [/\b(abus\w*|batter\w*|violen\w*|domestic violence|dv)\b/i, "abuse or violence"],
  [/\b(injunction|restraining order|protective order|no.?contact order)\b/i, "an injunction or protective order"],
  [/\b(threat\w*|intimidat\w*|coerc\w*|harass\w*|stalk\w*)\b/i, "threats, coercion or harassment"],
  // `safe` is matched bare, not only as "not safe": "I don't feel safe in the
  // same room" is the sentence this rule exists for, and it says nothing a
  // narrower pattern would catch. A benign "safe" costs one email sent by
  // hand.
  [/\b(afraid|scared|terrified|fear(s|ed|ful)? for|safe|unsafe|safety)\b/i, "a fear for someone's safety"],
  [/\b(hit me|hurt me|hurting me|assault\w*|strangl\w*|choke\w*)\b/i, "physical harm"],
  [/\b(weapon|gun|firearm|knife)\b/i, "a weapon"],
  [/\b(police|911|emergency room|shelter)\b/i, "police, emergency services or a shelter"],
  [/\b(kidnap\w*|abduct\w*|took the kids|took my kids)\b/i, "a child being taken"],
  [/\b(suicid\w*|self.?harm|kill (myself|himself|herself|themselves))\b/i, "self-harm"],
];

export interface Screen {
  /** True when no automated message may be sent to this person. */
  personalReview: boolean;
  /** Plain-language description of what matched, for the alert. */
  reason: string | null;
}

export function screen(lead: Lead): Screen {
  // Only free text is screened. The timeframe dropdown cannot say anything of
  // this kind, and a name or an email address matching one of these words is
  // a false positive with no upside.
  const text = lead.topic || "";
  for (const [pattern, reason] of CONCERNS) {
    if (pattern.test(text)) return { personalReview: true, reason };
  }
  return { personalReview: false, reason: null };
}

/* ------------------------------------------------------------------- send */

/**
 * Everything that happens after the contact exists in Referent.
 * Never throws: each leg reports into the log and the others carry on.
 */
export async function notify(env: NotifyEnv, lead: Lead, result: Screen): Promise<void> {
  const jobs: Array<Promise<void>> = [alertPractice(env, lead, result)];

  if (result.personalReview) {
    // Deliberately nothing to the visitor. A person replies to this one, or
    // nobody does.
    console.log(`lead: personal review (${result.reason}) — no automated reply sent`);
  } else {
    jobs.push(emailVisitor(env, lead));
    if (lead.phone && lead.sms_consent) jobs.push(textVisitor(env, lead));
  }

  await Promise.allSettled(jobs);
}

async function alertPractice(env: NotifyEnv, lead: Lead, result: Screen): Promise<void> {
  const urgent = result.personalReview;
  const lines = [
    urgent
      ? `This inquiry mentions ${result.reason}. No automated message has been sent, and none will be. Please read it yourself.`
      : `New inquiry from the website. An acknowledgement has been sent.`,
    ``,
    `Name:      ${lead.first_name}`,
    `Email:     ${lead.email}`,
    `Mobile:    ${lead.phone || "not given"}${lead.phone && !lead.sms_consent ? " (no texting consent — call, do not text)" : ""}`,
    `Timeframe: ${lead.timeframe || "not given"}`,
    `They said: ${lead.topic || "nothing"}`,
    `Page:      ${lead.source_url}`,
    `Time:      ${lead.captured_at}`,
  ];

  const arrival = lead.attribution?.first || lead.attribution?.last;
  if (arrival) {
    const campaign = [arrival.utm_source, arrival.utm_medium, arrival.utm_campaign]
      .filter(Boolean)
      .join(" / ");
    lines.push(
      `Came from: ${campaign || "an ad click"}${
        arrival.gclid || arrival.gbraid || arrival.wbraid ? " (paid click — recorded in the CRM)" : ""
      }`,
    );
  }

  await Promise.allSettled([
    sendEmail(env, {
      to: env.NOTIFY_TO || PRACTICE_EMAIL,
      subject: urgent
        ? `PERSONAL REVIEW — inquiry from ${lead.first_name}`
        : `New inquiry — ${lead.first_name} (${lead.timeframe || "no timeframe"})`,
      text: lines.join("\n"),
    }),
    env.PRACTICE_SMS
      ? sendSms(env, {
          to: env.PRACTICE_SMS,
          body: urgent
            ? `${PRACTICE_NAME}: inquiry from ${lead.first_name} mentions ${result.reason}. No auto-reply sent. Please read it.`
            : `${PRACTICE_NAME}: new inquiry from ${lead.first_name}, ${lead.timeframe || "no timeframe"}. ${lead.email}`,
        })
      : Promise.resolve(),
  ]);
}

/**
 * The acknowledgement.
 *
 * Short on purpose. The substantive note the form promises — what Florida
 * asks for before filing — is Marie's to send, and the draft for it is in
 * `docs/marketing/crm.md`. This one does three things: confirm a person will
 * see it, offer the calendar to anyone ready now, and say plainly what this
 * practice is and is not.
 *
 * Compliance, all of which is load-bearing: no claim about outcomes or success
 * rates (Rule 10.610), nothing that reads as advice about anyone's rights
 * (Rule 10.370), no suggestion of Supreme Court certification, and a working
 * way out at the bottom.
 */
async function emailVisitor(env: NotifyEnv, lead: Lead): Promise<void> {
  const booking = env.BOOKING_URL || DEFAULT_BOOKING_URL;

  const text = [
    `Hi ${lead.first_name},`,
    ``,
    `Thank you for reaching out through prosefairplaymediation.com. Your note`,
    `has reached me and I will follow up personally.`,
    ``,
    `If it would help to talk sooner, the first consultation is free and takes`,
    `about fifteen minutes. You can pick a time here:`,
    ``,
    `  ${booking}`,
    ``,
    `It is a conversation about how mediation works and whether it fits your`,
    `situation — not a commitment to anything.`,
    ``,
    `One thing worth saying plainly: I am a mediator and a document preparer,`,
    `not an attorney, and nothing from me is legal advice. If you want an`,
    `opinion about your rights, that is a lawyer's job.`,
    ``,
    `— Marie VanGinHoven`,
    `${PRACTICE_NAME}`,
    `${PRACTICE_PHONE} · ${PRACTICE_EMAIL}`,
    ``,
    `You are receiving this because you left your email on my website. Reply`,
    `"stop" and you will not be contacted again.`,
  ].join("\n");

  await sendEmail(env, {
    to: lead.email,
    subject: "Thank you for reaching out",
    text,
  });
}

/** The 10:30 p.m. text. One message, under a segment, with the way out in it. */
async function textVisitor(env: NotifyEnv, lead: Lead): Promise<void> {
  const booking = env.BOOKING_URL || DEFAULT_BOOKING_URL;
  await sendSms(env, {
    to: lead.phone,
    body:
      `Hi ${lead.first_name}, this is ${PRACTICE_NAME}. Thank you for reaching out — ` +
      `I have your request and will follow up. Book a free 15-minute consultation ` +
      `any time: ${booking} Reply STOP to stop.`,
  });
}

/* --------------------------------------------------------------- providers */

interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

async function sendEmail(env: NotifyEnv, message: EmailMessage): Promise<void> {
  if (!env.RESEND_API_KEY || !env.NOTIFY_FROM) {
    console.log(`notify: email to ${redact(message.to)} skipped — RESEND_API_KEY/NOTIFY_FROM unset`);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.NOTIFY_FROM,
        to: [message.to],
        reply_to: PRACTICE_EMAIL,
        subject: message.subject,
        text: message.text,
      }),
    });
    if (!res.ok) {
      console.error(`notify: email to ${redact(message.to)} failed — HTTP ${res.status} ${await safeText(res)}`);
      return;
    }
    console.log(`notify: emailed ${redact(message.to)}`);
  } catch (error) {
    console.error(`notify: email to ${redact(message.to)} threw — ${String(error)}`);
  }
}

interface SmsMessage {
  to: string;
  body: string;
}

async function sendSms(env: NotifyEnv, message: SmsMessage): Promise<void> {
  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_FROM: from } = env;
  if (!sid || !token || !from) {
    console.log(`notify: text to ${redact(message.to)} skipped — Twilio credentials unset`);
    return;
  }

  const to = toE164(message.to);
  if (!to) {
    console.error(`notify: text skipped — ${redact(message.to)} is not a usable number`);
    return;
  }

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: message.body }),
    });
    if (!res.ok) {
      console.error(`notify: text to ${redact(to)} failed — HTTP ${res.status} ${await safeText(res)}`);
      return;
    }
    console.log(`notify: texted ${redact(to)}`);
  } catch (error) {
    console.error(`notify: text to ${redact(message.to)} threw — ${String(error)}`);
  }
}

/**
 * US numbers only, which is the practice's service area. Anything that is not
 * unambiguously a US number is refused rather than guessed at — a text to the
 * wrong number is the sort of mistake that is expensive twice over.
 */
export function toE164(input: string): string | null {
  const trimmed = input.trim();
  if (/^\+[1-9]\d{7,14}$/.test(trimmed)) return trimmed;

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10 && !/^[01]/.test(digits)) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1") && !/^1[01]/.test(digits)) return `+${digits}`;
  return null;
}

/** Logs are readable by anyone with dashboard access; addresses are not. */
function redact(value: string): string {
  if (value.includes("@")) {
    const [user, domain] = value.split("@");
    return `${user.slice(0, 2)}***@${domain}`;
  }
  return `***${value.slice(-4)}`;
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 200);
  } catch {
    return "";
  }
}
