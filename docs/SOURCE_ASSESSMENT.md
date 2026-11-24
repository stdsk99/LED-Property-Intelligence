# Source Assessment — LED Property Intelligence
**Assessment version:** 0.5  
**Assessment date:** 2026-11-24  
**Status:** Preliminary desk assessment; live record-level extraction and permission checks remain pending.

## 1. Executive finding

The Department of Legal Execution (LED) exposes distinct public-facing services for (1) searching properties announced for auction, (2) viewing auction-sale results, and (3) open data. The public e-Service directory confirms the first two services. The open-data catalog contains auction-related datasets, but the currently surfaced datasets are aggregate statistics (counts by asset type), not a property-by-property auction inventory.

A direct inspection of the current catalog shows 43 published datasets and an accessible CKAN API v3 root (the API link returns version 3). However, the two datasets in the “ข้อมูลประกาศขายทอดตลาด” group are aggregate statistics only: “ประกาศขายทอดตลาดนัดแรก” and “จำนวนประกาศขายทอดตลาด” count properties by asset type. They are not property-level listings and cannot populate the property registry. Their metadata identifies them as public/open data with no access restriction, but the license is **Creative Commons Attribution Non-Commercial (CC BY-NC)**. This does not authorize commercial reuse by default. The first-auction dataset reports monthly update frequency and last data update 1 July 2569 (2026); its page was updated 3 August 2569.

A separate dataset, “มูลค่าการผลักดันทรัพย์สินออกจากกระบวนการบังคับคดีด้วยการขายทอดตลาด”, contains official officer-assessed values at seizure for land, buildings and condominiums. It is also aggregate/statistical rather than per-property valuation, is updated monthly, and its metadata reports last data update 7 August 2569 (2026). It is potentially useful for macro-level trend analysis, but **must not be treated as an individual property's appraisal or current market price**. It also carries a CC BY-NC license.

The catalog advertises access through an API guide. The dataset page identifies package name `led_it_0002`; its CSV resource page identifies resource UUID `a7414d95-b70a-43a7-9af6-a9f4cdc793e4`. The published CSV URL is https://opendata.led.go.th/dataset/led_it_0002/resource/a7414d95-b70a-43a7-9af6-a9f4cdc793e4/download/auction-01-07-2569.csv. The browser inspection could read the resource metadata and data dictionary but could not retrieve the CSV body (cache miss). Direct API action URLs (package_show, resource_show and datastore_search) were not readable through the web inspection layer. This is an inspection limitation, not proof that the server API is down. A Laravel smoke-test command, a provenance-preserving CSV importer, and a dedicated aggregate-data table migration have been added to the starter code. These are implementation artifacts only; they have not yet been executed in a configured Laravel environment.

**Implementation decision:** Do not build a production scraper or commercial connector yet. Treat aggregate Open Data as optional statistical context only. First obtain current written clarification and inspect the e-Service and dataset terms. In parallel, implement a CSV/XLSX import path with provenance and validation.

## 2. Source inventory

