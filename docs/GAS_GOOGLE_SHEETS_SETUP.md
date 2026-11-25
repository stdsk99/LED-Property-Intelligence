# LED-PI Apps Script Setup

See docs/GAS_SETUP.md for setup. In short: copy the gas/ files into a standalone Apps Script project, set GOOGLE_OAUTH_CLIENT_ID, ALLOWED_EMAILS and ADMIN_EMAILS in Script Properties, run initializeLedPi(), then deploy as Web App executing as the owner. Keep the generated Google Sheet private. Every backend data call verifies a Google ID token and checks the email allowlist. Test approved and denied accounts before onboarding.

This is a development MVP and has not been deployed or runtime-tested. Apps Script quotas apply; advanced RBAC, deduplication, maps, rental modelling and official LED scraping are not implemented.
