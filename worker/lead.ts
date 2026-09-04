/**
 * The shape of a captured lead.
 *
 * These types lived in worker/referent.ts until the CRM was removed on
 * 2026-09-04. They describe what the capture form collects, which is not a
 * property of whatever the lead is later delivered to, so they outlived it.
 */

/** Exactly what the capture form collects. Nothing about the dispute. */
export interface Lead {
  first_name: string;
  email: string;
  /** Optional, and in E.164 by the time it gets here. May be empty. */
  phone: string;
  /** Whether the texting box was ticked. No box, no text, see notify.ts. */
  sms_consent: boolean;
  timeframe: string;
  topic: string;
  source_page: string;
  source_url: string;
  captured_at: string;
  /** Google click ID and campaign tags, if this visitor arrived with any. */
  attribution: Attribution | null;
}

export interface Attribution {
  first?: AttributionTouch;
  last?: AttributionTouch;
  first_seen?: string;
  last_seen?: string;
}

export interface AttributionTouch {
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  landing_page?: string;
  referrer?: string;
}
