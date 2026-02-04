-- ========================================================================
-- MIGRATION: Set default calculation_method for Electricity
-- Date: 2026-02-03
-- ========================================================================

-- Set default calculation_method to 'LOCATION_BASED' for electricity_activities
ALTER TABLE electricity_activities 
ALTER COLUMN calculation_method SET DEFAULT 'LOCATION_BASED';

-- Also update any existing NULLs (though they shouldn't exist due to NOT NULL, but for safety)
-- If constraint was momentarily dropped or data is inconsistent
UPDATE electricity_activities 
SET calculation_method = 'LOCATION_BASED' 
WHERE calculation_method IS NULL;
