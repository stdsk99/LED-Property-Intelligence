# LED-PI — Google Apps Script + Google Sheets Setup

## Selected MVP architecture
- 5–30 approved Google accounts
- Google Apps Script Web App serves the user interface and backend
- Google Identity Services (GIS) supplies a signed Google ID token
- Backend validates token audience, issuer, expiry and verified email, then checks an email allowlist
- Private Google Spreadsheet is the data store; users do not need direct spreadsheet access
- Apps Script runs as the deploying owner

## A. Create the Google OAuth client
1. Create or select a project in Google Cloud Console.
2. Configure Google Auth Platform / OAuth consent screen and choose the audience appropriate to your organization.
3. Create an OAuth Client ID of type **Web application**.
4. Configure the authorized JavaScript origin(s) required for the deployed Apps Script web app. The Apps Script HTML sandbox/origin can differ by deployment; validate with the actual deployed URL. If GIS reports `origin_mismatch`, resolve the origin configuration or use an organization-approved custom-domain approach. Do not remove server-side ID-token verification.
5. Copy the OAuth Client ID. A client ID is public; never put a client secret in the repository.

## B. Create the Apps Script project
1. Open https://script.google.com/ and create a standalone project named `LED-PI`.
2. Add these files from this repository's `gas/` folder, preserving exact names:
   - `Code.gs`
   - `Index.html`
   - `Client.html`
   - `Styles.html`
3. In Project Settings, enable showing the `appsscript.json` manifest and replace it with the repository version.
4. In Project Settings → Script Properties, add:
   - `GOOGLE_OAUTH_CLIENT_ID`: the OAuth Web Client ID
   - `ALLOWED_EMAILS`: comma-separated list of approved user emails (5–30 accounts)
   - `ADMIN_EMAILS`: comma-separated administrator emails; every admin must also appear in ALLOWED_EMAILS
   - `SPREADSHEET_ID`: leave unset for first initialization
5. In the Apps Script editor, select and run `initializeLedPi()` once. Approve the requested spreadsheet permission. The function creates a private spreadsheet named `LED-PI Database`, adds `Properties` and `AuditLog` tabs, and stores its ID in Script Properties. Keep the returned spreadsheet URL private.

## C. Deploy and verify
1. Select Deploy → New deployment → Web app.
2. Execute as: **Me** (the deploying owner).
3. Who has access: **Anyone with a Google account** (`ANYONE`) where permitted by organizational policy. The application still rejects requests unless a valid GIS ID token is supplied and its email is allowlisted.
4. Deploy and open the `/exec` URL.
5. Sign in with an allowlisted account. Confirm the property list loads and create a test property.
6. Sign in with a Google account not on the allowlist. The backend must reject it.
7. Test editing a property, search, CSV import, refresh and logout before inviting the team.
8. After changing Apps Script code, update the existing deployment to a new version; saving source code alone does not update a versioned deployment.

## D. Current application features
- Google sign-in with server-side token verification and email allowlist
- Property list, search and dashboard counts
- Add and edit property records
- CSV append import (UTF-8; max 500 KB per import)
- Audit events for create, update and import
- 5,000-property MVP ceiling; UI displays up to 2,000 latest rows

CSV requires a `title` column (or Thai `ชื่อทรัพย์`). Supported fields include `asset_code, asset_type, province, district, subdistrict, address, area_rai, area_ngan, area_sq_wah, government_assessed, listing_asking, verified_transaction, auction_date, auction_status, status, source_url, notes`. Thai aliases include `รหัสทรัพย์, ประเภททรัพย์, จังหวัด, อำเภอ, ตำบล, ราคาประเมินราชการ, ราคาประกาศขาย, ราคาซื้อขายจริง, วันขายทอดตลาด, สถานะ`. Import appends; it does not deduplicate.

## E. Security and data integrity
- The spreadsheet must remain private; do not share it with all app users.
- Every server function that reads/writes business data must call `verifyUser_`.
- Never trust browser-supplied email or role. The server obtains email from Google's validated ID token.
- Keep `ALLOWED_EMAILS` current. Removing an email revokes application access after the token cache window.
- Text inputs are escaped for spreadsheet formula injection; numeric fields must be non-negative.
- Keep government assessed value, listing asking price and verified transaction price in separate fields. An asking price is not a completed transaction price.
- Back up the spreadsheet regularly and test restoration.
- Apps Script quotas, execution-time limits and Sheets concurrency constraints apply. This is an MVP datastore for a small team, not a relational database.

## F. Not implemented yet
No automated LED scraper, duplicate detection, rental cash-flow model, advanced resale sensitivity, map/geocoding, alerts, full role-based access controls or production load/security test is claimed. Verify source access rights and licensing before any automated collection.
