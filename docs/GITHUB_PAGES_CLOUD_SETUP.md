# LED-PI: GitHub Pages + Supabase Cloud Setup

## Architecture
- GitHub Pages hosts the static frontend (HTML/CSS/JavaScript).
- Supabase Auth handles email/password sign-in.
- Supabase PostgreSQL stores workspace, membership, invitation and property records.
- PostgreSQL Row Level Security (RLS) enforces workspace boundaries.
- The browser uses only the Supabase project URL and anon/publishable key. Never put a service_role key or database password in this repository.

## 1. Create Supabase project
1. Create a project at https://supabase.com/.
2. Open SQL Editor and run the complete `supabase/schema.sql` script once.
3. In Project Settings → API, copy the Project URL and anon/publishable key.
4. In Authentication → URL Configuration, set Site URL to the published GitHub Pages URL, for example `https://stdsk99.github.io/LED-Property-Intelligence/`.
5. Add that same URL to Redirect URLs. Configure email confirmation and SMTP as appropriate for the intended users.

## 2. Configure frontend
Edit root `config.js`:
- Replace `SUPABASE_URL` with the project URL.
- Replace `SUPABASE_ANON_KEY` with the anon/publishable key.
- Never use the `service_role` key. The anon key is public by design; security depends on RLS policies.

## 3. Enable GitHub Pages
1. Open repository Settings → Pages.
2. Set Build and deployment source to GitHub Actions.
3. Push to `main` or run the workflow manually under Actions.
4. Open the deployment URL shown in the Pages workflow.

## 4. First run and team setup
1. Open the Pages URL and register a user.
2. Confirm the email if email confirmation is enabled.
3. Sign in. The first sign-in creates a personal workspace automatically.
4. Open Team and add colleague email addresses. Existing accounts are added immediately; invitations for new accounts are claimed by the database trigger after sign-up.
5. A user may belong to multiple workspaces; this MVP currently selects the first membership returned.

## 5. CSV import format
UTF-8 CSV with a header row. Required: `title` or `ชื่อทรัพย์`.
Optional supported columns:
`asset_code,asset_type,province,district,government_assessed,listing_asking,auction_date,status`.
Thai aliases include `จังหวัด,อำเภอ,เขต,ราคาประเมินราชการ,ราคาประกาศขาย,วันขายทอดตลาด,สถานะ`.
Statuses: `watchlist,reviewing,passed,won`.
CSV import inserts new rows; it does not deduplicate or update existing properties.

## Current MVP boundaries
- Property records, workspace access, CSV import/export and a resale calculator are implemented in the browser.
- No official LED property-level data connector is active. Do not represent aggregate Open Data statistics as individual properties.
- No live market valuation, map geocoding, rental cash-flow engine, audit history or automated auction scraper is included yet.
- Invitation is email-address based and does not send email itself. For production, use Supabase Auth invitations/Edge Function and add invitation expiry/revocation.
- Review and test the SQL policies in a non-production project before onboarding sensitive business data. The current MVP has no file storage or sensitive personal data fields.

## Troubleshooting
- "Invalid API key": check the anon/publishable key in config.js.
- "Failed to fetch": check project URL, project status, and browser network access.
- "relation does not exist": run supabase/schema.sql.
- "new row violates row-level security": verify the user is a member of the active organization and that the correct SQL script was run.
- Pages still shows old content: inspect the latest Actions run and wait for deployment to finish.
