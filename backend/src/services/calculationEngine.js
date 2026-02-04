/**
 * ========================================================================
 * AURIXON CALCULATION ENGINE - PURE CALCULATION FUNCTIONS
 * ========================================================================
 * 
 * This module contains PURE calculation functions with NO database calls.
 * All emission factors must be passed as parameters.
 * 
 * Formulas are based on EPA Simplified GHG Emissions Calculator
 * (September 2024) to ensure Excel parity.
 * 
 * CRITICAL: These functions must produce EXACT same results as Excel.
 */

const CONSTANTS = {
  // Global Warming Potentials (GWP) - 100 year timescale
  CH4_GWP: 28, // IPCC AR5
  N2O_GWP: 265, // IPCC AR5
  
  // Unit conversions
  KG_TO_METRIC_TON: 0.001,
  G_TO_KG: 0.001,
  LB_TO_KG: 0.453592,
  SHORT_TON_TO_METRIC_TON: 0.907185,
  
  // Heat Contents (MMBtu per Unit) - Sourced from EPA Excel 2024
  GALLON_TO_MMBTU: {
    "Distillate Fuel Oil No. 2": 0.138,
    "Residual Fuel Oil No. 6": 0.150,
    "Kerosene": 0.135,
    "Liquefied Petroleum Gases (LPG)": 0.092,
    "Propane": 0.092,
    "Propane Gas": 0.092,
    "Biodiesel (100%)": 0.128,
    "Ethanol (100%)": 0.084,
    "Rendered Animal Fat": 0.125,
    "Vegetable Oil": 0.120
  },
  SCF_TO_MMBTU: {
    "Natural Gas": 0.001026,
    "Propane Gas": 0.002516,
    "Landfill Gas": 0.000485
  },
  TON_TO_MMBTU: {
    "Anthracite Coal": 25.09,
    "Bituminous Coal": 24.93,
    "Sub-bituminous Coal": 17.25,
    "Lignite Coal": 14.21,
    "Mixed (Commercial Sector)": 21.39,
    "Mixed (Electric Power Sector)": 19.73,
    "Mixed (Industrial Coking)": 26.28,
    "Mixed (Industrial Sector)": 22.35,
    "Coal Coke": 24.80,
    "Agricultural Byproducts": 8.25,
    "Peat": 8.00,
    "Solid Byproducts": 10.39,
    "Wood and Wood Residuals": 17.48,
    "Municipal Solid Waste": 9.95,
    "Petroleum Coke (Solid)": 30.00,
    "Plastics": 38.00,
    "Tires": 28.00
  },
  THERM_TO_MMBTU: 0.1
}
/**
 * Convert quantity from user-entered unit to the expected unit for calculation (MMBtu)
 * @param {string} fuelType
 * @param {number} quantity
 * @param {string} fromUnit
 * @param {string} toUnit
 * @returns {number}
 */
