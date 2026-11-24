# LED-PI Development Backlog

Priority: P0 = release blocker; P1 = MVP; P2 = post-MVP. Estimates are engineering person-days and require refinement after source validation.

## Epic E0 — Project foundation
- [P0 | 1d] Create Laravel application, environment configuration, coding standards.
- [P0 | 1d] Configure MySQL, migrations, factories, seeders, CI smoke test.
- [P0 | 2d] Authentication, email verification, password reset, session security.
- [P0 | 2d] Organization membership, role middleware, Policies, tenant-isolation tests.

## Epic E1 — Source validation and ingestion
- [P0 | 3d] Inventory official LED search pages, downloadable files, terms, and permitted access paths.
- [P0 | 2d] Define canonical source-field mapping and sample fixtures.
- [P1 | 3d] CSV/XLSX upload, preview, column mapping, validation report.
- [P1 | 3d] Import batch processing, idempotency, deduplication, error quarantine.
- [P1 | 3d] Source record snapshots, sync logs, freshness indicators.
- [P2 | 5d] Approved API/public-web connector after permission and stability review.

## Epic E2 — Property and auction registry
- [P1 | 3d] Property CRUD and canonical record model.
- [P1 | 2d] Source record linking and manual match-review queue.
- [P1 | 3d] Case references and auction event history.
- [P1 | 2d] Auction results and status-change history.
- [P1 | 2d] Property detail page with provenance and media.

## Epic E3 — Search, map, dashboard
- [P1 | 3d] Nationwide filters, pagination, sorting, keyword search.
- [P1 | 2d] Dashboard KPI and chart endpoints.
- [P1 | 3d] Leaflet map with clustering and approximate-location disclosure.
- [P2 | 2d] Saved searches and advanced search presets.

## Epic E4 — Valuation intelligence
- [P0 | 2d] Define valuation data governance and source labels.
- [P1 | 3d] Government/listing/transaction valuation observations.
- [P1 | 4d] Comparable selection and distance/recency/size matching.
- [P1 | 3d] Low/base/high estimate and confidence grade.
- [P1 | 2d] Insufficient-data state and explainability panel.
- [P2 | 4d] External market-data connectors subject to licensing.

## Epic E5 — Investment analysis
- [P1 | 3d] Resale scenario calculator and cost line items.
- [P1 | 3d] Rental scenario calculator, vacancy, NOI, yield, cash-on-cash.
- [P1 | 2d] Break-even bid and sensitivity scenarios.
- [P1 | 2d] Versioned formulas and reproducible analysis snapshots.
- [P1 | 2d] Configurable opportunity score and factor explanation.

## Epic E6 — Collaboration and alerts
- [P1 | 2d] Private/organization watchlists.
- [P1 | 2d] In-app alerts and deduplication.
- [P2 | 2d] Email notifications and digest preferences.
- [P2 | 3d] Shared analysis comments/review workflow.
- [P2 | 3d] LINE messaging integration after credentials and consent.

## Epic E7 — Admin, reports, operations
- [P1 | 2d] Admin source/import management.
- [P1 | 2d] User/member management and audit trail.
- [P1 | 2d] CSV/XLSX exports with provenance.
- [P2 | 2d] PDF report templates.
- [P0 | 2d] Backup/restore test, queue failure monitoring, health checks.
- [P0 | 2d] Security review, tenant-isolation tests, production checklist.

## Suggested delivery sequence
1. Sprint 0: E0 + E1 source validation (do not build an unapproved scraper).
2. Sprint 1: CSV import + E2 property/auction registry.
3. Sprint 2: E3 search/dashboard/map.
4. Sprint 3: E4 valuation and comparables.
5. Sprint 4: E5 resale/rental analytics.
6. Sprint 5: E6 collaboration + E7 hardening and release.

## Definition of Done
- Feature has validation, authorization, tenant-scoping, tests, audit where relevant, and Thai UI copy.
- Import jobs are idempotent and failures are inspectable.
- Every external fact carries source and observed date.
- Financial outputs show assumptions and formula version.
- No fabricated source records or inferred legal status.
