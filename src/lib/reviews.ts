// Shared build-time source for Google reviews and the "leave a review" link.
//
// This lives in one place for two reasons. The footer needs the review link
// while the reviews section needs the review list, and both come from the
// same Featurable call — so without sharing, every page that renders either
// would fire its own request. The result is memoized for the life of the
// build, so the API is hit once no matter how many pages import this.

import { GOOGLE_REVIEW_URL } from "../consts.ts";

const WIDGET_ID = "837481b2-3b16-48ff-8ed0-a6dad2fe99f4";
const ENDPOINT = `https://featurable.com/api/v1/widgets/${WIDGET_ID}`;

export interface Review {
  name: string;
  text: string;
  stars: number | null;
}

export interface ReviewData {
  reviews: Review[];
  /** Google Place ID, if the API exposes one. Used to derive the review link. */
  placeId: string | null;
  /** Average across every review fetched, not a subset. */
  average: string | null;
  /** True when the fetch produced usable reviews. */
  ok: boolean;
}

// Featurable mirrors the Google Business Profile review shape, which spells
// the rating as a word. Accept a plain number too — the exact field naming
// is unverified, since the API is unreachable from the build sandbox.
const STAR_WORDS: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

function toStars(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string") return STAR_WORDS[value.toUpperCase()] ?? null;
  return null;
}

function normalize(r: any): Review {
  return {
    name: r?.reviewer?.displayName ?? r?.author_name ?? r?.name ?? "Google reviewer",
    text: String(r?.comment ?? r?.text ?? r?.review ?? "").trim(),
    stars: toStars(r?.starRating ?? r?.rating ?? r?.stars),
  };
}

// A Google Place ID starts with "ChI" in practice and is ~27 chars. Checking
// the shape stops us building a review URL out of some unrelated identifier
// that happens to sit on a field called "id".
function looksLikePlaceId(v: unknown): v is string {
  return typeof v === "string" && /^Ch[A-Za-z0-9_-]{20,}$/.test(v);
}

function findPlaceId(json: any): string | null {
  const candidates = [
    json?.data?.placeId, json?.data?.place_id,
    json?.placeId, json?.place_id,
    json?.data?.location?.placeId, json?.data?.location?.place_id,
    json?.data?.business?.placeId, json?.data?.business?.place_id,
    json?.data?.widget?.placeId,
  ];
  for (const c of candidates) if (looksLikePlaceId(c)) return c;

  // Last resort: the ID may sit on a field we did not guess. Scan the whole
  // payload for a value in Place ID form rather than give up.
  try {
    const seen = new Set<string>();
    const walk = (node: any, depth: number): string | null => {
      if (depth > 6 || node == null || typeof node !== "object") return null;
      for (const [key, value] of Object.entries(node)) {
        if (looksLikePlaceId(value) && !seen.has(value)) {
          if (/place/i.test(key) || /id$/i.test(key)) return value;
          seen.add(value);
        }
        if (typeof value === "object") {
          const hit = walk(value, depth + 1);
          if (hit) return hit;
        }
      }
      return null;
    };
    return walk(json, 0);
  } catch {
    return null;
  }
}

let cache: ReviewData | null = null;

export async function getReviewData(): Promise<ReviewData> {
  if (cache) return cache;

  let reviews: Review[] = [];
  let placeId: string | null = null;

  try {
    const res = await fetch(ENDPOINT);
    if (res.ok) {
      const json = await res.json();
      const raw = json?.data?.reviews ?? json?.reviews ?? json?.data ?? [];
      if (Array.isArray(raw)) reviews = raw.map(normalize).filter((r) => r.text.length > 0);
      placeId = findPlaceId(json);
    }
  } catch {
    // Network unavailable or shape unexpected — callers fall back.
  }

  const rated = reviews.filter((r) => typeof r.stars === "number") as (Review & { stars: number })[];
  const average = rated.length
    ? (rated.reduce((sum, r) => sum + r.stars, 0) / rated.length).toFixed(1)
    : null;

  cache = { reviews, placeId, average, ok: reviews.length > 0 };
  return cache;
}

/**
 * The URL that opens Google's "write a review" box.
 *
 * Prefers the link pasted into src/consts.ts, since a link copied straight
 * from Google Business Profile is authoritative. Falls back to deriving one
 * from the Place ID that Featurable reports, so the link can work with
 * nothing to fill in by hand. Returns "" when neither is available, and every
 * caller is gated on that, so the site never ships a dead review link.
 */
export async function getReviewUrl(): Promise<string> {
  if (GOOGLE_REVIEW_URL) return GOOGLE_REVIEW_URL;
  const { placeId } = await getReviewData();
  return placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : "";
}
