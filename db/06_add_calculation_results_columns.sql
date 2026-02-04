-- ========================================================================
-- MIGRATION: Add Missing Columns to calculation_results
-- Date: 2026-01-25
-- Purpose: Add result_data and is_latest columns required by backend services
-- ========================================================================

-- Add result_data column (JSONB to store calculation results)
ALTER TABLE calculation_results 
ADD COLUMN IF NOT EXISTS result_data JSONB;

-- Add is_latest column (to track latest calculations)
ALTER TABLE calculation_results 
ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT true;

-- Add created_at if not exists
ALTER TABLE calculation_results
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at if not exists  
ALTER TABLE calculation_results
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create index on result_data for faster queries
CREATE INDEX IF NOT EXISTS idx_calculation_results_result_data 
ON calculation_results USING GIN (result_data);

-- Create index on is_latest
CREATE INDEX IF NOT EXISTS idx_calculation_results_is_latest
ON calculation_results (is_latest) WHERE is_latest = true;

COMMENT ON COLUMN calculation_results.result_data IS 'JSONB column storing calculation results including emissions data';
COMMENT ON COLUMN calculation_results.is_latest IS 'Flag to identify the most recent calculation for an activity';

-- ========================================================================
-- MIGRATION COMPLETE
-- ========================================================================
