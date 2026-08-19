// Static JSON the chat widget fetches the first time someone opens it.
//
// Served as a separate file rather than inlined into every page on purpose.
// The FAQ is roughly 15 KB of text; inlining it would add that to all 29
// pages for a widget most visitors never open. This way each page carries
// only the widget itself, and the answers arrive on demand.

import type { APIRoute } from "astro";
import { faqs, routes, faqKeys } from "../lib/faq.ts";

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      faq: faqs.map((f) => ({ q: f.q, a: f.a, keys: faqKeys[f.q] ?? "" })),
      routes: routes.map((r) => ({ q: r.q, a: r.a, keys: r.keys, href: r.href, cta: r.cta })),
    }),
    { headers: { "Content-Type": "application/json; charset=utf-8" } }
  );