| Source | Official URL | Purpose / evidence | Current assessment |
|---|---|---|---|
| LED official website / e-Service directory | https://www.led.go.th/th/ | Official directory links to auction-property search, auction result reporting, and open data | Verified directory entry |
| Auction property search | https://asset.led.go.th/newbidreg | Official e-Service link labelled “ค้นหาทรัพย์ประกาศขายทอดตลาด” | URL verified from LED directory; automated page inspection timed out; fields and access rules unverified |
| Auction sale results | https://asset.led.go.th/report | Official e-Service link labelled “รายงานผลการขายทอดตลาด” | URL verified from LED directory; automated page inspection timed out; result fields and access rules unverified |
| LED Open Data catalog | https://opendata.led.go.th/dataset/ | 43 published datasets; CKAN API v3 root responds | Catalog/API root verified; dataset-specific API action and CSV ingestion still need end-to-end test |
| Auction announcement statistics | https://opendata.led.go.th/dataset/led_it_0002 | Fiscal year, month, asset type, count (Value), appraisal amount (Price); CSV; monthly update; last data update 1 July 2569; CC BY-NC; no access restriction | Useful for aggregate trend dashboard only; Value and Price are grouped statistics, not individual auction records or parcel appraisals |
| Published CSV resource | https://opendata.led.go.th/dataset/led_it_0002/resource/a7414d95-b70a-43a7-9af6-a9f4cdc793e4 | Resource UUID a7414d95-b70a-43a7-9af6-a9f4cdc793e4; file auction-01-07-2569.csv | Metadata and dictionary readable; file body not retrieved by web inspection (cache miss); validate through Laravel smoke test or authorized manual download |
| Auction announcement statistics (all) | https://opendata.led.go.th/dataset/ | “จำนวนประกาศขายทอดตลาด” counts auctioned properties by asset type | Aggregate statistics only; not property-level records |
| Auction-driven asset value statistics | https://opendata.led.go.th/dataset/led_ppd_0006 | Officer-assessed values at seizure for land, buildings and condominiums; CSV; monthly; last data update 7 August 2569; CC BY-NC | Useful for macro trends only; not individual property valuation and not market transaction prices |
| LED open-data landing page | https://www.led.go.th/std/ | Official page lists “ข้อมูลการขายทอดตลาด” and other open-data categories | Verified landing page |
| Auction live broadcast | https://live.led.go.th/ | Official live auction service; lists offices and live status | Supplementary operational context only; not a substitute for structured auction records |

## 3. What is established

1. LED's official website separately links to auction property search and auction sale-result reporting.
2. LED's Digital Action Plan 2023–2025 describes the property-search service as nationwide public search and describes a separate auction-result reporting service. The plan identifies different legacy DBMS platforms for those systems; this is historical architecture information, not proof of current APIs or current database architecture.
3. The “ประกาศขายทอดตลาดนัดแรก” resource dictionary specifies Fiscal year, month, Type, Value (number of properties) and Price (appraisal value). These are aggregate measures grouped by period and asset type, not property-by-property records.
4. The “มูลค่าการผลักดันทรัพย์สิน...ด้วยการขายทอดตลาด” resource reports aggregate officer-assessed value at seizure. It is not an appraisal value for any particular property and is not a verified sale price or current market value.
5. The catalog identifies these statistical resources as public/open with no access restriction, but licenses them CC BY-NC. For a commercial investment platform, obtain written permission or a different license before reuse.
6. The CKAN API v3 root responds with version 3. Dataset-specific API calls and CSV file parsing were not fully verified; do not yet mark ingestion as operational.
7. LED regulations/guidance describe auction notices as containing key property and sale information (for example, asset type, description, size/location, sale date/time/place, conditions and encumbrances). LED-PI should preserve the original notice/document as source evidence where legally and technically permitted.

## 4. Access and compliance status

| Check | Status | Required next action |
|---|---|---|
| Official source ownership | Confirmed for listed LED domains/pages | Retain source URL and retrieval timestamp |
| Public user access to search/result apps | Service links are public; automated page inspection timed out | Manual browser verification and sample record review |
| Stable API for search/result apps | Not established | Do not assume endpoint; request official technical information |
| Current catalog auction datasets | Two auction datasets are aggregate counts by asset type | Use for statistical context only |
| Auction-driven asset valuation dataset | Aggregate officer-assessed value at seizure; monthly | Use for macro trends only; do not assign to individual property |
| CKAN API actions | package_show, resource_show and datastore_search URLs could not be inspected by the web layer | Run `php artisan led:open-data-test` in configured Laravel environment; record HTTP status and response |
| CSV resource access | Resource metadata and data dictionary readable; direct CSV body retrieval failed in the web inspection layer | Use the new local CSV importer after authorized download; validate encoding, headers, row count and numeric fields |
| Laravel CSV ingestion scaffold | Import service, Artisan command and separate raw/statistics table migration committed | Not runtime-tested; run migration and import against a downloaded sample in configured Laravel before production |
| Commercial reuse permission | CC BY-NC on the inspected auction statistics datasets | Written permission or alternative license required before commercial reuse |
| Bulk reuse / automated collection permission | Not established | Review terms/policies and obtain written clarification if ambiguous |
| CAPTCHA/login/rate-limit constraints | Not assessed | Respect all controls; do not bypass |
| Personal/sensitive data exposure | Not assessed at field level | Minimize collection; exclude unnecessary personal data |
| Historical auction results completeness | Not established | Validate coverage, update frequency, cancellation/adjournment semantics |

