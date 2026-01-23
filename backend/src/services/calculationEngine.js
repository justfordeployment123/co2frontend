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
  SHORT_TON_TO_METRIC_TON: 0.907185
};

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
  
  // Calculate emissions
  const co2_kg = quantity * emissionFactors.co2_kg_per_unit;
  const ch4_g = quantity * emissionFactors.ch4_g_per_unit;
  const n2o_g = quantity * emissionFactors.n2o_g_per_unit;
  
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
 * Calculate CO2 equivalent emissions from Refrigeration & AC Equipment
 * 
 * Formula (from Excel row 26-30 - Material Balance Method):
 * CO2e = (Inventory_Change + Transferred_Amount + Capacity_Change) * GWP
 * 
 * Where:
 * - Inventory_Change = difference in stored gas (beginning - end of year)
 * - Transferred_Amount = purchased - sold/disposed
 * - Capacity_Change = capacity of retired units - capacity of new units
 * 
 * Result cannot be negative (minimum 0)
 * 
 * @param {Object} params - Calculation parameters
 * @param {string} params.refrigerantType - e.g., "R-410A", "R-134a", "CO2"
 * @param {number} params.inventoryChange_kg - Change in stored gas inventory
 * @param {number} params.transferredAmount_kg - Net gas transferred (purchased - sold)
 * @param {number} params.capacityChange_kg - Change in equipment capacity
 * @param {Object} params.emissionFactors - Factors for this refrigerant
 * @param {number} params.emissionFactors.gwp - Global Warming Potential
 * @returns {Object} Calculation results
 */
function calculateRefrigerationAC(params) {
  const { 
    refrigerantType, 
    inventoryChange_kg, 
    transferredAmount_kg, 
    capacityChange_kg, 
    emissionFactors 
  } = params;
  
  // Validate inputs
  if (!refrigerantType || inventoryChange_kg === undefined || 
      transferredAmount_kg === undefined || capacityChange_kg === undefined || 
      !emissionFactors) {
    throw new Error('Missing required parameters for refrigeration/AC calculation');
  }
  
  // Material balance calculation
  // In EPA method:
  // - Negative inventoryChange means we LOST refrigerant (emissions)
  // - Positive transferred means we sent away (emissions)
  // - Positive capacity change means we retired equipment (emissions)
  // Formula: Emissions = MAX(0, ABS(inventoryChange) + transferred + capacityChange)
  
  const inventory_loss_kg = inventoryChange_kg < 0 ? Math.abs(inventoryChange_kg) : 0;
  const total_emissions_kg = inventory_loss_kg + transferredAmount_kg + capacityChange_kg;
  
  // Cannot have negative emissions (per Excel formula)
  const emissions_kg = Math.max(0, total_emissions_kg);
  
  // Apply GWP to get CO2e
  const co2e_kg = emissions_kg * emissionFactors.gwp;
  const co2e_mt = co2e_kg * CONSTANTS.KG_TO_METRIC_TON;
  
  return {
    refrigerantType,
    inventoryChange_kg,
    transferredAmount_kg,
    capacityChange_kg,
    total_emissions_kg,
    refrigerant_kg: emissions_kg, // After max(0, total)
    gwp: emissionFactors.gwp,
    co2e_kg,
    total_co2e_mt: co2e_mt,
    breakdown: {
      inventory_impact: inventory_loss_kg * emissionFactors.gwp * CONSTANTS.KG_TO_METRIC_TON,
      transfer_impact: transferredAmount_kg * emissionFactors.gwp * CONSTANTS.KG_TO_METRIC_TON,
      capacity_impact: capacityChange_kg * emissionFactors.gwp * CONSTANTS.KG_TO_METRIC_TON
    }
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
