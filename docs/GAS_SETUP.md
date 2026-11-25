# LED-PI Apps Script Setup

Copy the files in gas/ to a standalone Apps Script project. Set Script Properties GOOGLE_OAUTH_CLIENT_ID, ALLOWED_EMAILS and ADMIN_EMAILS. Run initializeLedPi() once to create the private Sheets database. Deploy as Web App, Execute as Me. Configure the OAuth authorized origin for the deployed app and test both approved and denied Google accounts.

The server verifies Google ID tokens and checks an email allowlist. Keep the spreadsheet private. Never trust browser-supplied email and never commit client secrets. Apps Script quotas apply. Current MVP provides property listing, create/update and CSV append import; it is not production-tested and does not include deduplication, rental analysis, maps or an official LED scraper.
