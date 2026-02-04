-- Emisson Factors for Plastics (approx MSW Plastics)
INSERT INTO emission_factors_stationary 
  (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Plastics', 91.80, 3.00, 0.60, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024 MSW Plastics'),
  ('Plastics', 3488.4, 114.0, 22.8, 'short ton', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024 MSW Plastics (derived)')
ON CONFLICT DO NOTHING;

-- Emission Factors for Solid Byproducts (approx Industrial Waste)
INSERT INTO emission_factors_stationary 
  (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Solid Byproducts', 90.00, 3.00, 0.60, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'Approximation'),
  ('Solid Byproducts', 1800.0, 60.0, 12.0, 'short ton', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'Approximation (20 MMBtu/ton)')
ON CONFLICT DO NOTHING;