## 5. Proposed data acquisition order

1. **Aggregate Open Data pilot:** ingest the two auction-count datasets and auction-driven value dataset into a separate statistical fact table, preserving date, asset category, measure, unit, source URL and license metadata. Do not merge them into property records.
2. **API validation:** test CKAN package_show, package_search, resource_show and datastore_search for the exact dataset IDs; confirm resource URLs, CSV encoding, schema and update behavior. Keep API calls read-only and rate-limited.
3. **Official clarification:** contact LED for record-level auction data availability, data dictionary, API endpoint/documentation, commercial reuse permission, refresh frequency and historical coverage.
4. **Official e-Service second:** manually inspect representative search records and result records; record field names, identifiers, pagination behavior, document links and status transitions.
5. **CSV import fallback:** an initial Laravel CSV importer and dedicated led_open_data_rows migration are now in the repository. The importer stores raw row JSON, computes a row hash and performs an idempotent upsert. It still requires a downloaded file and validation of exact CSV headers, delimiter, encoding, fiscal-year/month conventions and Price units.
6. **API smoke test:** in a configured Laravel application, run `php artisan led:open-data-test` to test package_show, resource_show and datastore_search. Record results; datastore_search may be unavailable if DataStore is not enabled for this resource.
7. **Only after approval:** implement a rate-limited connector using documented interfaces; never bypass CAPTCHA, authentication, access controls or rate limits.

## 6. Initial field mapping for discovery (not yet confirmed against live schema)

| LED-PI field | Expected source | Validation rule |
|---|---|---|
| source_record_id | Search/result dataset or notice | Preserve source identifier exactly |
| case_reference | Notice/result | Treat as source text; do not infer missing digits |
| asset_type | Notice/search result | Map to controlled taxonomy while retaining raw label |
| asset_description | Notice | Preserve original text |
| province / district / subdistrict | Notice/search result | Store raw text and normalized administrative code separately |
| land_title_reference | Notice | Restrict access if the field exposes personal/legal information |
| area_size | Notice | Store value and unit separately |
| appraisal_price | Official notice/result | Preserve valuation type and as-of date; never relabel as market value |
| auction_date_time | Search result/notice | Store timezone Asia/Bangkok |
| auction_office | Search result/notice | Map to official office reference |
| auction_status | Search/result | Controlled states; retain raw source status |
| sale_result_price | Result service | Store only when explicitly present and distinguish from appraisal/asking price |
| notice_document_url | Notice | Preserve original URL and retrieval metadata |
| source_published_at / retrieved_at | Source metadata / collector | Never substitute retrieval time for publication time |

## 7. Required validation sample

Before implementing a connector, collect a small, manually verified sample (target 20–30 records) across:
- at least 3 provinces;
- more than one asset type;
- upcoming auctions and completed/cancelled/postponed cases, if available;
- records with and without downloadable notices;
- both search listings and corresponding sale-result records.

For each sample, compare the search listing, notice document and sale-result record. Record missing fields, identifier consistency, duplicate behavior and status changes.

## 8. Exit criteria for Phase 1

Phase 1 is complete only when:
- current dataset/API documentation and license are reviewed;
- the Laravel API smoke test confirms package/resource metadata and whether DataStore is enabled;
- the CSV importer passes tests against a verified source sample and migration runs successfully;
- access and commercial reuse conditions are documented;
- actual field dictionary and update frequency are verified;
- search-to-result record linkage is demonstrated with sample records;
- CSV/XLSX fallback format is specified;
- a source-quality report documents coverage, missingness, duplicates and known limitations.

Until then, source integration remains **pending validation** and must not be represented as nationwide complete or real-time.
