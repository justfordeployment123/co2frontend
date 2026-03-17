-- ========================================================================
-- SEED DATA: Scope 2 eGRID Emission Factors (EPA 2024 / eGRID2022)
-- Date: 2026-01-27
-- Units: lb/MWh (extracted directly from Excel)
-- ========================================================================

-- Clear existing to avoid duplicates if re-run
DELETE FROM emission_factors_electricity WHERE standard = 'GHG_PROTOCOL' AND version = 'eGRID2022';

INSERT INTO emission_factors_electricity 
  (grid_region, co2_lb_per_mwh, ch4_lb_per_mwh, n2o_lb_per_mwh, co2e_kg_per_kwh, standard, version, effective_date, source)
VALUES 
  ('ASCC Alaska Grid', 1052.114, 0.088, 0.012, 0.478, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('ASCC Miscellaneous', 495.772, 0.023, 0.004, 0.225, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('WECC Southwest', 776.036, 0.051, 0.007, 0.353, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('WECC California', 497.443, 0.03, 0.004, 0.226, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('ERCOT All', 771.083, 0.049, 0.007, 0.351, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('FRCC All', 813.846, 0.048, 0.006, 0.370, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('HICC Miscellaneous', 1155.486, 0.124, 0.019, 0.526, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('HICC Oahu', 1575.407, 0.163, 0.025, 0.718, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('MRO East', 1479.621, 0.133, 0.019, 0.675, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('MRO West', 936.485, 0.102, 0.015, 0.427, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('NPCC New England', 536.428, 0.063, 0.008, 0.245, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('WECC Northwest', 602.088, 0.056, 0.008, 0.274, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('NPCC NYC/Westchester', 885.233, 0.023, 0.003, 0.402, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('NPCC Long Island', 1200.708, 0.135, 0.018, 0.548, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('NPCC Upstate NY', 274.559, 0.015, 0.002, 0.125, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('Puerto Rico Miscellaneous', 1593.481, 0.087, 0.014, 0.725, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('RFC East', 657.386, 0.045, 0.006, 0.299, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('RFC Michigan', 1216.404, 0.116, 0.016, 0.555, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('RFC West', 1000.053, 0.087, 0.012, 0.455, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('WECC Rockies', 1124.887, 0.101, 0.014, 0.513, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('SPP North', 952.575, 0.1, 0.014, 0.435, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('SPP South', 970.398, 0.072, 0.01, 0.442, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('SERC Mississippi Valley', 801.015, 0.04, 0.006, 0.364, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('SERC Midwest', 1369.887, 0.151, 0.022, 0.625, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('SERC South', 893.29, 0.064, 0.009, 0.407, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('SERC Tennessee Valley', 933.067, 0.082, 0.012, 0.426, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('SERC Virginia/Carolina', 622.987, 0.047, 0.007, 0.284, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022'),
  ('US Average', 823.149, 0.066, 0.009, 0.375, 'GHG_PROTOCOL', 'eGRID2022', '2024-01-01', 'EPA eGRID2022');

-- Note: co2e_kg_per_kwh calculated as: 
-- (lb_CO2 + lb_CH4 * 28/1000 + lb_N2O * 265/1000) * 0.45359 / 1000
-- Example ASCC Alaska Grid: (1052.114 + 0.088*0.028 + 0.012*0.265) * 0.45359 / 1000 = approx 0.478
-- This is just for backward compatibility, the new logic will use the lb/MWh factors when available.
