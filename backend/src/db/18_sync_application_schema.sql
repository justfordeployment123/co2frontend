-- ========================================================================
-- MIGRATION: Sync application schema with codebase
-- Date: 2026-01-27
-- Description: Adds missing columns for Scope 2 dual reporting and result categorization
-- ========================================================================

-- 1. Update emission_calculations table
-- Add dual reporting columns for Scope 2 (Electricity and Steam)
ALTER TABLE emission_calculations 
ADD COLUMN IF NOT EXISTS location_based_co2e_mt NUMERIC(15,6) DEFAULT 0,
ADD COLUMN IF NOT EXISTS market_based_co2e_mt NUMERIC(15,6) DEFAULT 0;

-- 2. Ensure co2e_metric_tons has enough precision
-- The original DECIMAL(18,4) is okay, but NUMERIC(15,6) is more consistent with newer tables
ALTER TABLE emission_calculations 
ALTER COLUMN co2e_metric_tons TYPE NUMERIC(15,6);

-- 3. Add categorization columns to calculation_results_summary if missing
-- These are used by the dashboard to show gross vs net
ALTER TABLE calculation_results_summary
ADD COLUMN IF NOT EXISTS total_scope1_and_scope2_location_based_gross_co2e NUMERIC(15,6) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_scope1_and_scope2_location_based_net_co2e NUMERIC(15,6) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_scope1_and_scope2_market_based_gross_co2e NUMERIC(15,6) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_scope1_and_scope2_market_based_net_co2e NUMERIC(15,6) DEFAULT 0;

-- 4. Cleanup redundant tables (Optional but good for clarity)
-- We'll keep calculation_results for now to avoid breaking any legacy code not yet audited,
-- but the main application now uses emission_calculations.

COMMENT ON COLUMN emission_calculations.location_based_co2e_mt IS 'Location-based Scope 2 emissions for this activity (if applicable)';
COMMENT ON COLUMN emission_calculations.market_based_co2e_mt IS 'Market-based Scope 2 emissions for this activity (if applicable)';

-- ========================================================================
-- MIGRATION COMPLETE
-- ========================================================================
