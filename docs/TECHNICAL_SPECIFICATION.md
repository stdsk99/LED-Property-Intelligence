# LED Property Intelligence (LED-PI)
## Technical Specification — Baseline v1.0

**Product:** National property-auction discovery and investment intelligence platform  
**Primary language:** Thai  
**Backend:** Laravel / PHP 8.3+  
**Database:** MySQL 8.0+  
**Frontend:** Blade + Bootstrap 5 + JavaScript  
**Map:** Leaflet + OpenStreetMap  
**Deployment:** Linux VPS, Nginx, PHP-FPM, HTTPS

## 1. Product objective
Provide a multi-user platform to discover properties offered through public auction, consolidate auction and market-reference information, compare asking/assessed/market values, and estimate resale and rental investment outcomes. The platform is a decision-support tool; it does not guarantee title, possession, market value, auction outcome, or investment return.

## 2. Scope
### In scope
- Nationwide property records for all categories exposed by approved sources.
- Import from official API where available, approved public web interfaces where permitted, and CSV/XLSX uploads.
- Preserve source provenance, raw payload snapshots, sync history, and record changes.
- Auction schedules, auction rounds, and results.
- Government valuation records and market comparables from permitted sources.
- Search, filters, property detail, map, watchlists, alerts, and exports.
- Resale and rental scenario calculations.
- Multi-user accounts, role-based access, organization/workspace separation, audit logs.
- Admin management of data sources, imports, users, roles, and scoring parameters.

### Out of scope for MVP
- Automated legal opinion or title verification.
- Automated bidding or payment to the enforcement department.
- Claiming advertised asking prices are completed transaction prices.
- Automated access-control circumvention, CAPTCHA bypass, login scraping, or prohibited bulk harvesting.
- Guaranteed geocoding or complete national coverage.

## 3. User roles and tenancy
Use organization/workspace tenancy from the first release. Each user belongs to one or more organizations through `organization_user`.

| Role | Permissions |
|---|---|
| Platform Super Admin | Global configuration, source connectors, all organizations, audit |
| Organization Owner | Organization settings, members, billing-ready settings, all organization data |
| Organization Admin | Manage members, watchlists, analyses, exports |
| Analyst | Search, compare, create/update investment analyses |
| Investor/Member | Search, view, save watchlists, run own analyses |
| Read-only | View permitted records and shared analyses |

Authorization must be enforced server-side using Laravel Policies/Gates. Do not rely on hiding UI controls.

## 4. Functional requirements
### FR-01 Source management
- Register each source with name, source type, permitted access method, terms/permission notes, refresh cadence, active flag, and contact/reference URL.
- Each imported record must retain source ID, source record key, source URL, observed time, import batch, and raw snapshot.
- Support API, CSV/XLSX, and permitted public-web connector types.
- Connectors must use rate limits, retries with backoff, timeouts, and circuit-breaker behavior.
- Stop collection and alert administrators when a source changes structure or returns access-denied/anti-bot responses.

### FR-02 Property registry
- Store canonical property identity separately from source records and auction events.
- Support many source records and many cases/events per property.
- Store property type, description, land/building dimensions, address hierarchy, coordinates, images/documents, and verification status.
- Unknown values remain NULL; never infer missing values as zero.

### FR-03 Auction lifecycle
- Store each auction session/round as a distinct event.
- Track scheduled date/time, venue/channel, sequence/round, opening price, deposit, conditions, status, postponement/cancellation, and result.
- Preserve history; do not overwrite previous event values when a new notice is published.
- Status values: scheduled, postponed, cancelled, in_progress, sold, unsold, withdrawn, unknown.

### FR-04 Search and discovery
- Search by province/district/subdistrict, property type, text, area, price range, auction date, event status, source, and data freshness.
- Support sorting and pagination.
- Search results must identify missing valuation/comparable data and source freshness.

### FR-05 Market valuation
- Maintain separate valuation observations by source and valuation basis: government_assessed, listing_asking, verified_transaction, broker_opinion, internal_estimate.
- Every observation records source, observed date, unit, amount, method, confidence, and notes.
- Comparable selection considers property type, geographic distance, land/building size, recency, and condition where available.
- Display asking prices separately from verified transaction prices. Do not label listing prices as market transaction values.
- Estimate a range (low/base/high), sample count, distance, age, and confidence rather than a single unsupported point value.

### FR-06 Investment analysis
- Support two independent scenarios: resale and rental.
- Resale: acquisition bid, deposit/financing assumptions, transfer/tax/legal costs, renovation, holding costs, selling costs, contingency, expected resale range, net profit, ROI, annualized return, break-even bid, sensitivity.
- Rental: acquisition and setup costs, monthly rent, vacancy, management, maintenance, insurance, taxes/fees, financing, net operating income, gross/net yield, cash-on-cash return, payback period.
- Store calculation inputs and formula version so historical analyses are reproducible.
- Allow user-specific assumptions; never silently apply one user's costs to another.

### FR-07 Opportunity score and risk
- Score is a screening aid, not a valuation or recommendation.
- Initial configurable weights: discount 30%, valuation confidence 20%, location 15%, projected return 20%, legal/possession risk evidence 15%.
- Missing evidence must reduce confidence or produce `insufficient_data`; it must not be treated as zero risk.
- Show factor-level scores, evidence, missing fields, and scoring version.

### FR-08 Watchlists and alerts
- Users can create private or organization-shared watchlists.
- Alert on new property, auction date/price/status change, new valuation/comparable, and threshold crossing.
- Support in-app and email notifications in MVP; LINE integration is a later optional phase.
- Deduplicate alerts and retain delivery logs.