function convertToCalculationUnit(fuelType, quantity, fromUnit, toUnit) {
  if (fromUnit === toUnit) return quantity;

  // 1. Target is MMBtu (Standardization Step)
  if (toUnit === "MMBtu") {
    // Liquid fuels (gallons -> MMBtu)
    if (fromUnit === "gallons" && CONSTANTS.GALLON_TO_MMBTU[fuelType]) {
      return quantity * CONSTANTS.GALLON_TO_MMBTU[fuelType];
    }
    // Gaseous fuels (scf -> MMBtu)
    if (fromUnit === "scf" && CONSTANTS.SCF_TO_MMBTU[fuelType]) {
      return quantity * CONSTANTS.SCF_TO_MMBTU[fuelType];
    }
    // Therm -> MMBtu (Universal)
    if (fromUnit === "Therm" || fromUnit === "therm") {
      return quantity * CONSTANTS.THERM_TO_MMBTU;
    }
    // Solid fuels (short ton -> MMBtu)
    if ((fromUnit === "short ton" || fromUnit === "tons") && CONSTANTS.TON_TO_MMBTU[fuelType]) {
      return quantity * CONSTANTS.TON_TO_MMBTU[fuelType];
    }
    // Propane specific handle (if not caught by SCF above)
    if (fuelType === "Propane Gas" && fromUnit === "gallons") {
         return quantity * 0.091; // Approx MMBtu/gallon for propane
    }
  }

  // 2. Cross-Unit Conversion via MMBtu (e.g., Therm -> Gallons)
  // If target is NOT MMBtu, first convert input to MMBtu, then MMBtu to target
  try {
      // Step A: Convert Input -> MMBtu
      const quantityMMBtu = convertToCalculationUnit(fuelType, quantity, fromUnit, "MMBtu");
      
      // Step B: Convert MMBtu -> Target
      if (toUnit === "gallons" && CONSTANTS.GALLON_TO_MMBTU[fuelType]) {
          return quantityMMBtu / CONSTANTS.GALLON_TO_MMBTU[fuelType];
      }
      if (toUnit === "scf" && CONSTANTS.SCF_TO_MMBTU[fuelType]) {
          return quantityMMBtu / CONSTANTS.SCF_TO_MMBTU[fuelType];
      }
      if (toUnit === "short ton" && CONSTANTS.TON_TO_MMBTU[fuelType]) {
          return quantityMMBtu / CONSTANTS.TON_TO_MMBTU[fuelType];
      }
       if (toUnit === "Therm" || toUnit === "therm") {
          return quantityMMBtu / CONSTANTS.THERM_TO_MMBTU;
      }
  } catch (e) {
      // Ignore intermediate errors and fall through to main error
  }

  // If no conversion found, throw error with more context
  throw new Error(`Unit conversion from '${fromUnit}' to '${toUnit}' for fuel type '${fuelType}' not implemented.`);
}

/**
 * Calculate CO2 equivalent emissions from Stationary Combustion
 * 
 * Formula (from Excel row 103-125):
 * CO2e = (CO2_kg + (CH4_g/1000 * CH4_GWP) + (N2O_g/1000 * N2O_GWP)) / 1000
 * 
 * Where:
 * - CO2_kg = quantity * CO2_factor
 * - CH4_g = quantity * CH4_factor
 * - N2O_g = quantity * N2O_factor
 * 
 * @param {Object} params - Calculation parameters
 * @param {string} params.fuelType - e.g., "Natural Gas", "Diesel", etc.
 * @param {number} params.quantity - Amount of fuel consumed
 * @param {string} params.unit - Unit of measurement (e.g., "MMBtu", "gallons", "scf")
 * @param {Object} params.emissionFactors - Factors for this fuel type
 * @param {number} params.emissionFactors.co2_kg_per_unit - CO2 emissions per unit
 * @param {number} params.emissionFactors.ch4_g_per_unit - CH4 emissions per unit
 * @param {number} params.emissionFactors.n2o_g_per_unit - N2O emissions per unit
 * @param {boolean} [params.isBiomass=false] - Is this a biomass fuel?
 * @returns {Object} Calculation results
 */
function calculateStationaryCombustion(params) {
  const { fuelType, quantity, unit, emissionFactors, isBiomass = false } = params;
  // Validate inputs
  if (!fuelType || quantity === undefined || !unit || !emissionFactors) {
    throw new Error('Missing required parameters for stationary combustion calculation');
  }
  if (quantity < 0) {
    throw new Error('Quantity cannot be negative');
  }
  // Convert quantity to expected unit for calculation
  const expectedUnit = emissionFactors.unit || "MMBtu";
  let calcQuantity = quantity;
  if (unit !== expectedUnit) {
    calcQuantity = convertToCalculationUnit(fuelType, quantity, unit, expectedUnit);
  }
  // Calculate emissions
  const co2_kg = calcQuantity * emissionFactors.co2_kg_per_unit;
  const ch4_g = calcQuantity * emissionFactors.ch4_g_per_unit;
  const n2o_g = calcQuantity * emissionFactors.n2o_g_per_unit;
  // Convert to metric tons CO2e
  const ch4_co2e_mt = (ch4_g * CONSTANTS.G_TO_KG * CONSTANTS.CH4_GWP) * CONSTANTS.KG_TO_METRIC_TON;
  const n2o_co2e_mt = (n2o_g * CONSTANTS.G_TO_KG * CONSTANTS.N2O_GWP) * CONSTANTS.KG_TO_METRIC_TON;
  const co2_mt = co2_kg * CONSTANTS.KG_TO_METRIC_TON;
  // Biomass CO2 is reported separately (not included in total)
  const total_co2e_mt = isBiomass 
    ? ch4_co2e_mt + n2o_co2e_mt
    : co2_mt + ch4_co2e_mt + n2o_co2e_mt;
  const biomass_co2_mt = isBiomass ? co2_mt : 0;
  const fossil_co2_mt = isBiomass ? 0 : co2_mt;
  return {
    fuelType,
    quantity,
    unit,
    calcQuantity,
    expectedUnit,
    co2_kg,
    ch4_g,
    n2o_g,
    co2_mt: fossil_co2_mt,  // Only fossil CO2 in this field
    ch4_co2e_mt,
    n2o_co2e_mt,
    total_co2e_mt,
    biomass_co2_mt,
    isBiomass,
    breakdown: {
      co2_contribution: fossil_co2_mt,
      ch4_contribution: ch4_co2e_mt,
      n2o_contribution: n2o_co2e_mt
    }
  };
}

