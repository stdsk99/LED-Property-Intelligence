# LED Open Data Connector — Implementation Notes

## Scope

This connector handles aggregate Open Data statistics only. It does not create property-level auction records and must not populate the properties table.

Initial dataset:
- Package: led_it_0002
- Resource: a7414d95-b70a-43a7-9af6-a9f4cdc793e4
- Dataset page: https://opendata.led.go.th/dataset/led_it_0002
- Resource page: https://opendata.led.go.th/dataset/led_it_0002/resource/a7414d95-b70a-43a7-9af6-a9f4cdc793e4
- Published CSV URL: https://opendata.led.go.th/dataset/led_it_0002/resource/a7414d95-b70a-43a7-9af6-a9f4cdc793e4/download/auction-01-07-2569.csv
- Resource UUID: a7414d95-b70a-43a7-9af6-a9f4cdc793e4

The visible data dictionary describes fiscal year, month, asset type, number of properties (Value) and appraisal amount (Price). The CSV header labels must be confirmed against the downloaded file before relying on normalized columns.

## Important licensing gate

The dataset metadata currently displays a CC BY-NC license. Do not use the data in commercial services, paid investment products, or commercial analytics without written permission or a license that explicitly permits the intended use. Preserve attribution and source metadata even for internal evaluation.

## Files added

- app/Services/LedOpenDataClient.php — CKAN package/resource/DataStore API client.
- app/Console/Commands/TestLedOpenDataApi.php — API smoke test.
- app/Services/LedOpenDataCsvImporter.php — CSV parser with raw-row preservation and idempotent upsert.
- app/Console/Commands/ImportLedOpenDataCsv.php — CSV import command.
- database/migrations/2026_11_24_000001_create_led_open_data_rows_table.php — separate aggregate/raw data table.

## Setup

Copy the starter files into the matching paths in a real Laravel application. Confirm command auto-discovery for the Laravel version in use.

Run the migration:

```bash
php artisan migrate
```

Test CKAN endpoints:

```bash
php artisan led:open-data-test
```

This checks:
1. package_show
2. resource_show
3. datastore_search

A failed datastore_search does not prove the catalog API is unavailable; DataStore may not be enabled for this particular resource. Use the published CSV fallback when permitted.

## CSV fallback

Download the CSV from the official resource page and place it in a controlled local import directory. Then run:

```bash
php artisan led:open-data-import-csv storage/app/imports/auction-01-07-2569.csv
```

The importer:
- strips UTF-8 BOM from headers;
- recognizes a conservative set of Thai/English header aliases;
- stores each original row as JSON in raw_payload;
- derives normalized fiscal year, month, asset type, property count and appraisal value only when recognized;
- computes a row hash and upserts by dataset + row hash to avoid duplicate imports;
- records dataset/resource identifiers, source URL, license label and retrieval timestamp.

If normalized fields are null, inspect the actual CSV header and extend aliases only after validating the source dictionary. Do not silently reinterpret a field.

## Data model and analytical guardrails

led_open_data_rows is deliberately separate from the property registry. property_count and appraisal_value are aggregate measures, not parcel-level values. Never join them to an individual property or present them as that property's appraisal or sale price.

Recommended downstream use:
- monthly auction volume by asset type;
- aggregate appraisal-value trend by asset type;
- descriptive statistics and data freshness monitoring.

Not supported by this dataset:
- individual property search;
- geocoding or parcel mapping;
- individual appraisal;
- auction result price or realized transaction price;
- property-level investment ROI.

## Validation checklist before production

- [ ] Run the API smoke test in the target Laravel environment and record HTTP outcomes.
- [ ] Download the CSV and confirm exact header names, delimiter, encoding, row count and numeric conventions.
- [ ] Compare 5–10 CSV rows with the published data dictionary and dataset page.
- [ ] Verify fiscal-year calendar convention and whether month is Gregorian or Thai fiscal month.
- [ ] Confirm whether Price means currency in baht, thousand baht, or another unit.
- [ ] Confirm current license and commercial reuse rights in writing.
- [ ] Add automated tests using a sanitized sample CSV before scheduling recurring imports.
- [ ] Monitor source updates and store each retrieval/import event for auditability.
