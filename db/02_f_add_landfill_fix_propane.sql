
-- Update Propane Gas (MMBtu) to match Excel Parity
UPDATE emission_factors_stationary 
SET 
  co2_kg_per_unit = 61.46,
  ch4_g_per_unit = 3.0,
  n2o_g_per_unit = 0.60,
  source = 'EPA 2024 (Excel Parity)',
  is_biomass = false
WHERE fuel_type IN ('Propane', 'Propane Gas', 'LPG') AND unit = 'MMBtu';

-- Propane (short ton) - implied parity if needed, but primary is MMBtu or Gallon (Propane is liquid/gas)
-- Excel Propane Gas also has SCf and Gallon factors in "Heat Content" / "Emission Factors" rows.
-- We will stick to MMBtu as the driver for Propane in our logic usually, but let's check Gallon.
-- Excel L8909: Propane Gas (scf) -> CO2: 0.15463 kg/unit? No, that's row 34.
-- Row 34 in text (L8895): Propane Gas.
-- CO2 MMBtu: 61.46.
-- CO2/unit (scf): 0.15463.
-- CH4/unit (scf): 0.007548.
-- N2O/unit (scf): 0.00151.
-- Let's add Propane Gas (scf) factor to be precise.
INSERT INTO emission_factors_stationary 
  (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Propane Gas', 0.15463, 0.007548, 0.00151, 'scf', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024 (Excel Parity)')
ON CONFLICT DO NOTHING;

-- Landfill Gas
-- Excel Row 35 (L8905): 
-- CO2/unit (scf): 0.025254 (This is the biogenic CO2)
-- CH4/unit (scf): 0.001552
-- N2O/unit (scf): 0.000306
INSERT INTO emission_factors_stationary 
  (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Landfill Gas', 0.025254, 0.001552, 0.000306, 'scf', true, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024 (Excel Parity)')
ON CONFLICT DO NOTHING;

-- Wood and Wood Residuals (MMBtu)
-- Excel Row 33 (L8885):
-- CO2/unit (short ton): 1640
-- CH4/unit (short ton): 126
-- N2O/unit (short ton): 63
-- CO2 MMBtu: 0 (Biogenic)
-- To handle this correctly in our engine, we insert the short ton factor with is_biomass=true.
INSERT INTO emission_factors_stationary 
  (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Wood and Wood Residuals', 1640, 126, 63, 'short ton', true, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024 (Excel Parity)')
ON CONFLICT DO NOTHING;