/**
 * Calculate CO2 equivalent emissions from Mobile Sources
 * 
 * Formula (from Excel row 119-128 for fuel, row 132-268 for CH4/N2O):
 * - CO2 from fuel: CO2_kg = fuel_usage * CO2_factor
 * - CH4/N2O based on mileage and vehicle year
 * - CO2e = (CO2_kg + CH4_g/1000*GWP + N2O_g/1000*GWP) / 1000
 * 
 * @param {Object} params - Calculation parameters
 * @param {string} params.vehicleType - e.g., "Passenger Cars - Gasoline"
 * @param {number} params.vehicleYear - Model year (used for CH4/N2O factors)
 * @param {string} params.fuelType - e.g., "Motor Gasoline", "Diesel Fuel"
 * @param {number} params.fuelUsage - Amount of fuel (gallons or scf)
 * @param {number} [params.mileage] - Miles traveled (for CH4/N2O calculation)
 * @param {Object} params.emissionFactors - Factors for this vehicle/fuel combination
 * @param {number} params.emissionFactors.co2_kg_per_gallon - CO2 per gallon/scf
 * @param {number} params.emissionFactors.ch4_g_per_mile - CH4 per mile (year-specific)
 * @param {number} params.emissionFactors.n2o_g_per_mile - N2O per mile (year-specific)
 * @param {number} [params.biodieselPercent=0] - % biodiesel in fuel (default 0)
 * @param {number} [params.ethanolPercent=0] - % ethanol in fuel (default 0)
 * @returns {Object} Calculation results
 */
function calculateMobileSources(params) {
  const { 
    vehicleType, 
    vehicleYear, 
    fuelType, 
    fuelUsage, 
    mileage = 0, 
    emissionFactors,
    biodieselPercent = 0,
    ethanolPercent = 0
  } = params;
  
  // Validate inputs
  if (!vehicleType || !fuelType || fuelUsage === undefined || !emissionFactors) {
    throw new Error('Missing required parameters for mobile sources calculation');
  }
  
  if (fuelUsage < 0 || mileage < 0) {
    throw new Error('Fuel usage and mileage cannot be negative');
  }
  
  // Calculate CO2 from fuel consumption
  // For biofuels, only non-biogenic portion counts
  const fossil_fuel_fraction = 1 - ((biodieselPercent + ethanolPercent) / 100);
  const co2_kg = fuelUsage * emissionFactors.co2_kg_per_gallon * fossil_fuel_fraction;
  
  // Calculate biogenic CO2 (reported separately)
  const biogenic_fraction = (biodieselPercent + ethanolPercent) / 100;
  const biogenic_co2_kg = fuelUsage * emissionFactors.co2_kg_per_gallon * biogenic_fraction;
  
  // Calculate CH4 and N2O from mileage
  const ch4_g = mileage * (emissionFactors.ch4_g_per_mile || 0);
  const n2o_g = mileage * (emissionFactors.n2o_g_per_mile || 0);
  
  // Convert to metric tons CO2e
  const co2_mt = co2_kg * CONSTANTS.KG_TO_METRIC_TON;
  const ch4_co2e_mt = (ch4_g * CONSTANTS.G_TO_KG * CONSTANTS.CH4_GWP) * CONSTANTS.KG_TO_METRIC_TON;
  const n2o_co2e_mt = (n2o_g * CONSTANTS.G_TO_KG * CONSTANTS.N2O_GWP) * CONSTANTS.KG_TO_METRIC_TON;
  const biogenic_co2_mt = biogenic_co2_kg * CONSTANTS.KG_TO_METRIC_TON;
  
  const total_co2e_mt = co2_mt + ch4_co2e_mt + n2o_co2e_mt;
  
  return {
    vehicleType,
    vehicleYear,
    fuelType,
    fuelUsage,
    mileage,
    co2_kg,
    ch4_g,
    n2o_g,
    biogenic_co2_kg,
    co2_mt,
    ch4_co2e_mt,
    n2o_co2e_mt,
    biogenic_co2_mt,
    total_co2e_mt,
    breakdown: {
      co2_contribution: co2_mt,
      ch4_contribution: ch4_co2e_mt,
      n2o_contribution: n2o_co2e_mt
    }
  };
}

