
-- Update Solid Byproducts with values from Excel Calculator (Sheet 18, Row 32)
-- MMBtu Factors
UPDATE emission_factors_stationary 
SET 
  co2_kg_per_unit = 105.51,
  ch4_g_per_unit = 32.0,
  n2o_g_per_unit = 4.2,
  source = 'EPA 2024 (Excel Parity)'
WHERE fuel_type = 'Solid Byproducts' AND unit = 'MMBtu';

-- Short Ton Factors
UPDATE emission_factors_stationary 
SET 
  co2_kg_per_unit = 1096.0,
  ch4_g_per_unit = 332.0,
  n2o_g_per_unit = 44.0,
  source = 'EPA 2024 (Excel Parity)'
WHERE fuel_type = 'Solid Byproducts' AND unit = 'short ton';

-- Update Plastics with values from Excel Calculator (Sheet 18, Row 28)
-- MMBtu Factors
UPDATE emission_factors_stationary 
SET 
  co2_kg_per_unit = 75.0,
  ch4_g_per_unit = 32.0,
  n2o_g_per_unit = 4.2,
  source = 'EPA 2024 (Excel Parity)'
WHERE fuel_type = 'Plastics' AND unit = 'MMBtu';

-- Short Ton Factors
UPDATE emission_factors_stationary 
SET 
  co2_kg_per_unit = 2850.0,
  ch4_g_per_unit = 1216.0,
  n2o_g_per_unit = 160.0,
  source = 'EPA 2024 (Excel Parity)'
WHERE fuel_type = 'Plastics' AND unit = 'short ton';
