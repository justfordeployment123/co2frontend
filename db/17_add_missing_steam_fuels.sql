-- ========================================================================
-- SEED DATA: Missing Steam/Stationary Fuel Factors (EPA 2024 Parity)
-- Date: 2026-01-27
-- Units: kg/MMBtu or g/MMBtu (for CH4/N2O)
-- ========================================================================

-- Ensure the table has a unique constraint for the UPSERT logic below
DO $$ 
BEGIN 
    -- 1. Remove duplicates before adding the constraint (keeping the newest one)
    DELETE FROM emission_factors_stationary a
    USING emission_factors_stationary b
    WHERE a.id < b.id 
      AND a.fuel_type = b.fuel_type 
      AND a.unit = b.unit 
      AND a.standard = b.standard 
      AND a.version = b.version;

    -- 2. Add the missing unique constraint if it doesn't already exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_stationary_fuels'
    ) THEN
        ALTER TABLE emission_factors_stationary 
        ADD CONSTRAINT uq_stationary_fuels UNIQUE (fuel_type, unit, standard, version);
    END IF;
END $$;

INSERT INTO emission_factors_stationary 
  (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Natural Gas', 53.06, 1.0, 0.1, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', '2024-01-01', 'EPA 2024'),
  ('Distillate Fuel Oil No. 2', 73.96, 3.0, 0.6, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', '2024-01-01', 'EPA 2024'),
  ('Residual Fuel Oil No. 6', 75.10, 3.0, 0.6, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', '2024-01-01', 'EPA 2024'),
  ('Kerosene', 75.20, 3.0, 0.6, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', '2024-01-01', 'EPA 2024'),
  ('Liquefied Petroleum Gases (LPG)', 61.71, 3.0, 0.6, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', '2024-01-01', 'EPA 2024'),
  ('Propane Gas', 61.46, 3.0, 0.6, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', '2024-01-01', 'EPA 2024'),
  ('Landfill Gas', 0.0, 3.2, 0.63, 'MMBtu', true, 'GHG_PROTOCOL', 'EPA_2024_v1', '2024-01-01', 'EPA 2024'),
  ('Wood and Wood Residuals', 0.0, 7.2, 3.6, 'MMBtu', true, 'GHG_PROTOCOL', 'EPA_2024_v1', '2024-01-01', 'EPA 2024'),
  ('Solid Byproducts', 105.51, 32.0, 4.2, 'MMBtu', true, 'GHG_PROTOCOL', 'EPA_2024_v1', '2024-01-01', 'EPA 2024'),
  ('Plastics', 75.0, 32.0, 4.2, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', '2024-01-01', 'EPA 2024')
ON CONFLICT (fuel_type, unit, standard, version) DO UPDATE SET
  co2_kg_per_unit = EXCLUDED.co2_kg_per_unit,
  ch4_g_per_unit = EXCLUDED.ch4_g_per_unit,
  n2o_g_per_unit = EXCLUDED.n2o_g_per_unit;

-- Note: Landfill Gas and Wood are biogenic so CO2 factor is 0 for Scope 1/2 reporting purposes in many protocols, 
-- but CH4 and N2O still apply.
