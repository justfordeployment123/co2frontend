-- ========================================================================
-- MIGRATION: Update Scope 2 Activity and Factor Tables
-- Date: 2026-01-27
-- Description: Adds missing columns for strictly adhering to Excel tool
-- ========================================================================

-- 1. Updates for Electricity Activities
ALTER TABLE electricity_activities 
ADD COLUMN IF NOT EXISTS source_area_sqft DECIMAL(18,2),
ADD COLUMN IF NOT EXISTS market_based_co2_factor DECIMAL(12,6),
ADD COLUMN IF NOT EXISTS market_based_ch4_factor DECIMAL(12,6),
ADD COLUMN IF NOT EXISTS market_based_n2o_factor DECIMAL(12,6);

-- 2. Updates for Steam Activities
ALTER TABLE steam_activities
ADD COLUMN IF NOT EXISTS source_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS source_description TEXT,
ADD COLUMN IF NOT EXISTS source_area_sqft DECIMAL(18,2),
ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS boiler_efficiency DECIMAL(5,2) DEFAULT 80.00,
ADD COLUMN IF NOT EXISTS supplier_ch4_factor DECIMAL(12,6),
ADD COLUMN IF NOT EXISTS supplier_n2o_factor DECIMAL(12,6),
ADD COLUMN IF NOT EXISTS market_based_co2_factor DECIMAL(12,6),
ADD COLUMN IF NOT EXISTS market_based_ch4_factor DECIMAL(12,6),
ADD COLUMN IF NOT EXISTS market_based_n2o_factor DECIMAL(12,6);

-- 3. Updates for Electricity Emission Factors
ALTER TABLE emission_factors_electricity
ADD COLUMN IF NOT EXISTS co2_lb_per_mwh DECIMAL(12,4),
ADD COLUMN IF NOT EXISTS ch4_lb_per_mwh DECIMAL(12,4),
ADD COLUMN IF NOT EXISTS n2o_lb_per_mwh DECIMAL(12,4);

-- 4. Ensure we have a steam factors table with enough columns or use stationary
-- Existing steam table seems basic, let's see its columns again.
-- co2e_kg_per_mmbtu
-- We don't really need a special steam factor table if we use stationary_combustion table 
-- because steam calculation in Excel uses stationary fuel factors as fallback anyway.
-- However, we'll keep emission_factors_steam for supplier-specific defaults if needed.
