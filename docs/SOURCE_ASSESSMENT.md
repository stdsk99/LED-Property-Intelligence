# Source Assessment — LED Property Intelligence
**Assessment version:** 0.1  
**Assessment date:** 2026-11-24  
**Status:** Preliminary desk assessment; live extraction and permission checks remain pending.

## 1. Executive finding

The Department of Legal Execution (LED) exposes distinct public-facing services for (1) searching properties announced for auction, (2) viewing auction-sale results, and (3) open data. These are promising primary sources for LED-PI, but this assessment does **not** establish that a stable public API exists for the auction search/result applications, nor that automated bulk extraction is permitted.

**Implementation decision:** Do not build a production scraper yet. First obtain/inspect the official dataset/API documentation and confirm terms, authentication, rate limits, and permitted reuse. In parallel, implement a CSV/XLSX import path with provenance and validation.

## 2. Source inventory

| Source | Official URL | Purpose / evidence | Current assessment |
|---|---|---|---|
| LED official website / e-Service directory | https://www.led.go.th/th/ | Official directory links to auction-property search, auction result reporting, and open data | Verified directory entry |
| Auction property search | https://asset.led.go.th/newbidreg | Official e-Service link labelled “ค้นหาทรัพย์ประกาศขายทอดตลาด” | URL verified from LED directory; automated page inspection timed out; fields and access rules unverified |
| Auction sale results | https://asset.led.go.th/report | Official e-Service link labelled “รายงานผลการขายทอดตลาด” | URL verified from LED directory; automated page inspection timed out; result fields and access rules unverified |
| LED open data portal | https://www.led.go.th/std/ | Official page lists “ข้อมูลการขายทอดตลาด” and other open-data categories | Portal verified; individual dataset schema, downloadable files, API details and license need inspection |
| LED Open Data CKAN-like catalog | https://opendata.led.go.th/ | Search result indicates datasets and API documentation are available | Portal surfaced; exact dataset/API endpoint and reuse conditions not yet verified |
| Auction live broadcast | https://live.led.go.th/ | Official live auction service; lists offices and live status | Supplementary operational context only; not a substitute for structured auction records |

## 3. What is established

1. LED's official website separately links to auction property search and auction sale-result reporting.
2. LED's Digital Action Plan 2023–2025 describes the property-search service as nationwide public search and describes a separate auction-result reporting service. The plan identifies different legacy DBMS platforms for those systems; this is historical architecture information, not proof of current APIs or current database architecture.
3. LED's open-data page lists an auction-sale dataset category. A search-indexed catalog page indicates CSV resources and an API guide are available in the catalog, but the exact auction dataset resource and its current license have not yet been inspected.
4. LED regulations/guidance describe auction notices as containing key property and sale information (for example, asset type, description, size/location, sale date/time/place, conditions and encumbrances). LED-PI should preserve the original notice/document as source evidence where legally and technically permitted.

## 4. Access and compliance status

| Check | Status | Required next action |
|---|---|---|
| Official source ownership | Confirmed for listed LED domains/pages | Retain source URL and retrieval timestamp |
| Public user access to search/result apps | Service links are public; automated inspection timed out | Manual browser verification and sample record review |
| Stable API for search/result apps | Not established | Do not assume endpoint; request official technical information |
| Open-data API | Catalog advertises API guidance | Inspect API guide, dataset resource metadata, and license |
| Bulk reuse / automated collection permission | Not established | Review terms/policies and obtain written clarification if ambiguous |
| CAPTCHA/login/rate-limit constraints | Not assessed | Respect all controls; do not bypass |
| Personal/sensitive data exposure | Not assessed at field level | Minimize collection; exclude unnecessary personal data |
| Historical auction results completeness | Not established | Validate coverage, update frequency, cancellation/adjournment semantics |

## 5. Proposed data acquisition order

1. **Open Data first:** inspect the auction dataset metadata, downloadable CSV resources, API guide, license, update frequency and historical coverage.
2. **Official e-Service second:** manually inspect representative search records and result records; record field names, identifiers, pagination behavior, document links and status transitions.
3. **Official clarification:** contact LED for permitted machine access, API availability, data dictionary, refresh frequency, bulk reuse conditions and whether historical result data can be reused.
4. **CSV/XLSX import fallback:** allow authorized users to import official exports/documents; store source file, source URL, import timestamp, checksum and row-level provenance.
5. **Only after approval:** implement a rate-limited connector using documented interfaces; never bypass CAPTCHA, authentication, access controls or rate limits.

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
- dataset/API documentation and license are reviewed;
- access and reuse conditions are documented;
- actual field dictionary and update frequency are verified;
- search-to-result record linkage is demonstrated with sample records;
- CSV/XLSX fallback format is specified;
- a source-quality report documents coverage, missingness, duplicates and known limitations.

Until then, source integration remains **pending validation** and must not be represented as nationwide complete or real-time.
