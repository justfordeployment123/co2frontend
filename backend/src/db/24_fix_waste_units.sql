-- ========================================================================
-- MIGRATION: Fix column mismatch for Waste Activities
-- Date: 2026-02-03
-- ========================================================================

-- Rename amount_units to units in waste_activities to match frontend
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'waste_activities' AND column_name = 'amount_units') THEN
    ALTER TABLE waste_activities RENAME COLUMN amount_units TO units;
  END IF;
END $$;
