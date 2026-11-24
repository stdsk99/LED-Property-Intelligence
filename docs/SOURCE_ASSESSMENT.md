# Source Assessment — LED Property Intelligence
**Assessment version:** 0.2  
**Assessment date:** 2026-11-24  
**Status:** Preliminary desk assessment; live record-level extraction and permission checks remain pending.

## 1. Executive finding

The Department of Legal Execution (LED) exposes distinct public-facing services for (1) searching properties announced for auction, (2) viewing auction-sale results, and (3) open data. The public e-Service directory confirms the first two services. The open-data catalog contains auction-related datasets, but the currently surfaced datasets are aggregate statistics (counts by asset type), not a property-by-property auction inventory.

The legacy LED open-data metadata page for the record-level dataset “ข้อมูลการขายทอดตลาด” describes public auction-property records, CSV/JSON formats and daily update frequency, but also specifies **MOU access conditions** and a **Creative Commons Non-Commercial** license. This is a material restriction: do not use that dataset for a commercial investment product unless LED confirms the applicable access and reuse terms in writing. The metadata page also reports a last data update of 28/1/2565, so freshness must be revalidated.

**Implementation decision:** Do not build a production scraper or commercial connector yet. Treat aggregate Open Data as optional statistical context only. First obtain current written clarification and inspect the e-Service and dataset terms. In parallel, implement a CSV/XLSX import path with provenance and validation.

## 2. Source inventory

| Source | Official URL | Purpose / evidence | Current assessment |
|---|---|---|---|
| LED official website / e-Service directory | https://www.led.go.th/th/ | Official directory links to auction-property search, auction result reporting, and open data | Verified directory entry |
| Auction property search | https://asset.led.go.th/newbidreg | Official e-Service link labelled “ค้นหาทรัพย์ประกาศขายทอดตลาด” | URL verified from LED directory; automated page inspection timed out; fields and access rules unverified |
| Auction sale results | https://asset.led.go.th/report | Official e-Service link labelled “รายงานผลการขายทอดตลาด” | URL verified from LED directory; automated page inspection timed out; result fields and access rules unverified |
| LED open-data metadata: auction sale records | https://www.led.go.th/std/details/bid.asp | Metadata describes record-level auction-property data, CSV/JSON, daily frequency, MOU access and non-commercial license | Metadata surfaced; last-updated date shown as 28/1/2565; current resource availability and current terms require confirmation |
| LED Open Data catalog | https://opendata.led.go.th/dataset/ | Catalog includes “จำนวนประกาศขายทอดตลาด” and “ประกาศขายทอดตลาดนัดแรก” | These surfaced resources are aggregate counts by asset type, not individual property records |
| LED open-data landing page | https://www.led.go.th/std/ | Official page lists “ข้อมูลการขายทอดตลาด” and other open-data categories | Verified landing page |
| Auction live broadcast | https://live.led.go.th/ | Official live auction service; lists offices and live status | Supplementary operational context only; not a substitute for structured auction records |

## 3. What is established

1. LED's official website separately links to auction property search and auction sale-result reporting.
2. LED's Digital Action Plan 2023–2025 describes the property-search service as nationwide public search and describes a separate auction-result reporting service. The plan identifies different legacy DBMS platforms for those systems; this is historical architecture information, not proof of current APIs or current database architecture.
3. The currently surfaced Open Data catalog resources “จำนวนประกาศขายทอดตลาด” and “ประกาศขายทอดตลาดนัดแรก” describe the number of properties announced for auction, classified by asset type. They are aggregate statistics and are not sufficient to populate a searchable property registry.
4. The legacy metadata page for “ข้อมูลการขายทอดตลาด” describes record-level auction-property data, CSV/JSON formats and daily update frequency, but states MOU access conditions and a Creative Commons Non-Commercial license. It reports last data update 28/1/2565. This must be treated as restricted/stale until LED confirms otherwise.
5. LED regulations/guidance describe auction notices as containing key property and sale information (for example, asset type, description, size/location, sale date/time/place, conditions and encumbrances). LED-PI should preserve the original notice/document as source evidence where legally and technically permitted.

## 4. Access and compliance status

| Check | Status | Required next action |
|---|---|---|
| Official source ownership | Confirmed for listed LED domains/pages | Retain source URL and retrieval timestamp |
| Public user access to search/result apps | Service links are public; automated page inspection timed out | Manual browser verification and sample record review |
| Stable API for search/result apps | Not established | Do not assume endpoint; request official technical information |
| Record-level open-data dataset | Legacy metadata exists; MOU condition and non-commercial license stated; freshness questionable | Obtain current dataset file/schema and written confirmation of terms |
| Current catalog auction datasets | Aggregate counts by asset type | Use only for statistical context unless another record-level resource is verified |
| Open-data API | Catalog advertises API guidance | Inspect API guide and verify the specific resource is accessible under its license |
| Commercial reuse permission | Not established; legacy record-level metadata says non-commercial | Written clarification required before commercial use |
| Bulk reuse / automated collection permission | Not established | Review terms/policies and obtain written clarification if ambiguous |
| CAPTCHA/login/rate-limit constraints | Not assessed | Respect all controls; do not bypass |
| Personal/sensitive data exposure | Not assessed at field level | Minimize collection; exclude unnecessary personal data |
| Historical auction results completeness | Not established | Validate coverage, update frequency, cancellation/adjournment semantics |

## 5. Proposed data acquisition order

1. **Official clarification first:** contact LED for current record-level dataset availability, data dictionary, API endpoint/documentation, MOU process, commercial reuse permission, refresh frequency and historical coverage.
2. **Official e-Service second:** manually inspect representative search records and result records; record field names, identifiers, pagination behavior, document links and status transitions.
3. **Aggregate Open Data:** use aggregate count datasets only for macro-level trends and dashboard context; do not use them as property-level records.
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
- current dataset/API documentation and license are reviewed;
- access and commercial reuse conditions are documented;
- actual field dictionary and update frequency are verified;
- search-to-result record linkage is demonstrated with sample records;
- CSV/XLSX fallback format is specified;
- a source-quality report documents coverage, missingness, duplicates and known limitations.

Until then, source integration remains **pending validation** and must not be represented as nationwide complete or real-time.
