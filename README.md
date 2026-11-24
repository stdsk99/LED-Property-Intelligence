# LED Property Intelligence (LED-PI)

ระบบค้นหา วิเคราะห์ และติดตามทรัพย์ขายทอดตลาดทั่วประเทศไทย พร้อมประเมินโอกาสลงทุนทั้งการซื้อขายต่อและการปล่อยเช่า

## Project status
**Baseline v1.0 — specification and starter artifacts.** This repository is not yet a complete, deployable Laravel application. The Laravel application must be created with Composer and the starter files integrated and tested.

## Technology
- PHP 8.3+
- Laravel
- MySQL 8+
- Blade, Bootstrap 5, JavaScript
- Leaflet / OpenStreetMap

## Product scope
- Nationwide property and auction discovery from approved sources
- Official assessed values and market listing/comparable references, kept as distinct valuation bases
- Resale and rental investment scenarios
- Multi-user organizations, role-based access, watchlists and alerts
- Source provenance, snapshots, import logs and audit trail

## Repository contents
- `docs/TECHNICAL_SPECIFICATION.md` — system requirements and architecture
- `docs/DEVELOPMENT_BACKLOG.md` — prioritized delivery backlog
- `docs/SOURCE_ASSESSMENT.md` — preliminary official-source assessment and Phase 1 validation gates
- `database/schema.sql` — logical MySQL starter schema
- `laravel-starter/` — initial Laravel integration examples

## Create the Laravel application
Requirements: PHP 8.3+, Composer, MySQL 8+, Node.js LTS.

```bash
composer create-project laravel/laravel led-property-intelligence
cd led-property-intelligence
php artisan install:api
```

Copy the contents of `laravel-starter/` into the matching paths in the new Laravel application. Review namespaces and Laravel-version differences, then configure `.env` using `.env.example` as a reference.

Do not load `database/schema.sql` and run Laravel migrations against the same database simultaneously. The recommended production approach is to convert the approved schema into Laravel migrations.

## Data-source and legal gate
No active scraper is included. Before enabling any connector for the Department of Legal Execution or market-data providers, verify terms, access permissions, permitted frequency, licensing, and personal-data obligations. CSV/XLSX import is the first supported ingestion path. Do not bypass authentication, CAPTCHA, rate limits, or technical restrictions.

The preliminary source assessment found official LED links for auction-property search and auction-sale results, plus an official open-data page listing an auction dataset. The live application schemas, API details, dataset license and automated reuse permissions are **not yet verified**. See [Source Assessment](docs/SOURCE_ASSESSMENT.md).

## Important valuation distinction
Government assessed values, advertised listing prices, and verified transaction prices are separate data categories. Listing prices must never be presented as completed transaction prices. Investment outputs are decision-support estimates, not guarantees or legal opinions.

## Initial API outline
- `GET /api/v1/health`
- `GET /api/v1/properties`
- `GET /api/v1/dashboard/summary`

Protected endpoints remain implementation scaffolds until authentication, validation, tenant policies, and tests are completed.
