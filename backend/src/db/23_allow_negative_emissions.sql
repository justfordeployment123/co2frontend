-- ========================================================================
-- MIGRATION: Remove non-negative check on emissions to allow offsets (negative)
-- Date: 2026-02-03
-- ========================================================================

-- Drop the constraint that prevents negative emissions (needed for offsets)
ALTER TABLE emission_calculations 
DROP CONSTRAINT IF EXISTS check_emissions_non_negative;
