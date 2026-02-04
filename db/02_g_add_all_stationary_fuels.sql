
-- ========================================================================
-- COMPREHENSIVE STATIONARY COMBUSTION FACTORS (EPA Excel 2024 Parity)
-- ========================================================================

-- 1. COAL VARIETIES
-- Anthracite Coal
INSERT INTO emission_factors_stationary (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Anthracite Coal', 103.69, 11.0, 1.6, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024'),
  ('Anthracite Coal', 2602.0, 276.0, 40.0, 'short ton', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024')
ON CONFLICT DO NOTHING;

-- Bituminous Coal
INSERT INTO emission_factors_stationary (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Bituminous Coal', 93.28, 11.0, 1.6, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024'),
  ('Bituminous Coal', 2325.0, 274.0, 40.0, 'short ton', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024')
ON CONFLICT DO NOTHING;

-- Sub-bituminous Coal
INSERT INTO emission_factors_stationary (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Sub-bituminous Coal', 97.17, 11.0, 1.6, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024'),
  ('Sub-bituminous Coal', 1676.0, 190.0, 28.0, 'short ton', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024')
ON CONFLICT DO NOTHING;

-- Lignite Coal
INSERT INTO emission_factors_stationary (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Lignite Coal', 97.72, 11.0, 1.6, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024'),
  ('Lignite Coal', 1389.0, 156.0, 23.0, 'short ton', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024')
ON CONFLICT DO NOTHING;

-- Coal Coke
INSERT INTO emission_factors_stationary (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Coal Coke', 113.67, 11.0, 1.6, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024'),
  ('Coal Coke', 2819.0, 273.0, 40.0, 'short ton', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024')
ON CONFLICT DO NOTHING;

-- Mixed Coals
INSERT INTO emission_factors_stationary (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Mixed (Commercial Sector)', 94.27, 11.0, 1.6, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024'),
  ('Mixed (Commercial Sector)', 2016.0, 235.0, 34.0, 'short ton', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024'),
  ('Mixed (Electric Power Sector)', 95.52, 11.0, 1.6, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024'),
  ('Mixed (Electric Power Sector)', 1885.0, 217.0, 32.0, 'short ton', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024'),
  ('Mixed (Industrial Coking)', 93.90, 11.0, 1.6, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024'),
  ('Mixed (Industrial Coking)', 2468.0, 289.0, 42.0, 'short ton', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024'),
  ('Mixed (Industrial Sector)', 94.67, 11.0, 1.6, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024'),
  ('Mixed (Industrial Sector)', 2116.0, 246.0, 36.0, 'short ton', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024')
ON CONFLICT DO NOTHING;

-- 2. OTHER SOLID FUELS
-- Municipal Solid Waste
INSERT INTO emission_factors_stationary (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Municipal Solid Waste', 90.70, 32.0, 4.2, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024'),
  ('Municipal Solid Waste', 902.0, 318.0, 42.0, 'short ton', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024')
ON CONFLICT DO NOTHING;

-- Petroleum Coke (Solid)
INSERT INTO emission_factors_stationary (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Petroleum Coke (Solid)', 102.41, 32.0, 4.2, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024'),
  ('Petroleum Coke (Solid)', 3072.0, 960.0, 126.0, 'short ton', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024')
ON CONFLICT DO NOTHING;

-- Tires
INSERT INTO emission_factors_stationary (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Tires', 85.97, 32.0, 4.2, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024'),
  ('Tires', 2407.0, 896.0, 118.0, 'short ton', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024')
ON CONFLICT DO NOTHING;

-- 3. BIOMASS SOLIDS
-- Agricultural Byproducts
INSERT INTO emission_factors_stationary (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Agricultural Byproducts', 118.17, 32.0, 4.2, 'MMBtu', true, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024'),
  ('Agricultural Byproducts', 975.0, 264.0, 35.0, 'short ton', true, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024')
ON CONFLICT DO NOTHING;

-- Peat
INSERT INTO emission_factors_stationary (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Peat', 111.84, 32.0, 4.2, 'MMBtu', true, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024'),
  ('Peat', 895.0, 256.0, 34.0, 'short ton', true, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024')
ON CONFLICT DO NOTHING;

-- 4. BIOMASS LIQUIDS
-- Biodiesel (100%)
INSERT INTO emission_factors_stationary (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Biodiesel (100%)', 73.84, 1.1, 0.11, 'MMBtu', true, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024'),
  ('Biodiesel (100%)', 9.45, 0.14, 0.01, 'gallons', true, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024')
ON CONFLICT DO NOTHING;

-- Ethanol (100%)
INSERT INTO emission_factors_stationary (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Ethanol (100%)', 68.44, 1.1, 0.11, 'MMBtu', true, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024'),
  ('Ethanol (100%)', 5.75, 0.09, 0.01, 'gallons', true, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024')
ON CONFLICT DO NOTHING;

-- Rendered Animal Fat
INSERT INTO emission_factors_stationary (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Rendered Animal Fat', 71.06, 1.1, 0.11, 'MMBtu', true, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024'),
  ('Rendered Animal Fat', 8.88, 0.14, 0.01, 'gallons', true, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024')
ON CONFLICT DO NOTHING;

-- Vegetable Oil
INSERT INTO emission_factors_stationary (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Vegetable Oil', 81.55, 1.1, 0.11, 'MMBtu', true, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024'),
  ('Vegetable Oil', 9.79, 0.13, 0.01, 'gallons', true, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA 2024')
ON CONFLICT DO NOTHING;

-- Ensure Biomass Flag for Solid Byproducts is correct (Redundant safety check)
UPDATE emission_factors_stationary SET is_biomass = true WHERE fuel_type = 'Solid Byproducts';
