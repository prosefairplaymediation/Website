# FEATURES.md — Pro Se Fair Play Mediation site

Tracking what's shipped, what's planned, what's deferred, and what's been ruled out. Update as scope evolves.

---

## Shipped

- **Static Astro 6 site** on Cloudflare Workers, custom domain live at https://prosefairplaymediation.com (and www).
- **Coming-soon gate** at `/` (per client request) — `noindex`, minimal logo + tagline.
- **Real homepage** at `/home` — editorial-legal design, Lora display + Newsreader body, navy/gold/cream palette derived from logo.
- **Services overview** at `/services` — three services with flat-fee pricing, payment terms, legal disclaimer.
- **About page** at `/about` — first-person bio, professional photo, "What is Mediation?" explainer, ethics strip.
- **Blog** at `/blog` + content collections + first article at `/blog/a-practical-guide-to-mediation`.
- **Font preview** at `/fonts` — left in place for future use; Lora was selected.
- **Site shell** — sticky nav with hamburger mobile menu, three-column footer with legal disclaimer + build version `v{x.y.z}`.
- **Favicon** — navy chip with gold scales mark.
- **Custom domain + DNS** managed in Cloudflare; nameservers swapped from GoDaddy.
- **Email** via Google Workspace (`info@`), DKIM + SPF + DMARC fully configured.
- **Calendly** Standard tier connected to Stripe + Google Calendar + Google Meet. Free 15-min consultation event published.
- **Stripe** account created, EIN under verification, Stripe products to be added once verified.
- **`/book` page** with Calendly inline embed for the free consultation.
- **Husky pre-commit hook** auto-bumps patch version on every commit.
- **CLAUDE.md** with project context + dev guidelines.

---

## Decided / Next

In rough priority order.

- **Service detail pages** — `/services/hourly-mediation`, `/services/parenting-plan`, `/services/court-packet`. Informational only; CTA on each is "Book a Free Consultation," not "Book This." Funnel stays consult-first per client direction.
- **Homepage interactive service cards** — hover-on-desktop / tap-on-mobile reveal pattern (reference: citrineintimacy.com). Each card links to a service detail page. Decorative-but-functional.
- **Stripe products** configured to match paid Calendly events: 2-Hour Mediation ($1,200), Half-Day ($2,400), Full-Day ($4,800), plus document services as standalone products.
- **End-to-end booking + payment test** — $1 test charge through Calendly → Stripe → refund, then delete the test event.
- **Go-live moment** — flip `/` from coming-soon to the real homepage once client signs off.

---

## Stretch goals

Agreed in principle but explicitly deferred. Not in current scope.

- **Intake form on the site** that gates the consultation (per client's later email request — full name, phone, email, conflict check, brief description, acknowledgment). Implementation path: form on site → Cloudflare Worker → email to client via Resend/Postmark free tier. Estimated ~half-day of work including the Worker, email API setup, and the form itself.
- **Stripe webhook** to mark Calendly bookings as "paid" automatically — currently decoupled, reconciliation is manual.
- **Per-event public booking pages** for paid services (`/book/hourly-mediation`, etc.). Ruled out by client; left here as a design alternative if priorities shift.
- **CRM / dashboard for client** — client edits services, pricing, blog posts. Not in scope; client uses static markdown + handoffs.
- **Automated invoicing** — flagged in original RFP, ruled out as not part of agreed scope.
- **Email automation** beyond Calendly's built-in confirmations — not in scope.

---

## Out of scope (decided NO)

- **Public paid booking pages** that bypass the consult funnel. Client wants manual gate: she emails private Calendly+Stripe links only after consult + agreement + payment.
- **Direct mediation booking on the site** — client must speak to her first.
- **Accepting Zelle, Apple Pay, etc. natively** beyond what Stripe provides out of the box.
- **Payment plans / split payments** between mediation parties — handled manually if at all.

---

## Open questions / pending client decisions

- **Free consultation cost** — currently $0. Could be paid via Calendly+Stripe ($25 nominal) to filter unserious inquiries. Awaiting client preference.
- **Conflict check format** for the intake form (when/if built) — single free-text field, or structured (other party name, attorney name)?
- **Final go-live timing** — when does `/` flip from coming-soon to real homepage?
