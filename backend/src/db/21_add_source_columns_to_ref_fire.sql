-- ========================================================================
-- MIGRATION: Add source columns to Refrigeration and Fire Suppression
-- Date: 2026-02-03
-- ========================================================================

-- 1. Add source columns to refrigeration_ac_activities (if they don't exist)
ALTER TABLE refrigeration_ac_activities 
ADD COLUMN IF NOT EXISTS source_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS source_description VARCHAR(255);

-- 2. Add source columns to fire_suppression_activities (if they don't exist)
ALTER TABLE fire_suppression_activities 
ADD COLUMN IF NOT EXISTS source_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS source_description VARCHAR(255);
