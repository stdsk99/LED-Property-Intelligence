-- LED-PI MySQL 8 starter schema (core tables)
-- Review and convert to Laravel migrations before production.
CREATE DATABASE IF NOT EXISTS led_property_intelligence CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE led_property_intelligence;

CREATE TABLE organizations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(190) NOT NULL UNIQUE,
  status ENUM('active','suspended','closed') NOT NULL DEFAULT 'active',
  settings JSON NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL
) ENGINE=InnoDB;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  email_verified_at TIMESTAMP NULL,
  password VARCHAR(255) NOT NULL,
  status ENUM('active','invited','disabled') NOT NULL DEFAULT 'active',
  remember_token VARCHAR(100) NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL
) ENGINE=InnoDB;

CREATE TABLE organization_user (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  role ENUM('owner','admin','analyst','investor','read_only') NOT NULL DEFAULT 'investor',
  joined_at TIMESTAMP NULL, created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  UNIQUE KEY uq_org_user (organization_id,user_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE data_sources (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  source_type ENUM('official_api','open_data_file','permitted_public_web','manual','market_listing','government_valuation') NOT NULL,
  base_url TEXT NULL, access_method VARCHAR(80) NULL, permission_notes TEXT NULL,
  refresh_minutes INT UNSIGNED NULL, is_active BOOLEAN NOT NULL DEFAULT FALSE,
  config JSON NULL, created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL
) ENGINE=InnoDB;

CREATE TABLE properties (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  canonical_code VARCHAR(64) NOT NULL UNIQUE,
  property_type VARCHAR(40) NOT NULL DEFAULT 'unknown',
  title VARCHAR(500) NULL, description LONGTEXT NULL,
  land_rai DECIMAL(12,4) NULL, land_ngan DECIMAL(12,4) NULL,
  land_sqwah DECIMAL(14,4) NULL, building_area_sqm DECIMAL(14,3) NULL,
  address_text TEXT NULL, province_code VARCHAR(10) NULL, province_name VARCHAR(120) NULL,
  district_code VARCHAR(12) NULL, district_name VARCHAR(120) NULL,
  subdistrict_code VARCHAR(15) NULL, subdistrict_name VARCHAR(120) NULL,
  latitude DECIMAL(10,7) NULL, longitude DECIMAL(10,7) NULL,
  verification_status ENUM('unverified','partially_verified','verified','disputed') NOT NULL DEFAULT 'unverified',
  first_seen_at DATETIME NULL, last_seen_at DATETIME NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  KEY idx_property_location (province_code,district_code,subdistrict_code),
  KEY idx_property_type (property_type)
) ENGINE=InnoDB;

CREATE TABLE import_batches (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  data_source_id BIGINT UNSIGNED NOT NULL, started_by BIGINT UNSIGNED NULL,
  batch_type ENUM('api','file','manual','connector') NOT NULL,
  file_name VARCHAR(255) NULL,
  status ENUM('queued','running','completed','partial','failed','cancelled') NOT NULL DEFAULT 'queued',
  records_seen INT UNSIGNED NOT NULL DEFAULT 0, records_created INT UNSIGNED NOT NULL DEFAULT 0,
  records_updated INT UNSIGNED NOT NULL DEFAULT 0, records_skipped INT UNSIGNED NOT NULL DEFAULT 0,
  error_summary TEXT NULL, started_at DATETIME NULL, finished_at DATETIME NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  FOREIGN KEY (data_source_id) REFERENCES data_sources(id),
  FOREIGN KEY (started_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE source_records (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id BIGINT UNSIGNED NULL, data_source_id BIGINT UNSIGNED NOT NULL,
  import_batch_id BIGINT UNSIGNED NULL, source_record_key VARCHAR(190) NOT NULL,
  source_url TEXT NULL, source_published_at DATETIME NULL, fetched_at DATETIME NOT NULL,
  raw_payload JSON NULL, normalized_hash CHAR(64) NULL,
  match_status ENUM('unmatched','auto_matched','review_required','confirmed','rejected') NOT NULL DEFAULT 'unmatched',
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  UNIQUE KEY uq_source_record (data_source_id,source_record_key),
  FOREIGN KEY (property_id) REFERENCES properties(id),
  FOREIGN KEY (data_source_id) REFERENCES data_sources(id),
  FOREIGN KEY (import_batch_id) REFERENCES import_batches(id)
) ENGINE=InnoDB;

CREATE TABLE auction_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id BIGINT UNSIGNED NOT NULL, source_record_id BIGINT UNSIGNED NULL,
  round_number INT UNSIGNED NULL, scheduled_at DATETIME NULL, venue VARCHAR(255) NULL,
  channel ENUM('onsite','online','hybrid','unknown') NOT NULL DEFAULT 'unknown',
  opening_price DECIMAL(16,2) NULL, deposit_amount DECIMAL(16,2) NULL,
  status ENUM('scheduled','postponed','cancelled','in_progress','sold','unsold','withdrawn','unknown') NOT NULL DEFAULT 'unknown',
  conditions TEXT NULL, last_verified_at DATETIME NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  KEY idx_auction_schedule (status,scheduled_at),
  FOREIGN KEY (property_id) REFERENCES properties(id),
  FOREIGN KEY (source_record_id) REFERENCES source_records(id)
) ENGINE=InnoDB;

CREATE TABLE valuation_observations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id BIGINT UNSIGNED NOT NULL, data_source_id BIGINT UNSIGNED NULL,
  valuation_basis ENUM('government_assessed','listing_asking','verified_transaction','broker_opinion','internal_estimate') NOT NULL,
  amount DECIMAL(16,2) NOT NULL,
  unit_basis ENUM('whole_property','per_rai','per_ngan','per_sqwah','per_sqm','per_month','per_year') NOT NULL DEFAULT 'whole_property',
  observed_at DATETIME NOT NULL,
  confidence_grade ENUM('A','B','C','D','unrated') NOT NULL DEFAULT 'unrated',
  method_notes TEXT NULL, created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  KEY idx_valuation_property_date (property_id,observed_at),
  FOREIGN KEY (property_id) REFERENCES properties(id),
  FOREIGN KEY (data_source_id) REFERENCES data_sources(id)
) ENGINE=InnoDB;

CREATE TABLE investment_analyses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL, property_id BIGINT UNSIGNED NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  scenario_type ENUM('resale','rental') NOT NULL,
  assumptions JSON NOT NULL, outputs JSON NULL, formula_version VARCHAR(40) NOT NULL,
  status ENUM('draft','reviewed','archived') NOT NULL DEFAULT 'draft',
  calculated_at DATETIME NULL, created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  KEY idx_analysis_org_property (organization_id,property_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (property_id) REFERENCES properties(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE watchlists (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL, user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  visibility ENUM('private','organization') NOT NULL DEFAULT 'private',
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE watchlist_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  watchlist_id BIGINT UNSIGNED NOT NULL, property_id BIGINT UNSIGNED NOT NULL,
  target_bid DECIMAL(16,2) NULL, alert_rules JSON NULL, notes TEXT NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  UNIQUE KEY uq_watchlist_property (watchlist_id,property_id),
  FOREIGN KEY (watchlist_id) REFERENCES watchlists(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id)
) ENGINE=InnoDB;
