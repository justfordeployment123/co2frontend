-- ========================================================================
-- MIGRATION: Add company contact/address columns for Settings
-- Date: 2026-03
-- Description: Supports Company Settings (contact email/phone, address, website)
-- ========================================================================

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS website VARCHAR(500),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
