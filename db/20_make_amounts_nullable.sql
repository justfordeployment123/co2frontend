-- ========================================================================
-- MIGRATION: Make amount columns nullable for Material Balance methods
-- Date: 2026-02-03
-- ========================================================================

-- 1. Make amount_released nullable in refrigeration_ac_activities
ALTER TABLE refrigeration_ac_activities 
ALTER COLUMN amount_released DROP NOT NULL;

-- 2. Make amount_used nullable in fire_suppression_activities
ALTER TABLE fire_suppression_activities 
ALTER COLUMN amount_used DROP NOT NULL;