/**
/**
 * Calculate CO2 equivalent emissions from Refrigeration & AC Equipment (Excel parity)
 * Formula: CO2e (kg) = amount_released_kg * GWP; CO2e (mt) = CO2e_kg / 1000
 * Only use: refrigerantType, amountReleased_kg, gwp
 * @param {Object} params - Calculation parameters
 * @param {string} params.refrigerantType - e.g., "R-410A", "R-134a", "CO2"
 * @param {number} params.amountReleased_kg - Amount of refrigerant released (kg)
 * @param {Object} params.emissionFactors - Factors for this refrigerant
 * @param {number} params.emissionFactors.gwp - Global Warming Potential
 * @returns {Object} Calculation results
 */
function calculateRefrigerationAC(params) {
  const { refrigerantType, amountReleased_kg, emissionFactors } = params;
  if (!refrigerantType || amountReleased_kg === undefined || !emissionFactors) {
    throw new Error('Missing required parameters for refrigeration/AC calculation');
  }
  const co2e_kg = amountReleased_kg * emissionFactors.gwp;
  const co2e_mt = co2e_kg / 1000;
  return {
    refrigerantType,
    amountReleased_kg,
    gwp: emissionFactors.gwp,
    scope: 'scope_1',
    co2e_kg,
    total_co2e_mt: co2e_mt
  };
}

/**
 * Calculate CO2 equivalent emissions from Purchased Electricity
 * 
 * Formula: CO2e = electricity_consumption * grid_emission_factor
 * 
 * @param {Object} params - Calculation parameters
 * @param {number} params.electricityUsage_kWh - Electricity consumed in kWh
 * @param {string} params.gridRegion - Grid region/country for emission factor
 * @param {Object} params.emissionFactors - Factors for this grid region
 * @param {number} params.emissionFactors.co2e_kg_per_kWh - CO2e per kWh
 * @returns {Object} Calculation results
 */
function calculateElectricity(params) {
  const { electricityUsage_kWh, gridRegion, emissionFactors } = params;
  
  // Validate inputs
  if (electricityUsage_kWh === undefined || !gridRegion || !emissionFactors) {
    throw new Error('Missing required parameters for electricity calculation');
  }
  
  if (electricityUsage_kWh < 0) {
    throw new Error('Electricity usage cannot be negative');
  }
  
  // Calculate CO2e
  const co2e_kg = electricityUsage_kWh * emissionFactors.co2e_kg_per_kWh;
  const co2e_mt = co2e_kg * CONSTANTS.KG_TO_METRIC_TON;
  
  return {
    electricity_kwh: electricityUsage_kWh,
    gridRegion,
    emissionFactor: emissionFactors.co2e_kg_per_kWh,
    co2e_kg,
    total_co2e_mt: co2e_mt
  };
}

/**
 * Calculate CO2 equivalent emissions from Purchased Steam/Heat
 * 
 * Formula: CO2e = steam_consumption * emission_factor
 * 
 * @param {Object} params - Calculation parameters
 * @param {number} params.steamUsage_mmBtu - Steam/heat consumed in MMBtu
 * @param {Object} params.emissionFactors - Factors for steam/heat
 * @param {number} params.emissionFactors.co2e_kg_per_mmBtu - CO2e per MMBtu
 * @returns {Object} Calculation results
 */
