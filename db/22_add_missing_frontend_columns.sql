-- ========================================================================
-- MIGRATION: Add missing columns to support frontend
-- Date: 2026-02-03
-- ========================================================================

-- 1. Add months_in_operation to refrigeration_ac_activities (for Screening Method)
ALTER TABLE refrigeration_ac_activities 
ADD COLUMN IF NOT EXISTS months_in_operation INTEGER;

-- 2. Add source_id to transportation_distribution_activities
ALTER TABLE transportation_distribution_activities 
ADD COLUMN IF NOT EXISTS source_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS source_description VARCHAR(255);

-- 3. Add source_id to waste_activities
ALTER TABLE waste_activities 
ADD COLUMN IF NOT EXISTS source_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS source_description VARCHAR(255);

-- 4. Add source_id to offsets_activities
ALTER TABLE offsets_activities 
ADD COLUMN IF NOT EXISTS source_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS source_description VARCHAR(255);

-- 5. Add scope_category to offsets_activities
ALTER TABLE offsets_activities 
ADD COLUMN IF NOT EXISTS scope_category VARCHAR(100);
