// Turning the opening hours into something a person reads.
//
// The times in src/consts.ts are 24-hour because that is what schema.org's
// openingHoursSpecification takes, and the same array feeds both the
// structured data and the contact page. One source, so the hours a visitor
// reads and the hours Google reads cannot drift apart — which they would
// within a month if the page carried its own copy.

import { OPENING_HOURS, type OpeningHours } from "../consts.ts";

/** "09:00" -> "9 am", "12:00" -> "Noon", "21:00" -> "9 pm", "12:30" -> "12:30 pm". */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (h === 12 && m === 0) return "Noon";
  if (h === 0 && m === 0) return "Midnight";
  const suffix = h < 12 ? "am" : "pm";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/**
 * ["Monday".."Friday"] -> "Monday – Friday"; a single day stays itself.
 *
 * Only collapses a genuinely consecutive run. A set like Monday, Wednesday,
 * Friday is listed out rather than rendered as a range that would be a lie.
 */
const ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function formatDays(days: string[]): string {
  if (days.length === 1) return days[0];
  const indexes = days.map((d) => ORDER.indexOf(d)).sort((a, b) => a - b);
  const consecutive = indexes.every((n, i) => i === 0 || n === indexes[i - 1] + 1);
  return consecutive
    ? `${ORDER[indexes[0]]} – ${ORDER[indexes[indexes.length - 1]]}`
    : days.join(", ");
}

export interface HoursRow {
  days: string;
  hours: string;
}

export const hoursRows: HoursRow[] = OPENING_HOURS.map((slot: OpeningHours) => ({
  days: formatDays(slot.days),
  hours: `${formatTime(slot.opens)} – ${formatTime(slot.closes)}`,
}));