function calculateSteam(params) {
  const { steamUsage_mmBtu, emissionFactors } = params;
  
  // Validate inputs
  if (steamUsage_mmBtu === undefined || !emissionFactors) {
    throw new Error('Missing required parameters for steam calculation');
  }
  
  if (steamUsage_mmBtu < 0) {
    throw new Error('Steam usage cannot be negative');
  }
  
  // Calculate CO2e
  const co2e_kg = steamUsage_mmBtu * emissionFactors.co2e_kg_per_mmbtu;
  const co2e_mt = co2e_kg * CONSTANTS.KG_TO_METRIC_TON;
  
  return {
    steam_mmbtu: steamUsage_mmBtu,
    emissionFactor: emissionFactors.co2e_kg_per_mmbtu,
    co2e_kg,
    total_co2e_mt: co2e_mt
  };
}

/**
 * Aggregate calculation results across multiple activities
 * 
 * @param {Array<Object>} calculationResults - Array of individual calculation results
 * @returns {Object} Aggregated results
 */
function aggregateResults(calculationResults) {
  const totals = {
    total_co2_mt: 0,
    total_ch4_co2e_mt: 0,
    total_n2o_co2e_mt: 0,
    total_co2e_mt: 0,
    total_biomass_co2_mt: 0,
    byActivityType: {},
    byScope: {
      scope_1: 0,
      scope_2: 0,
      scope_3: 0
    }
  };
  
  calculationResults.forEach(result => {
    if (result.co2_mt) totals.total_co2_mt += result.co2_mt;
    if (result.ch4_co2e_mt) totals.total_ch4_co2e_mt += result.ch4_co2e_mt;
    if (result.n2o_co2e_mt) totals.total_n2o_co2e_mt += result.n2o_co2e_mt;
    if (result.total_co2e_mt) totals.total_co2e_mt += result.total_co2e_mt;
    if (result.biomass_co2_mt) totals.total_biomass_co2_mt += result.biomass_co2_mt;
  });
  
  return totals;
}

/**
 * Calculate CO2e emissions from Waste Disposal
 * Formula: Waste Amount (tons) × Emission Factor (kg CO2e/ton) × 0.001
 */
function calculateWasteDisposal(activityData, emissionFactor) {
  const { waste_type, disposal_method, amount, amount_units } = activityData;
  const { co2e_kg_per_ton } = emissionFactor;
  
  let amountInTons = amount;
  if (amount_units?.toLowerCase() === 'short tons') {
    amountInTons = amount * CONSTANTS.SHORT_TON_TO_METRIC_TON;
  } else if (amount_units?.toLowerCase() === 'pounds' || amount_units?.toLowerCase() === 'lbs') {
    amountInTons = amount * CONSTANTS.LB_TO_KG * CONSTANTS.KG_TO_METRIC_TON;
  }
  
  const co2e_kg = amountInTons * co2e_kg_per_ton;
  const co2e_mt = co2e_kg * CONSTANTS.KG_TO_METRIC_TON;
  
  return {
    activity_type: 'waste_disposal',
    scope: 'scope_3',
    waste_type,
    disposal_method,
    amount_processed: amountInTons,
    co2e_mt: parseFloat(co2e_mt.toFixed(6)),
    total_co2e_mt: parseFloat(co2e_mt.toFixed(6))
  };
}

/**
 * Calculate CO2e emissions from Purchased Gases
 * Formula: Gas Amount (kg) × GWP × 0.001
 */
function calculatePurchasedGases(activityData, emissionFactor) {
  const { gas_type, amount_purchased, amount_units } = activityData;
  const { gwp_value } = emissionFactor;
  
  let amountInKg = amount_purchased;
  if (amount_units?.toLowerCase() === 'pounds' || amount_units?.toLowerCase() === 'lbs') {
    amountInKg = amount_purchased * CONSTANTS.LB_TO_KG;
  }
  
  const co2e_kg = amountInKg * gwp_value;
  const co2e_mt = co2e_kg * CONSTANTS.KG_TO_METRIC_TON;
  
  return {
    activity_type: 'purchased_gases',
    scope: 'scope_1',
    gas_type,
    amount_purchased: amountInKg,
    co2e_mt: parseFloat(co2e_mt.toFixed(6)),
    total_co2e_mt: parseFloat(co2e_mt.toFixed(6))
  };
}

/**
 * Calculate CO2e emissions from Business Travel (Air, Rail, Road)
 * Formula: Distance × Num Trips × Emission Factor
 */
