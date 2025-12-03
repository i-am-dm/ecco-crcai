# Showcase Marketplace Concept

This plan reframes showcases as a two-sided marketplace where event hosts list showcases and partners (venues, artists, sponsors) discover, book, and collaborate. It builds on the existing history → snapshot → manifest/index pipeline.

## Objectives
- **Marketplace supply**: make it easy for hosts to publish showcases with availability, capacity, and ticketing rules.
- **Marketplace demand**: enable venues, promoters, and sponsors to browse, filter, and book showcases with clear status and lead times.
- **Trust & quality**: add verification signals, SLA-style readiness checks, and alerting for at-risk showcases.
- **Speed to launch**: reuse existing pipelines and UI starter while keeping deployment lightweight.
- **Mobile-first posture**: ensure APIs and caches are optimized for mobile clients (lean payloads, resumable writes, offline tolerance) so the backend serves native apps as well as web.

## Mobile-First Backend Considerations
- **Transport & payloads**: default to compact JSON with ETags and gzip/br compression; keep snapshot/manifest responses segmentable so mobile clients can lazy-load tabs (Overview, Pricing, Tech) without downloading everything.
- **Pagination & cursors**: expose cursor-based pagination on marketplace indices (`by-date`, `by-venue`, `by-status`) with stable ordering keys so infinite scroll behaves consistently on mobile.
- **Mutation safety**: make booking intents and holds idempotent via client-supplied request IDs; allow resumable writes so lossy mobile connections do not create duplicates.
- **Offline & caching**: publish cache hints (TTL + stale-while-revalidate) in manifests and allow time-bounded prefetch bundles (featured rail + inbox summaries) for offline-ready native apps.
- **Auth & rate limits**: support short-lived mobile tokens with refresh endpoints and rate limits tuned for bursty reconnect patterns; prioritize 99p latency for list/detail reads to keep mobile UI snappy.

## Core Product Workstreams

### 1) Supply: Listing & Lifecycle
- **Entity modeling**: extend the Showcase schema with listing status (`draft`, `live`, `paused`, `closed`), booking window, commercial terms (rev share or flat fee), and fulfillment requirements (staffing, tech rider, insurance).
- **Publishing flow**: add CLI samples and API routes for creating/updating listings, including soft-deletes/pauses and scheduling (go-live/blackout dates).
- **Availability & capacity**: track holds, allocations, and sold/available counts; expose counters in snapshots for rules and UI pills.
- **Trust signals**: add verification badges (KYC/insurance), asset completeness checks (poster, stage plot, press kit), and last-audited timestamps.

### 2) Demand: Discovery & Booking
- **Indices/pointers**: maintain shards for `by-date`, `by-venue`, `by-performer`, `by-featured`, and new `by-status/{live|paused|closed}` plus `by-verification/{verified}`.
- **Filtering & search**: UI filters for location, date range, genre tags, verification, commercial terms, and availability ("<20 tickets left").
- **Booking intents**: lightweight request objects (with desired date/time slot, expected draw, budget, and notes) persisted as history events and fanned out to hosts.
- **Messaging hooks**: optional webhook/email templates to notify hosts when a booking intent arrives or expires without response.

### 3) Contracting & Pricing
- **Offer bundles**: support multiple pricing packages per showcase (standard, VIP, sponsor bundle) with per-package capacity, fees, and perks.
- **Fee transparency**: snapshot fields for platform fees and payout schedules; UI table showing promoter/venue costs vs. audience ticket price.
- **Hold & confirm**: lifecycle where a booking intent can become a hold (with expiration) and then a confirmed booking; rules engine raises alerts before holds expire.

### 4) Operations & Quality Gates
- **Readiness checks**: rules for missing assets, expired insurance, or unassigned crew, emitting alerts in `reports/alerts/showcases/{id}.json`.
- **Throughput protection**: throttles for excessive listing churn or conflicting time slots at the same venue (pointer-based conflict detection).
- **Observability**: dashboard-friendly manifests that aggregate by status, verification, and lead time; include lag metrics between listing and first booking intent.

### 5) UI Surfaces (Tailwind starter)
- **Marketplace home**: cards with verification pills, price bands, availability bars, and CTAs ("Request booking", "Hold slot").
- **Detail view**: tabbed layout for Overview, Pricing, Tech, and Policies; timeline for booking intents → holds → confirmations.
- **Inbox**: per-host view of booking intents with filters (new, expiring holds, awaiting assets) and quick actions.
- **Featured rails**: carousel fed by `by-featured` and `by-verification` indices to spotlight high-quality listings.

### 6) Delivery Plan
- **Phase 1**: Schema/index updates + CLI samples for listings and booking intents; seed fixtures; static UI mocks using canned manifests.
- **Phase 2**: Wire services (snapshot-builder, index-writer) to process new entities/pointers; add rules for availability/verification and hold expirations.
- **Phase 3**: Hook UI to live indices/APIs; add alerting webhooks; polish marketplace flows (holds, pricing packages, verification badges).

## Testing Notes
- Unit tests for new schema fields, pointer generation (`by-status`, `by-verification`, `booking-intent` flows), and rules.
- UI snapshot/regression tests for marketplace cards, filters, and inbox views once wired.
