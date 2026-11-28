# LED-PI — Google Apps Script + Google Sheets

This file is the short entry point for the selected MVP architecture (5–30 Google-account users). Follow the complete setup, OAuth, deployment, security and verification procedure in [GAS_SETUP.md](GAS_SETUP.md).

Runtime files are in `gas/`: `Code.gs`, `Index.html`, `Client.html`, `Styles.html`, and `appsscript.json`.

The current app provides Google ID-token verification, email allowlisting, property listing/search, add/edit, CSV append import and audit events. It is a development MVP; it has not been deployed to the user's Google account or load-tested. Automated LED scraping, deduplication, rental analysis, maps and full RBAC are not included.
