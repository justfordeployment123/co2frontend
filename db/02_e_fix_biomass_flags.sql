
-- Update Solid Byproducts to be marked as Biomass
UPDATE emission_factors_stationary 
SET is_biomass = true 
WHERE fuel_type = 'Solid Byproducts';

-- Update other likely biomass fuels based on Excel structure
UPDATE emission_factors_stationary 
SET is_biomass = true 
WHERE fuel_type IN (
  'Agricultural Byproducts',
  'Peat',
  'Wood and Wood Residuals',
  'Biodiesel (100%)',
  'Ethanol (100%)',
  'Rendered Animal Fat',
  'Vegetable Oil'
);

-- Ensure Fossil fuels are NOT marked as biomass (sanity check)
UPDATE emission_factors_stationary 
SET is_biomass = false 
WHERE fuel_type IN (
  'Plastics',
  'Tires',
  'Municipal Solid Waste',
  'Petroleum Coke (Solid)',
  'Coal Coke',
  'Anthracite Coal',
  'Bituminous Coal',
  'Sub-bituminous Coal',
  'Lignite Coal',
  'Natural Gas',
  'Distillate Fuel Oil No. 2',
  'Residual Fuel Oil No. 6',
  'Kerosene',
  'Propane Gas'
);
