-- ========================================================================
-- EMISSION FACTORS - STATIONARY COMBUSTION (GHG Protocol)
-- Seed data for stationary combustion fuels
-- Date: 2026-01-23
-- ========================================================================

INSERT INTO emission_factors_stationary 
  (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Natural Gas', 1.963, 0.095, 0.003, 'cubic meters', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024'),
  ('Natural Gas', 0.185, 0.009, 0.0003, 'kWh', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024')
ON CONFLICT DO NOTHING;

-- Natural Gas (MMBtu)
INSERT INTO emission_factors_stationary 
  (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Natural Gas', 53.07, 2.57, 0.081, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024')
ON CONFLICT DO NOTHING;

-- Natural Gas (short ton)
INSERT INTO emission_factors_stationary 
  (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Natural Gas', 1963, 95, 3, 'short ton', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024')
ON CONFLICT DO NOTHING;

INSERT INTO emission_factors_stationary 
  (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Diesel', 2.663, 0.012, 0.015, 'litres', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024')
ON CONFLICT DO NOTHING;

-- Diesel (MMBtu)
INSERT INTO emission_factors_stationary 
  (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Diesel', 73.25, 0.33, 0.41, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024')
ON CONFLICT DO NOTHING;

-- Diesel (short ton)
INSERT INTO emission_factors_stationary 
  (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Diesel', 2663, 12, 15, 'short ton', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024')
ON CONFLICT DO NOTHING;

INSERT INTO emission_factors_stationary 
  (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Petrol', 2.301, 0.006, 0.007, 'litres', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024'),
  ('Gasoline', 2.301, 0.006, 0.007, 'litres', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024')
ON CONFLICT DO NOTHING;

-- Petrol (MMBtu)
INSERT INTO emission_factors_stationary 
  (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Petrol', 67.98, 0.18, 0.21, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024'),
  ('Gasoline', 67.98, 0.18, 0.21, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024')
ON CONFLICT DO NOTHING;

-- Petrol (short ton)
INSERT INTO emission_factors_stationary 
  (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Petrol', 2301, 6, 7, 'short ton', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024'),
  ('Gasoline', 2301, 6, 7, 'short ton', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024')
ON CONFLICT DO NOTHING;

INSERT INTO emission_factors_stationary 
  (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('LPG', 1.555, 0.004, 0.002, 'litres', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024'),
  ('Propane', 1.555, 0.004, 0.002, 'litres', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024')
ON CONFLICT DO NOTHING;

-- LPG/Propane (MMBtu)
INSERT INTO emission_factors_stationary 
  (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('LPG', 63.07, 0.16, 0.08, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024'),
  ('Propane', 63.07, 0.16, 0.08, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024')
ON CONFLICT DO NOTHING;

-- LPG/Propane (short ton)
INSERT INTO emission_factors_stationary 
  (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('LPG', 1555, 4, 2, 'short ton', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024'),
  ('Propane', 1555, 4, 2, 'short ton', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024')
ON CONFLICT DO NOTHING;

INSERT INTO emission_factors_stationary 
  (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Coal', 2.410, 0.014, 0.004, 'kg', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024')
ON CONFLICT DO NOTHING;

-- Coal (MMBtu)
INSERT INTO emission_factors_stationary 
  (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Coal', 93.28, 0.54, 0.15, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024')
ON CONFLICT DO NOTHING;

-- Coal (short ton)
INSERT INTO emission_factors_stationary 
  (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Coal', 2410, 14, 4, 'short ton', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024')
ON CONFLICT DO NOTHING;

INSERT INTO emission_factors_stationary 
  (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Kerosene', 2.471, 0.010, 0.007, 'litres', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024')
ON CONFLICT DO NOTHING;

-- Kerosene (MMBtu)
INSERT INTO emission_factors_stationary 
  (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Kerosene', 68.70, 0.28, 0.20, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024')
ON CONFLICT DO NOTHING;

-- Kerosene (short ton)
INSERT INTO emission_factors_stationary 
  (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, effective_date, source)
VALUES 
  ('Kerosene', 2471, 10, 7, 'short ton', false, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024')
ON CONFLICT DO NOTHING;

-- ========================================================================
-- EMISSION FACTORS - ELECTRICITY (Scope 2)
-- ========================================================================

-- Electricity (Europe Average)
INSERT INTO emission_factors_electricity 
  (grid_region, co2e_kg_per_kwh, standard, version, effective_date, source)
VALUES 
  ('Europe', 0.227, 'GHG_PROTOCOL', 'IEA_2024', CURRENT_DATE, 'EPA AR5 2024 - Europe Average')
ON CONFLICT DO NOTHING;

-- ========================================================================
-- EMISSION FACTORS - STEAM (Scope 2)
-- ========================================================================

-- Steam
INSERT INTO emission_factors_steam 
  (co2e_kg_per_mmbtu, standard, version, effective_date, source)
VALUES 
  (0.053, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024')
ON CONFLICT DO NOTHING;

-- ========================================================================
-- EMISSION FACTORS - MOBILE SOURCES
-- ========================================================================

-- Diesel Vehicles
INSERT INTO emission_factors_mobile 
  (vehicle_type, vehicle_year, fuel_type, co2_kg_per_gallon, ch4_g_per_mile, n2o_g_per_mile, standard, version, effective_date, source)
VALUES 
  ('Passenger Car', 2024, 'Diesel', 10.088, 0.012, 0.015, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024')
ON CONFLICT DO NOTHING;

-- Petrol Vehicles
INSERT INTO emission_factors_mobile 
  (vehicle_type, vehicle_year, fuel_type, co2_kg_per_gallon, ch4_g_per_mile, n2o_g_per_mile, standard, version, effective_date, source)
VALUES 
  ('Passenger Car', 2024, 'Petrol', 8.715, 0.006, 0.007, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024')
ON CONFLICT DO NOTHING;

-- ========================================================================
-- EMISSION FACTORS - BUSINESS TRAVEL - AIR
-- ========================================================================

-- Air Travel
INSERT INTO business_travel_emission_factors 
  (travel_mode, cabin_class, flight_type, co2e_kg_per_km, source, effective_date, is_active)
VALUES 
  ('Air', 'Economy', 'Long Haul', 0.092, 'DEFRA 2024', CURRENT_DATE, true),
  ('Air', 'Economy', 'Short Haul', 0.122, 'DEFRA 2024', CURRENT_DATE, true),
  ('Air', 'Economy', 'Domestic', 0.131, 'DEFRA 2024', CURRENT_DATE, true)
ON CONFLICT DO NOTHING;

-- ========================================================================
-- EMISSION FACTORS - BUSINESS TRAVEL - RAIL
-- ========================================================================

-- Rail Travel
INSERT INTO business_travel_emission_factors 
  (travel_mode, co2e_kg_per_km, source, effective_date, is_active)
VALUES 
  ('Rail - Electric', 0.0141, 'DEFRA 2024', CURRENT_DATE, true),
  ('Rail - Diesel', 0.0726, 'DEFRA 2024', CURRENT_DATE, true)
ON CONFLICT DO NOTHING;

-- ========================================================================
-- EMISSION FACTORS - BUSINESS TRAVEL - ROAD
-- ========================================================================

-- Road Travel
INSERT INTO business_travel_emission_factors 
  (travel_mode, vehicle_size, co2e_kg_per_km, source, effective_date, is_active)
VALUES 
  ('Car - Petrol', 'Average', 0.194, 'DEFRA 2024', CURRENT_DATE, true),
  ('Car - Diesel', 'Average', 0.174, 'DEFRA 2024', CURRENT_DATE, true),
  ('Car - Hybrid', 'Average', 0.110, 'DEFRA 2024', CURRENT_DATE, true),
  ('Car - Electric', 'Average', 0.056, 'DEFRA 2024', CURRENT_DATE, true)
ON CONFLICT DO NOTHING;

-- ========================================================================
-- EMISSION FACTORS - BUSINESS TRAVEL - HOTEL
-- ========================================================================

-- Hotel Stays
INSERT INTO hotel_emission_factors 
  (hotel_category, co2e_kg_per_night, source, effective_date, is_active)
VALUES 
  ('3-Star', 76, 'DEFRA 2024', CURRENT_DATE, true),
  ('4-Star', 121, 'DEFRA 2024', CURRENT_DATE, true),
  ('5-Star', 182, 'DEFRA 2024', CURRENT_DATE, true)
ON CONFLICT DO NOTHING;

-- ========================================================================
-- EMISSION FACTORS - WASTE
-- ========================================================================

-- Waste Disposal
INSERT INTO waste_emission_factors 
  (waste_type, disposal_method, co2e_kg_per_ton, source, effective_date, is_active)
VALUES 
  ('General Waste', 'Landfill', 510, 'EPA AR5 2024', CURRENT_DATE, true),
  ('General Waste', 'Incineration', 1100, 'EPA AR5 2024', CURRENT_DATE, true),
  ('General Waste', 'Recycling', -200, 'EPA AR5 2024', CURRENT_DATE, true)
ON CONFLICT DO NOTHING;

-- ========================================================================
-- EMISSION FACTORS - COMMUTING
-- ========================================================================

-- Commuting
INSERT INTO commuting_emission_factors 
  (commute_mode, vehicle_type, co2e_kg_per_km, source, effective_date, is_active)
VALUES 
  ('Car', 'Petrol', 0.192, 'DEFRA 2024', CURRENT_DATE, true),
  ('Car', 'Diesel', 0.172, 'DEFRA 2024', CURRENT_DATE, true),
  ('Public Transport', 'Bus', 0.089, 'DEFRA 2024', CURRENT_DATE, true)
ON CONFLICT DO NOTHING;

-- ========================================================================
-- EMISSION FACTORS - TRANSPORTATION & DISTRIBUTION
-- ========================================================================

-- Freight Transport
INSERT INTO transportation_emission_factors 
  (transport_mode, co2e_kg_per_ton_km, source, effective_date, is_active)
VALUES 
  ('Road Freight', 0.107, 'EPA AR5 2024', CURRENT_DATE, true),
  ('Rail Freight', 0.028, 'EPA AR5 2024', CURRENT_DATE, true),
  ('Sea Freight', 0.010, 'EPA AR5 2024', CURRENT_DATE, true),
  ('Air Freight', 0.755, 'EPA AR5 2024', CURRENT_DATE, true)
ON CONFLICT DO NOTHING;

-- ========================================================================
-- EMISSION FACTORS - REFRIGERANTS
-- ========================================================================

-- Refrigerants
INSERT INTO emission_factors_refrigerants 
  (gas_type, gwp, standard, version, effective_date, source)
VALUES 
  ('HFC-134a', 1550, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024'),
  ('HFC-410A', 2088, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024'),
  ('HFC-404A', 3922, 'GHG_PROTOCOL', 'EPA_2024_v1', CURRENT_DATE, 'EPA AR5 2024')
ON CONFLICT DO NOTHING;

-- ========================================================================
-- EMISSION FACTORS - PURCHASED GASES
-- ========================================================================

-- Purchased Gases
INSERT INTO purchased_gas_emission_factors 
  (gas_type, gwp_value, source, effective_date, is_active)
VALUES 
  ('SF6', 23500, 'EPA AR5 2024', CURRENT_DATE, true),
  ('PFC', 7200, 'EPA AR5 2024', CURRENT_DATE, true),
  ('NF3', 17200, 'EPA AR5 2024', CURRENT_DATE, true)
ON CONFLICT DO NOTHING;

-- ========================================================================
-- END OF EMISSION FACTORS SEEDING
-- ========================================================================
