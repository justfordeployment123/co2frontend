/**
 * ========================================================================
 * EXCEL CALCULATOR DATA MAPPINGS
 * ========================================================================
 * 
 * Exact mappings from EPA Excel Calculator for auto-fill logic
 */

/**
 * Fuel State mapping for Stationary Combustion
 * Maps Fuel Combusted -> Fuel State (solid, liquid, gas)
 */
export const FUEL_STATE_MAP = {
    "Plastics": "solid",
    "Solid Byproducts": "solid",
  // Solid Fuels
  "Anthracite Coal": "solid",
  "Bituminous Coal": "solid",
  "Sub-bituminous Coal": "solid",
  "Lignite Coal": "solid",
  "Mixed (Commercial Sector)": "solid",
  "Mixed (Electric Power Sector)": "solid",
  "Mixed (Industrial Coking)": "solid",
  "Mixed (Industrial Sector)": "solid",
  "Petroleum Coke (Solid)": "solid",
  "Coal Coke": "solid",
  "Wood and Wood Residuals": "solid",
  "Municipal Solid Waste": "solid",
  "Tires": "solid",
  "Agricultural Byproducts": "solid",
  "Peat": "solid",
  
  // Gas Fuels
  "Natural Gas": "gas",
  "Propane Gas": "gas", // Updated to match Excel naming
  "Propane": "gas", // Keep safe fallback
  "Butane": "gas",
  "Ethane": "gas",
  "Fuel Gas": "gas",
  "Landfill Gas": "gas",
  
  // Liquid Fuels
  "Distillate Fuel Oil No. 1": "liquid",
  "Distillate Fuel Oil No. 2": "liquid",
  "Distillate Fuel Oil No. 4": "liquid",
  "Residual Fuel Oil No. 5": "liquid",
  "Residual Fuel Oil No. 6": "liquid",
  "Motor Gasoline": "liquid",
  "Diesel Fuel": "liquid",
  "Kerosene": "liquid",
  "Liquefied Petroleum Gases (LPG)": "liquid",  // LPG is often treated as liquid gallon in calculator
  "Biodiesel (100%)": "liquid",
  "Ethanol (100%)": "liquid",
  "Rendered Animal Fat": "liquid",
  "Vegetable Oil": "liquid"
};

/**
 * Valid units for Stationary Combustion by fuel state
 */
// Only allow units as per user request
export const COMBUSTION_UNITS_BY_STATE = {
  solid: ["short ton", "MMBtu"],
  liquid: ["gallons", "MMBtu"],
  gas: ["scf", "Therm", "MMBtu"]
};

/**
 * Valid units for Mobile Sources by vehicle type
 * CNG vehicles use "scf", everything else "gallons" (mostly)
 */
export function getMobileUnits(vehicleType) {
  if (!vehicleType) return ["gallons", "scf"]; // Default fallback
  
  // Check for CNG
  if (vehicleType.includes("CNG")) {
    return ["scf"];
  }
  
  // Default for others is gallons
  // Note: Some might actually use other units if we dig deep, but user request specifically highlighted CNG vs gal
  return ["gallons"];
}

/**
 * Get fuel state from fuel type
 */
export function getFuelState(fuelType) {
  // Normalize for common typos/case
  if (!fuelType) return "";
  const normalized = fuelType.trim().toLowerCase();
  for (const [key, value] of Object.entries(FUEL_STATE_MAP)) {
    if (key.trim().toLowerCase() === normalized) return value;
  }
  return "";
}

/**
 * Get valid units for a fuel type
 */
export function getValidUnits(fuelType) {
  const state = getFuelState(fuelType);
  // Only allow units for the detected state
  return COMBUSTION_UNITS_BY_STATE[state] || [];
}

/**
 * Get fuel type from vehicle type string
 * Maps "Passenger Cars - Gasoline" -> "Motor Gasoline", etc.
 */
export function getFuelTypeFromVehicle(vehicleType) {
  if (!vehicleType) return "";
  
  if (vehicleType.includes("Gasoline")) {
    if (vehicleType.includes("Aviation")) return "Aviation Gasoline";
    if (vehicleType.includes("Jet")) return "Kerosene-Type Jet Fuel"; // Or just "Jet Fuel" - backend expects specific strings?
    // Let's use the standard EPA types
    return "Motor Gasoline";
  }
  
  if (vehicleType.includes("Diesel")) return "Diesel Fuel";
  if (vehicleType.includes("Methanol")) return "Methanol";
  if (vehicleType.includes("Ethanol")) return "Ethanol (100%)";
  if (vehicleType.includes("CNG")) return "Compressed Natural Gas (CNG)";
  if (vehicleType.includes("LNG")) return "Liquefied Natural Gas (LNG)";
  if (vehicleType.includes("LPG")) return "Liquefied Petroleum Gases (LPG)";
  if (vehicleType.includes("Biodiesel")) return "Biodiesel (100%)";
  if (vehicleType.includes("Jet Fuel")) return "Kerosene-Type Jet Fuel";
  if (vehicleType.includes("Residual Fuel Oil")) return "Residual Fuel Oil No. 6"; // or just Residual Fuel Oil
  
  return "";
}

export default {
  FUEL_STATE_MAP,
  COMBUSTION_UNITS_BY_STATE,
  getFuelState,
  getValidUnits,
  getMobileUnits,
  getFuelTypeFromVehicle
};