function calculateBusinessTravel(activityData, emissionFactor) {
  const { travel_mode, distance_km, distance_miles, num_trips = 1, cabin_class, vehicle_size, flight_type } = activityData;
  const { co2e_kg_per_km, co2e_kg_per_mile } = emissionFactor;
  
  let distance = distance_km || 0;
  let ef = co2e_kg_per_km || 0;
  
  if (distance_miles && !distance_km) {
    distance = distance_miles;
    ef = co2e_kg_per_mile || co2e_kg_per_km * 1.60934;
  }
  
  const totalDistance = distance * num_trips;
  const co2e_kg = totalDistance * ef;
  const co2e_mt = co2e_kg * CONSTANTS.KG_TO_METRIC_TON;
  
  return {
    activity_type: 'business_travel',
    scope: 'scope_3',
    travel_mode,
    cabin_class,
    vehicle_size,
    flight_type,
    total_distance: totalDistance,
    num_trips,
    co2e_mt: parseFloat(co2e_mt.toFixed(6)),
    total_co2e_mt: parseFloat(co2e_mt.toFixed(6))
  };
}

/**
 * Calculate CO2e emissions from Hotel Stays
 * Formula: Num Nights × Num Rooms × Emission Factor
 */
function calculateHotelStay(activityData, emissionFactor) {
  const { hotel_category, num_nights, num_rooms = 1 } = activityData;
  const { co2e_kg_per_night } = emissionFactor;
  
  const totalNights = num_nights * num_rooms;
  const co2e_kg = totalNights * co2e_kg_per_night;
  const co2e_mt = co2e_kg * CONSTANTS.KG_TO_METRIC_TON;
  
  return {
    activity_type: 'hotel_stay',
    scope: 'scope_3',
    hotel_category,
    num_nights: totalNights,
    num_rooms,
    co2e_mt: parseFloat(co2e_mt.toFixed(6)),
    total_co2e_mt: parseFloat(co2e_mt.toFixed(6))
  };
}

/**
 * Calculate CO2e emissions from Employee Commuting
 * Formula: Distance × 2 (round trip) × Days × Commuters × EF
 */
function calculateCommuting(activityData, emissionFactor) {
  const { commute_mode, distance_per_trip_km, commute_days_per_year, num_commuters = 1, vehicle_type } = activityData;
  const { co2e_kg_per_km } = emissionFactor;
  
  const totalDistance = distance_per_trip_km * 2 * commute_days_per_year * num_commuters;
  const co2e_kg = totalDistance * co2e_kg_per_km;
  const co2e_mt = co2e_kg * CONSTANTS.KG_TO_METRIC_TON;
  
  return {
    activity_type: 'commuting',
    scope: 'scope_3',
    commute_mode,
    vehicle_type,
    total_distance_km: totalDistance,
    num_commuters,
    commute_days_per_year,
    co2e_mt: parseFloat(co2e_mt.toFixed(6)),
    total_co2e_mt: parseFloat(co2e_mt.toFixed(6))
  };
}

/**
 * Calculate CO2e emissions from Transportation & Distribution
 * Formula: Distance × Weight × Emission Factor (ton-km basis)
 */
function calculateTransportation(activityData, emissionFactor) {
  const { transport_mode, distance_km, weight_tons } = activityData;
  const { co2e_kg_per_ton_km } = emissionFactor;
  
  const tonKm = distance_km * weight_tons;
  const co2e_kg = tonKm * co2e_kg_per_ton_km;
  const co2e_mt = co2e_kg * CONSTANTS.KG_TO_METRIC_TON;
  
  return {
    activity_type: 'transportation_distribution',
    scope: 'scope_3',
    transport_mode,
    distance_km,
    weight_tons,
    ton_km: tonKm,
    co2e_mt: parseFloat(co2e_mt.toFixed(6)),
    total_co2e_mt: parseFloat(co2e_mt.toFixed(6))
  };
}

export {
  calculateStationaryCombustion,
  calculateMobileSources,
  calculateRefrigerationAC,
  calculateElectricity,
  calculateSteam,
  calculateWasteDisposal,
  calculatePurchasedGases,
  calculateBusinessTravel,
  calculateHotelStay,
  calculateCommuting,
  calculateTransportation,
  aggregateResults,
  CONSTANTS
};