### FR-09 Dashboard and reporting
- KPI cards for imported properties, upcoming auctions, new/changed records, valuation coverage, and candidate opportunities.
- Charts by province, property type, auction month, discount band, and data quality.
- Export CSV/XLSX/PDF with source and as-of date labels.

### FR-10 Administration and audit
- Manage organizations, users, roles, source connectors, imports, scoring parameters, and reference data.
- Record security-relevant events and changes to financial assumptions.

## 5. Non-functional requirements
- Security: HTTPS, password hashing using Laravel defaults, CSRF protection, validation, parameterized ORM queries, rate limiting, secure session cookies, least privilege.
- Privacy: collect only necessary user data; define retention, access, export, and deletion policies; assess PDPA obligations before production.
- Data integrity: foreign keys, unique source keys, transactions for imports, immutable source snapshots.
- Performance targets for MVP: common search under 2 seconds at 100k property records on agreed reference VPS; pagination required; indexes on filters.
- Availability target: 99.5% monthly after production hardening (aspirational SLA, not a guarantee).
- Backup: daily full backup plus binary log/PITR where available; test restore quarterly.
- Observability: structured logs, sync metrics, failed job queue, health endpoint, alerting.
- Accessibility/usability: responsive design, Thai-first labels, keyboard-friendly forms.

## 6. Data model principles
- `properties` is the canonical asset record.
- `source_records` maps source-specific identifiers to canonical properties.
- `property_cases` stores legal case references; a property may relate to multiple cases.
- `auction_events` stores each auction round; `auction_results` stores outcome.
- `valuation_observations` stores every valuation observation with provenance.
- `market_comparables` stores source properties used for comparison; link to source records where possible.
- `investment_analyses` stores scenario inputs and output snapshot; `investment_analysis_items` stores itemized costs.
- Tenant-owned data is organization-scoped. Public source facts may be globally shared; watchlists and analyses are tenant-owned.

## 7. Data acquisition and governance
1. Start with a source-validation spike before production scraping.
2. Confirm source terms, robots/access rules, public availability, permitted frequency, and whether written permission/API credentials are required.
3. Prefer official APIs and downloadable datasets. CSV/XLSX import is mandatory fallback.
4. Store raw source payload and normalized values separately.
5. Use idempotent imports and deduplication based on source + source key; matching across sources requires a reviewed matching rule.
6. Record `observed_at`, `fetched_at`, `published_at` when known, and `last_verified_at` separately.
7. Do not bypass authentication, CAPTCHA, rate limits, or technical restrictions.
8. Show freshness and coverage limitations in the UI.

## 8. Valuation methodology
- Government assessed value is a reference, not automatically current market value.
- Asking/listing price is not a completed transaction price.
- Prefer verified comparable transactions when lawfully available; otherwise label estimates as listing-based indications.
- Comparable filters: same asset type, distance threshold, recency window, land/building size band, and condition/tenure where known.
- Report low/base/high estimate and confidence grade (A–D) with sample count and reasons.
- Do not calculate a confident estimate when comparable count or quality is below configured minimum; return `insufficient_data`.

## 9. Investment calculation rules
### Resale
Total cost = winning bid + transfer/tax/legal expenses + renovation + financing/interest + holding + selling costs + contingency.  
Net profit = expected resale proceeds − total cost.  
ROI = net profit / total cost × 100.  
Break-even maximum bid is solved from expected net proceeds less all non-bid costs and required margin.

### Rental
Gross yield = annual gross rent / total acquisition and setup cost × 100.  
NOI = effective rental income − operating expenses (excluding debt service and income tax, with exact presentation documented).  
Net yield = NOI / total acquisition and setup cost × 100.  
Cash-on-cash return = annual pre-tax cash flow after debt service / cash invested × 100.

All figures must identify whether they are pre-tax/post-tax, financed/cash, and nominal/annualized.

## 10. API outline
Prefix `/api/v1`; authenticated endpoints use Sanctum or the selected Laravel auth stack.
- `GET /properties` — search/filter/paginate
- `GET /properties/{property}` — detail and source provenance
- `GET /properties/{property}/auction-events`
- `GET /properties/{property}/valuations`
- `POST /properties/{property}/investment-analyses`
- `GET /investment-analyses/{analysis}`
- `POST /watchlists`; `POST /watchlists/{watchlist}/items`
- `GET /dashboard/summary`
- `GET /admin/data-sources`; `POST /admin/import-batches`

Validate all query parameters and enforce tenant policies on every tenant-owned resource.

## 11. MVP release gates
- Source validation completed and approved access path documented.
- Import of sample data is repeatable and idempotent.
- Canonical property and auction event history is correct.
- Market data labels distinguish assessed, asking, and verified transaction values.
- Investment outputs reproduce from saved inputs and formula version.
- Tenant isolation tests pass for all organization-owned resources.
- Backup restore, audit, and security smoke tests pass.

## 12. Key risks and mitigations
| Risk | Mitigation |
|---|---|
| No stable public API | CSV/manual import fallback; approved connector only |
| Source layout changes | Connector health checks, schema-change alerts, pause sync |
| Duplicate/mismatched properties | Source keys first; conservative cross-source matching |
| Weak market comparables | Confidence grades and insufficient-data state |
| Legal/possession uncertainty | Explicit risk checklist and human verification |
| Multi-tenant data leakage | Organization scoping, policies, automated isolation tests |
| Stale auction schedules | Show last verified time and alert on changes |

## 13. Decisions still requiring validation
- Actual LED source endpoints, terms, field coverage, and access permission.
- Availability and licensing of government valuation and comparable-market datasets.
- Whether geocoding is permitted and which provider/terms apply.
- Hosting size, expected concurrent users, and retention requirements.
- Email provider and any later LINE integration.
