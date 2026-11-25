# LED Property Intelligence (LED-PI)

ระบบค้นหา วิเคราะห์ และติดตามทรัพย์ขายทอดตลาด พร้อมประเมินโอกาสลงทุนซื้อขายต่อและปล่อยเช่า

## Selected MVP architecture (2026-11-25)
- Users: 5–30 named users
- Authentication: Google Identity Services; Apps Script verifies signed ID tokens server-side and enforces an email allowlist
- Backend and web hosting: Google Apps Script Web App
- Database: private Google Sheets spreadsheet
- Source code: `gas/` (Apps Script project files)
- Setup guide: `docs/GAS_GOOGLE_SHEETS_SETUP.md`

The Apps Script backend currently includes spreadsheet initialization, token verification, allowlist enforcement, property listing, create/update and CSV append import. It is a development scaffold and has not yet been deployed or runtime-tested. Complete the HTML client and deployment configuration before onboarding users.

## Important security model
The web app executes as the deploying owner. The spreadsheet must remain private. Do not trust client-supplied email or role; every data endpoint must verify the Google ID token and allowlist. Store OAuth Client ID and allowlist in Apps Script Script Properties, not secrets in GitHub.

## Data rules
Keep government assessed values, listing asking prices and verified transaction prices in separate fields. Never represent an asking price as a completed transaction. No official LED property-level scraper is enabled; verify source access and licensing before ingestion. CSV/XLSX import is the fallback.

## Retained legacy artifacts
The prior GitHub Pages + Supabase prototype and Laravel/MySQL starter are retained for reference only. They are not the selected MVP runtime. GitHub Pages cannot execute Apps Script server functions or PHP.

## Current limitations
- Google Apps Script quotas and execution limits apply.
- Sheets is suitable for a small-team MVP, not a relational database or high-concurrency workload.
- No production deployment, load test, full RBAC, rental cash-flow model, advanced resale calculator, maps, automated alerts, or active auction scraper is claimed.
