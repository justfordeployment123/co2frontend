// ========================================================================
// ACTIVITY CONTROLLER
// Handles CRUD operations for all 11 activity types
// ========================================================================

import { v4 as uuidv4 } from 'uuid';
import { queryOne, queryAll, execute } from '../utils/db.js';
import { validateActivity } from '../utils/validation.js';
import * as calculationEngine from '../services/calculationEngine.js';
import * as emissionFactorResolver from '../services/emissionFactorResolver.js';
import * as calculationStorage from '../services/calculationStorage.js';

// Helper: Get table name from activity type
function getTableName(activityType) {
  const tableMap = {
    stationary_combustion: 'stationary_combustion_activities',
    mobile_sources: 'mobile_sources_activities',
    refrigeration_ac: 'refrigeration_ac_activities', // Legacy fallback
    refrigeration_ac_material_balance: 'refrigeration_ac_activities',
    refrigeration_ac_simplified_material_balance: 'refrigeration_ac_activities',
    refrigeration_ac_screening_method: 'refrigeration_ac_activities',
    fire_suppression: 'fire_suppression_activities', // Legacy fallback
    fire_suppression_material_balance: 'fire_suppression_activities',
    fire_suppression_simplified_material_balance: 'fire_suppression_activities',
    fire_suppression_screening_method: 'fire_suppression_activities',
    purchased_gases: 'purchased_gases_activities',
    electricity: 'electricity_activities',
    steam: 'steam_activities',
    business_travel_personal_car: 'business_travel_activities',
    business_travel_rail_bus: 'business_travel_activities',
    business_travel_air: 'business_travel_activities',
    employee_commuting_personal_car: 'employee_commuting_activities',
    employee_commuting_public_transport: 'employee_commuting_activities',
    business_travel_hotel: 'business_travel_hotel',
    commuting: 'commuting_activities',
    transportation_distribution: 'transportation_distribution_activities',
    upstream_trans_dist_vehicle_miles: 'transportation_distribution_activities',
    upstream_trans_dist_ton_miles: 'transportation_distribution_activities',
    waste: 'waste_activities',
    offsets: 'offsets_activities',
  };
  return tableMap[activityType];
}

/**
 * Auto-calculate emissions for an activity after creation
 * Supports ALL 11 activity types with simplified calculations
 */
// Upstream Transportation & Distribution Factors
const UPSTREAM_FACTORS = {
  "Medium- and Heavy-duty Truck": {
    vehicle_miles: { co2: 1.3621577785002931, ch4: 0.012290472093777085 / 1000, n2o: 0.03816766782352226 / 1000 },
    ton_miles: { co2: 0.1680211153400329, ch4: 0.001471682563530259 / 1000, n2o: 0.004664956050435538 / 1000 }
  },
  "Light-Duty Truck": {
    vehicle_miles: { co2: 0.4054556726596405, ch4: 0.01107076432556 / 1000, n2o: 0.009825825 / 1000 }
  },
  "Passenger Car": {
    vehicle_miles: { co2: 0.3061310072968, ch4: 0.008986233 / 1000, n2o: 0.006013428 / 1000 }
  },
  "Rail": {
    ton_miles: { co2: 0.021893211868107464, ch4: 0.0017107647541486372 / 1000, n2o: 0.000547444721327564 / 1000 }
  },
  "Waterborne Craft": {
    ton_miles: { co2: 0.08210164452840275, ch4: 0.0325800176700011 / 1000, n2o: 0.002065450176815163 / 1000 }
  },
  "Aircraft": {
    ton_miles: { co2: 0.9048151132720826, ch4: 0, n2o: 0.027861370252691035 / 1000 }
  }
};

// Waste Emission Factors (Metric Tons CO2e / Short Ton Material)
// Note: Combusted factor often includes N2O and CO2
const WASTE_FACTORS = {
  "Aluminum Cans": { "Recycled": 0.06, "Landfilled": 0.02, "Combusted": 0.01 },
  "Aluminum Ingot": { "Recycled": 0.04, "Landfilled": 0.02, "Combusted": 0.01 },
  "Steel Cans": { "Recycled": 0.32, "Landfilled": 0.02, "Combusted": 0.01 },
  "Copper Wire": { "Recycled": 0.18, "Landfilled": 0.02, "Combusted": 0.01 },
  "Glass": { "Recycled": 0.05, "Landfilled": 0.02, "Combusted": 0.01 },
  "HDPE": { "Recycled": 0.21, "Landfilled": 0.02, "Combusted": 2.8 },
  "LDPE": { "Landfilled": 0.02, "Combusted": 2.8 },
  "PET": { "Recycled": 0.23, "Landfilled": 0.02, "Combusted": 2.05 },
  "LLDPE": { "Landfilled": 0.02, "Combusted": 2.8 },
  "PP": { "Recycled": 0.20, "Landfilled": 0.02, "Combusted": 2.8 },
  "PS": { "Landfilled": 0.02, "Combusted": 3.02 },
  "PVC": { "Landfilled": 0.02, "Combusted": 1.26 },
  "PLA": { "Landfilled": 0.02, "Combusted": 0.01, "Composted": 0.13 },
  "Corrugated Containers": { "Recycled": 0.11, "Landfilled": 1.00, "Combusted": 0.05 },
  "Magazines/Third-class mail": { "Recycled": 0.02, "Landfilled": 0.46, "Combusted": 0.05 },
  "Newspaper": { "Recycled": 0.02, "Landfilled": 0.39, "Combusted": 0.05 },
  "Office Paper": { "Recycled": 0.02, "Landfilled": 1.41, "Combusted": 0.05 },
  "Phonebooks": { "Recycled": 0.04, "Landfilled": 0.39, "Combusted": 0.05 },
  "Textbooks": { "Recycled": 0.04, "Landfilled": 1.41, "Combusted": 0.05 },
  "Dimensional Lumber": { "Landfilled": 0.17, "Combusted": 0.05 },
  "Medium-density Fiberboard": { "Landfilled": 0.07, "Combusted": 0.05 },
  "Food Waste (non-meat)": { "Landfilled": 0.67, "Combusted": 0.05, "Composted": 0.11, "Anaerobically Digested (Dry Digestate with Curing)": 0.14, "Anaerobically Digested (Wet  Digestate with Curing)": 0.11 },
  "Food Waste (meat only)": { "Landfilled": 0.69, "Combusted": 0.05, "Composted": 0.11, "Anaerobically Digested (Dry Digestate with Curing)": 0.14, "Anaerobically Digested (Wet  Digestate with Curing)": 0.11 },
  "Beef": { "Landfilled": 0.64, "Combusted": 0.05, "Composted": 0.11, "Anaerobically Digested (Dry Digestate with Curing)": 0.14, "Anaerobically Digested (Wet  Digestate with Curing)": 0.11 },
  "Poultry": { "Landfilled": 0.73, "Combusted": 0.05, "Composted": 0.11, "Anaerobically Digested (Dry Digestate with Curing)": 0.14, "Anaerobically Digested (Wet  Digestate with Curing)": 0.11 },
  "Grains": { "Landfilled": 2.06, "Combusted": 0.05, "Composted": 0.11, "Anaerobically Digested (Dry Digestate with Curing)": 0.14, "Anaerobically Digested (Wet  Digestate with Curing)": 0.11 },
  "Bread": { "Landfilled": 1.49, "Combusted": 0.05, "Composted": 0.11, "Anaerobically Digested (Dry Digestate with Curing)": 0.14, "Anaerobically Digested (Wet  Digestate with Curing)": 0.11 },
  "Fruits and Vegetables": { "Landfilled": 0.28, "Combusted": 0.05, "Composted": 0.11, "Anaerobically Digested (Dry Digestate with Curing)": 0.14, "Anaerobically Digested (Wet  Digestate with Curing)": 0.11 },
  "Dairy Products": { "Landfilled": 0.72, "Combusted": 0.05, "Composted": 0.11, "Anaerobically Digested (Dry Digestate with Curing)": 0.14, "Anaerobically Digested (Wet  Digestate with Curing)": 0.11 },
  "Yard Trimmings": { "Landfilled": 0.36, "Combusted": 0.05, "Composted": 0.14, "Anaerobically Digested (Dry Digestate with Curing)": 0.11 },
  "Grass": { "Landfilled": 0.28, "Combusted": 0.05, "Composted": 0.14, "Anaerobically Digested (Dry Digestate with Curing)": 0.09 },
  "Leaves": { "Landfilled": 0.28, "Combusted": 0.05, "Composted": 0.14, "Anaerobically Digested (Dry Digestate with Curing)": 0.12 },
  "Branches": { "Landfilled": 0.58, "Combusted": 0.05, "Composted": 0.14, "Anaerobically Digested (Dry Digestate with Curing)": 0.15 },
  "Mixed Paper (general)": { "Recycled": 0.07, "Landfilled": 0.89, "Combusted": 0.05 },
  "Mixed Paper (primarily residential)": { "Recycled": 0.07, "Landfilled": 0.86, "Combusted": 0.05 },
  "Mixed Paper (primarily from offices)": { "Recycled": 0.03, "Landfilled": 0.84, "Combusted": 0.05 },
  "Mixed Metals": { "Recycled": 0.23, "Landfilled": 0.02, "Combusted": 0.01 },
  "Mixed Plastics": { "Recycled": 0.22, "Landfilled": 0.02, "Combusted": 2.34 },
  "Mixed Recyclables": { "Recycled": 0.09, "Landfilled": 0.75, "Combusted": 0.11 },
  "Mixed Organics": { "Landfilled": 0.54, "Combusted": 0.05, "Composted": 0.13 },
  "Mixed MSW": { "Landfilled": 0.58, "Combusted": 0.43 },
  "Carpet": { "Landfilled": 0.02, "Combusted": 1.68 },
  "Desktop CPUs": { "Recycled": 0.01, "Landfilled": 0.02, "Combusted": 0.40 },
  "Portable Electronic Devices": { "Recycled": 0.02, "Landfilled": 0.02, "Combusted": 0.89 },
  "Flat-panel Displays": { "Recycled": 0.02, "Landfilled": 0.02, "Combusted": 0.74 },
  "CRT Displays": { "Landfilled": 0.02, "Combusted": 0.64 },
  "Electronic Peripherals": { "Recycled": 0.05, "Landfilled": 0.02, "Combusted": 2.23 },
  "Hard-copy Devices": { "Recycled": 0.01, "Landfilled": 0.02, "Combusted": 1.92 },
  "Mixed Electronics": { "Recycled": 0.02, "Landfilled": 0.02, "Combusted": 0.96 },
  "Clay Bricks": { "Landfilled": 0.02 },
  "Concrete": { "Recycled": 0.01, "Landfilled": 0.02 },
  "Fly Ash": { "Recycled": 0.01, "Landfilled": 0.02 },
  "Tires": { "Recycled": 0.10, "Landfilled": 0.02, "Combusted": 2.21 },
  "Asphalt Concrete": { "Recycled": 0.0035, "Landfilled": 0.02 },
  "Asphalt Shingles": { "Recycled": 0.03, "Landfilled": 0.02, "Combusted": 0.70 },
  "Drywall": { "Landfilled": 0.02 },
  "Fiberglass Insulation": { "Recycled": 0.05, "Landfilled": 0.02 },
  "Structural Steel": { "Recycled": 0.04, "Landfilled": 0.02 },
  "Vinyl Flooring": { "Landfilled": 0.02, "Combusted": 0.29 },
  "Wood Flooring": { "Landfilled": 0.18, "Combusted": 0.08 }
};

export async function autoCalculateEmissions(activityType, activityData, activityId, reportingPeriodId, userId) {
  try {
    let calculationResult = null;
    let emissionFactors = { version: 'EPA2024', source: 'SIMPLIFIED' };

    // GWP Map from Excel (IPCC AR5, 100-yr) to ensure parity with frontend
    const GWP_MAP = {
      'Carbon dioxide': 1,
      'Methane': 28,
      'Nitrous oxide': 265,
      'HFC-23': 12400,
      'HFC-32': 677,
      'HFC-41': 116,
      'HFC-125': 3170,
      'HFC-134': 1120,
      'HFC-134a': 1300,
      'HFC-143': 328,
      'HFC-143a': 4800,
      'HFC-152': 16,
      'HFC-152a': 138,
      'HFC-161': 4,
      'HFC-227ea': 3350,
      'HFC-236cb': 1210,
      'HFC-236ea': 1330,
      'HFC-236fa': 8060,
      'HFC-245ca': 716,
      'HFC-245fa': 858,
      'HFC-365mfc': 804,
      'HFC-43-10mee': 1650,
      'Sulfur hexafluoride': 23500,
      'Nitrogen trifluoride': 16100,
      'PFC-14': 6630,
      'PFC-116': 11100,
      'PFC-218': 8900,
      'PFC-318': 9540,
      'PFC-31-10': 9200,
      'PFC-41-12': 8550,
      'PFC-51-14': 7910,
      'PFC-91-18': 7190,
      'R-401A': 18,
      'R-401B': 15,
      'R-401C': 21,
      'R-402A': 1902,
      'R-402B': 1205,
      'R-403B': 3471,
      'R-404A': 3943,
      'R-406A': 0,
      'R-407A': 1923,
      'R-407B': 2547,
      'R-407C': 1624,
      'R-407D': 1487,
      'R-408A': 2430,
      'R-409A': 0,
      'R-410A': 1924,
      'R-410B': 2048,
      'R-411A': 15,
      'R-411B': 4,
      'R-414A': 0,
      'R-414B': 0,
      'R-417A': 2127,
      'R-422A': 2847,
      'R-422D': 2473,
      'R-424A': 3104,
      'R-426A': 1371,
      'R-428A': 3417,
      'R-434A': 3075,
      'R-507A': 3985,
      'R-508A': 11607,
      'R-508B': 11698
    };

    const SCOPE3_FACTORS = {
      // Road (Per Vehicle-Mile)
      "Passenger Car": { co2: 0.306131, ch4: 0.008986, n2o: 0.006013 },
      "Light-Duty Truck": { co2: 0.405456, ch4: 0.011071, n2o: 0.009826 },
      "Motorcycle": { co2: 0.375635, ch4: 0.090645, n2o: 0.019212 },

      // Rail/Bus (Per Passenger-Mile)
      "Intercity Rail - Northeast Corridor": { co2: 0.058, ch4: 0.0055, n2o: 0.0007 },
      "Intercity Rail - Other Routes": { co2: 0.15, ch4: 0.0117, n2o: 0.0038 },
      "Intercity Rail - National Average": { co2: 0.113, ch4: 0.0092, n2o: 0.0026 },
      "Commuter Rail": { co2: 0.1333116, ch4: 0.0105219, n2o: 0.0026102 },
      "Transit Rail (i.e. Subway, Tram)": { co2: 0.093069, ch4: 0.007462, n2o: 0.0010176 },
      "Bus": { co2: 0.0707076, ch4: 0.0050304, n2o: 0.0021261 },

      // Air (Per Passenger-Mile)
      "Air Short Haul (< 300 miles)": { co2: 0.206929, ch4: 0.006431, n2o: 0.006582 },
      "Air Medium Haul (>= 300 miles, < 2300 miles)": { co2: 0.129260, ch4: 0.000643, n2o: 0.004100 },
      "Air Long Haul (>= 2300 miles)": { co2: 0.162556, ch4: 0.000643, n2o: 0.005179 }
    };

    // Helper for GWP lookup
    const getGWP = async (gas) => {
        // 1. Try static map (Excel parity)
        if (GWP_MAP[gas]) return GWP_MAP[gas];

        // 2. Try DB lookup
        try {
            const d = await emissionFactorResolver.getRefrigerantGWP(gas, 'GHG_PROTOCOL');
            return d.gwp || 0;
        } catch (e) {
            console.warn(`GWP not found for ${gas}:`, e.message);
            return 0;
        }
    };
    
    // SCOPE 1: Stationary Combustion
    if (activityType === 'stationary_combustion') {
      emissionFactors = await emissionFactorResolver.getStationaryFuelFactors(
        activityData.fuel_combusted,
        'GHG_PROTOCOL'
      );
      
      calculationResult = calculationEngine.calculateStationaryCombustion({
        fuelType: activityData.fuel_combusted,
        quantity: parseFloat(activityData.quantity_combusted),
        unit: activityData.units,
        emissionFactors,
        isBiomass: activityData.is_biomass || false
      });
    }
    
    // SCOPE 1: Mobile Sources
    else if (activityType === 'mobile_sources') {
      let fuelType = activityData.fuel_type;

      // Auto-detect fuel type from vehicle string if not provided
      if (!fuelType && activityData.vehicle_type) {
        const vType = activityData.vehicle_type.toLowerCase();
        if (vType.includes('diesel')) fuelType = 'Diesel';
        else if (vType.includes('gasoline')) fuelType = 'Gasoline';
        else if (vType.includes('cng') || vType.includes('natural gas')) fuelType = 'CNG';
        else if (vType.includes('lpg') || vType.includes('propane')) fuelType = 'LPG';
        else if (vType.includes('lng')) fuelType = 'LNG';
        else if (vType.includes('ethanol')) fuelType = 'Ethanol';
        else if (vType.includes('methanol')) fuelType = 'Methanol';
        else if (vType.includes('biodiesel')) fuelType = 'Biodiesel';
        else if (vType.includes('jet fuel')) fuelType = 'Jet Fuel';
        else if (vType.includes('aviation gasoline')) fuelType = 'Aviation Gasoline';
        else if (vType.includes('residual fuel oil')) fuelType = 'Residual Fuel Oil';
        else fuelType = 'Gasoline'; // Default fallback
      }

      emissionFactors = await emissionFactorResolver.getMobileSourceFactors(
        activityData.vehicle_type,
        activityData.vehicle_year || 2021, 
        fuelType, 
        'GHG_PROTOCOL'
      );
      
      calculationResult = calculationEngine.calculateMobileSources({
        vehicleType: activityData.vehicle_type,
        vehicleYear: activityData.vehicle_year || 2021,
        fuelType: fuelType,
        fuelUsage: parseFloat(activityData.fuel_usage),
        unit: activityData.units,
        emissionFactors
      });
    }
    
    // SCOPE 1: Refrigeration & AC (Material Balance)
    else if (activityType === 'refrigeration_ac_material_balance' || (activityType === 'refrigeration_ac' && activityData.inventory_change)) {
      const gwp = await getGWP(activityData.refrigerant_type);
      const invChange = parseFloat(activityData.inventory_change) || 0;
      const transferred = parseFloat(activityData.transferred_amount) || 0;
      const capChange = parseFloat(activityData.capacity_change) || 0;
      
      const emissionsKg = (invChange + transferred + capChange) * gwp;
      const co2e_mt = emissionsKg / 1000;
      
      calculationResult = {
        co2_kg: 0, ch4_g: 0, n2o_g: 0, total_co2e_mt: co2e_mt,
        refrigerantType: activityData.refrigerant_type, gwp,
        inventoryChange: invChange, transferredAmount: transferred, capacityChange: capChange,
        method: 'MATERIAL_BALANCE',
        scope: 'scope_1'
      };
    }
    // SCOPE 1: Refrigeration & AC (Simplified Balance)
    else if (activityType === 'refrigeration_ac_simplified_material_balance') {
      const gwp = await getGWP(activityData.refrigerant_type);
      const newCharge = parseFloat(activityData.new_units_charge) || 0;
      const newCap = parseFloat(activityData.new_units_capacity) || 0;
      const recharge = parseFloat(activityData.existing_units_recharge) || 0;
      const dispCap = parseFloat(activityData.disposed_units_capacity) || 0;
      const dispRec = parseFloat(activityData.disposed_units_recovered) || 0;

      const emissionsKg = (newCharge - newCap + recharge + dispCap - dispRec) * gwp;
      const co2e_mt = emissionsKg / 1000;

      calculationResult = {
        co2_kg: 0, ch4_g: 0, n2o_g: 0, total_co2e_mt: co2e_mt,
        refrigerantType: activityData.refrigerant_type, gwp,
        method: 'SIMPLIFIED_MATERIAL_BALANCE',
        scope: 'scope_1'
      };
    }
    // SCOPE 1: Refrigeration & AC (Screening Method)
    else if (activityType === 'refrigeration_ac_screening_method') {
      const gwp = await getGWP(activityData.refrigerant_type);
      const newCharge = parseFloat(activityData.new_units_charge) || 0;
      const opCap = parseFloat(activityData.operating_units_capacity) || 0;
      const dispCap = parseFloat(activityData.disposed_units_capacity) || 0;
      
      // Screening factors by equipment type (k_install, k_op, k_disp)
      // Source: EPA/GHG Protocol Standard Screening Factors
      const SCREENING_FACTORS = {
        'Domestic Refrigeration': { k_install: 0.01, k_op: 0.005, k_disp: 0.24 },
        'Stand-Alone Commercial': { k_install: 0.03, k_op: 0.15, k_disp: 0.15 },
        'Medium/Large Commercial': { k_install: 0.03, k_op: 0.225, k_disp: 0.15 },
        'Transport Refrigeration': { k_install: 0.005, k_op: 0.275, k_disp: 0.15 },
        'Industrial Refrigeration': { k_install: 0.03, k_op: 0.16, k_disp: 0.15 },
        'Chillers': { k_install: 0.005, k_op: 0.085, k_disp: 0.15 },
        'Residential/Commercial A/C': { k_install: 0.005, k_op: 0.05, k_disp: 0.15 },
        'Mobile A/C': { k_install: 0.005, k_op: 0.20, k_disp: 0.15 },
        // Fallbacks
        'Maritime A/C Units': { k_install: 0.005, k_op: 0.20, k_disp: 1.0 },
        'Railway A/C Units': { k_install: 0.005, k_op: 0.20, k_disp: 1.0 },
        'Buses A/C Units': { k_install: 0.005, k_op: 0.20, k_disp: 1.0 },
        'Other Mobile A/C Units': { k_install: 0.005, k_op: 0.20, k_disp: 1.0 }
      };

      const factors = SCREENING_FACTORS[activityData.equipment_type] || { k_install: 0.01, k_op: 0.15, k_disp: 1.0 };
      const { k_install, k_op, k_disp } = factors;
      
      const emissionsKg = ((newCharge * k_install) + (opCap * k_op) + (dispCap * k_disp)) * gwp;
      const co2e_mt = emissionsKg / 1000;

      calculationResult = {
        co2_kg: 0, ch4_g: 0, n2o_g: 0, total_co2e_mt: co2e_mt,
        refrigerantType: activityData.refrigerant_type, equipmentType: activityData.equipment_type, gwp,
        method: 'SCREENING_METHOD',
        scope: 'scope_1'
      };
    }

    // SCOPE 1: Refrigeration & AC (Legacy - if used)
    // SCOPE 1: Fire Suppression - Material Balance Method
    else if (activityType === 'fire_suppression_material_balance') {
      const suppressantType = activityData.suppressant_type;
      const inventoryChangeLb = parseFloat(activityData.inventory_change_lb) || 0;
      const transferredAmountLb = parseFloat(activityData.transferred_amount_lb) || 0;
      const capacityChangeLb = parseFloat(activityData.capacity_change_lb) || 0;
      
      const gwp = await getGWP(suppressantType);
      
      // Formula per Excel Table 1: Emissions (lb) = (Inventory Change + Transferred + Capacity Change) × GWP
      const emissionsLb = (inventoryChangeLb + transferredAmountLb + capacityChangeLb) * gwp;
      const emissionsKg = emissionsLb * 0.453592;
      const co2e_mt = emissionsKg / 1000;
      
      calculationResult = {
        co2_kg: 0,
        ch4_g: 0,
        n2o_g: 0,
        total_co2e_mt: co2e_mt,
        suppressantType: suppressantType,
        gwp: gwp,
        inventoryChange_lb: inventoryChangeLb,
        transferredAmount_lb: transferredAmountLb,
        capacityChange_lb: capacityChangeLb,
        emissions_kg: emissionsKg,
        method: 'MATERIAL_BALANCE',
        scope: 'scope_1'
      };
    }
    
    // SCOPE 1: Fire Suppression - Simplified Material Balance
    else if (activityType === 'fire_suppression_simplified_material_balance') {
      const suppressantType = activityData.suppressant_type;
      const newUnitsChargeLb = parseFloat(activityData.new_units_charge_lb) || 0;
      const newUnitsCapacityLb = parseFloat(activityData.new_units_capacity_lb) || 0;
      const existingUnitsRechargeLb = parseFloat(activityData.existing_units_recharge_lb) || 0;
      const disposedUnitsCapacityLb = parseFloat(activityData.disposed_units_capacity_lb) || 0;
      const disposedUnitsRecoveredLb = parseFloat(activityData.disposed_units_recovered_lb) || 0;
      
      const gwp = await getGWP(suppressantType);
      
      // Formula per Excel Table 2: Emissions (lb) = (Charge - New Capacity + Recharge + Disposed Capacity - Recovered) × GWP
      const emissionsLb = (newUnitsChargeLb - newUnitsCapacityLb + existingUnitsRechargeLb + disposedUnitsCapacityLb - disposedUnitsRecoveredLb) * gwp;
      const emissionsKg = emissionsLb * 0.453592;
      const co2e_mt = emissionsKg / 1000;
      
      calculationResult = {
        co2_kg: 0,
        ch4_g: 0,
        n2o_g: 0,
        total_co2e_mt: co2e_mt,
        suppressantType: suppressantType,
        gwp: gwp,
        newUnitsCharge_lb: newUnitsChargeLb,
        newUnitsCapacity_lb: newUnitsCapacityLb,
        existingUnitsRecharge_lb: existingUnitsRechargeLb,
        disposedUnitsCapacity_lb: disposedUnitsCapacityLb,
        disposedUnitsRecovered_lb: disposedUnitsRecoveredLb,
        emissions_kg: emissionsKg,
        method: 'SIMPLIFIED_MATERIAL_BALANCE',
        scope: 'scope_1'
      };
    }
    
    // SCOPE 1: Fire Suppression - Screening Method
    else if (activityType === 'fire_suppression_screening_method') {
      const suppressantType = activityData.suppressant_type;
      const equipmentType = activityData.equipment_type; // 'Fixed' or 'Portable'
      const unitCapacityLb = parseFloat(activityData.unit_capacity_lb) || 0;
      
      const gwp = await getGWP(suppressantType);
      
      // Leak rates per Excel
      const leakRate = equipmentType === 'Fixed' ? 0.035 : 0.025; // 3.5% for Fixed, 2.5% for Portable
      
      // Formula per Excel Table 3: Emissions (lb) = GWP × Leak Rate × Capacity
      const emissionsLb = gwp * leakRate * unitCapacityLb;
      const emissionsKg = emissionsLb * 0.453592;
      const co2e_mt = emissionsKg / 1000;
      
      calculationResult = {
        co2_kg: 0,
        ch4_g: 0,
        n2o_g: 0,
        total_co2e_mt: co2e_mt,
        suppressantType: suppressantType,
        gwp: gwp,
        equipmentType: equipmentType,
        unitCapacity_lb: unitCapacityLb,
        leakRate: leakRate,
        emissions_kg: emissionsKg,
        method: 'SCREENING_METHOD',
        scope: 'scope_1'
      };
    }
    // SCOPE 1: Fire Suppression (Generic/Legacy)
    else if (activityType === 'fire_suppression') {
      const suppressantType = activityData.suppressant_type;
      const gwp = await getGWP(suppressantType);
      const amount = parseFloat(activityData.amount_used) || 0;
      const unit = activityData.amount_units || 'kg';
      
      const multiplier = unit === 'lb' ? 0.453592 : 1;
      const emissionsKg = amount * multiplier * gwp;
      const co2e_mt = emissionsKg / 1000;

      calculationResult = {
        co2_kg: 0, ch4_g: 0, n2o_g: 0, total_co2e_mt: co2e_mt,
        suppressantType, gwp,
        amount_used: amount, amount_units: unit,
        method: 'DEFAULT',
        scope: 'scope_1'
      };
    }
    // SCOPE 1: Refrigeration & AC (Generic/Legacy)
    else if (activityType === 'refrigeration_ac') {
      const refrigerantType = activityData.refrigerant_type;
      const gwp = await getGWP(refrigerantType);
      const amount = parseFloat(activityData.amount_released) || 0;
      const unit = activityData.amount_units || 'kg';
      
      const multiplier = unit === 'lb' ? 0.453592 : 1;
      const emissionsKg = amount * multiplier * gwp;
      const co2e_mt = emissionsKg / 1000;

      calculationResult = {
        co2_kg: 0, ch4_g: 0, n2o_g: 0, total_co2e_mt: co2e_mt,
        refrigerantType, gwp,
        amount_released: amount, amount_units: unit,
        method: 'DEFAULT',
        scope: 'scope_1'
      };
    }
    
    // SCOPE 1: Purchased Gases (GWP-based)
    else if (activityType === 'purchased_gases') {
      // Always expect amount_purchased in lb from frontend, convert to kg for calculation
      const amountLb = parseFloat(activityData.amount_purchased) || 0;
      const LB_TO_KG = 0.453592;
      const amountKg = amountLb * LB_TO_KG;
      try {
        const gwpData = await emissionFactorResolver.getPurchasedGasGWP(activityData.gas_type);
        const gwp = gwpData.gwp_value;
        const co2e_lb = amountLb * gwp;
        const co2e_kg = amountKg * gwp;
        const co2e_mt = co2e_kg / 1000;
        calculationResult = {
          co2_kg: 0,
          ch4_g: 0,
          n2o_g: 0,
          total_co2e_mt: co2e_mt,
          gasType: activityData.gas_type,
          gwp: gwp,
          amountPurchased_lb: amountLb,
          amountPurchased_kg: amountKg,
          co2e_lb: co2e_lb,
          co2e_kg: co2e_kg
        };
      } catch (error) {
        // Fallback to hardcoded GWP if lookup fails
        console.warn('[AutoCalculate] Gas GWP lookup failed, using fallback:', error.message);
        const gwp = getGasGWP(activityData.gas_type);
        const co2e_lb = amountLb * gwp;
        const co2e_kg = amountKg * gwp;
        const co2e_mt = co2e_kg / 1000;
        calculationResult = {
          co2_kg: 0,
          ch4_g: 0,
          n2o_g: 0,
          total_co2e_mt: co2e_mt,
          gasType: activityData.gas_type,
          gwp: gwp,
          amountPurchased_lb: amountLb,
          amountPurchased_kg: amountKg,
          co2e_lb: co2e_lb,
          co2e_kg: co2e_kg,
          note: 'Fallback GWP used - factor lookup failed'
        };
      }
    }
    
    // SCOPE 2: Electricity (strict Excel/DB parity)
    // SCOPE 2: Electricity (Calculates both Location & Market based)
    else if (activityType === 'electricity') {
      const kWh = parseFloat(activityData.kwh_purchased) || 0;
      const gridRegion = activityData.facility_location || 'US Average';

      // 1. Calculate Location-Based (eGRID)
      let egridFactors = { co2: 0, ch4: 0, n2o: 0, source: 'DEFAULT' };
      try {
        const factors = await emissionFactorResolver.getElectricityFactors(gridRegion, 'GHG_PROTOCOL');
        egridFactors = {
          co2: parseFloat(factors.co2_lb_per_mwh) || 0,
          ch4: parseFloat(factors.ch4_lb_per_mwh) || 0,
          n2o: parseFloat(factors.n2o_lb_per_mwh) || 0,
          source: factors.source || 'eGRID2022'
        };
      } catch (error) {
        egridFactors = { co2: 823.149, ch4: 0.066, n2o: 0.009, source: 'FALLBACK_US_AVG' };
      }

      const kg_per_lb = 0.45359;
      const lbCO2_loc = (kWh / 1000) * egridFactors.co2;
      const lbCH4_loc = (kWh / 1000) * egridFactors.ch4;
      const lbN2O_loc = (kWh / 1000) * egridFactors.n2o;
      const loc_co2e_mt = (lbCO2_loc + (lbCH4_loc * 28) + (lbN2O_loc * 265)) * kg_per_lb / 1000;

      // 2. Calculate Market-Based
      const userCO2 = parseFloat(activityData.market_based_co2_factor);
      const userCH4 = parseFloat(activityData.market_based_ch4_factor);
      const userN2O = parseFloat(activityData.market_based_n2o_factor);

      // If user provided market factors, use them. Else fallback to eGRID (Location-based).
      const hasMarketFactors = !isNaN(userCO2);
      const mktFactors = hasMarketFactors 
        ? { co2: userCO2, ch4: userCH4 || 0, n2o: userN2O || 0 }
        : { ...egridFactors };

      const lbCO2_mkt = (kWh / 1000) * mktFactors.co2;
      const lbCH4_mkt = (kWh / 1000) * mktFactors.ch4;
      const lbN2O_mkt = (kWh / 1000) * mktFactors.n2o;
      const mkt_co2e_mt = (lbCO2_mkt + (lbCH4_mkt * 28) + (lbN2O_mkt * 265)) * kg_per_lb / 1000;

      calculationResult = {
        location_based: {
          co2_kg: lbCO2_loc * kg_per_lb,
          ch4_g: lbCH4_loc * kg_per_lb * 1000,
          n2o_g: lbN2O_loc * kg_per_lb * 1000,
          total_co2e_mt: loc_co2e_mt,
          factors: egridFactors
        },
        market_based: {
          co2_kg: lbCO2_mkt * kg_per_lb,
          ch4_g: lbCH4_mkt * kg_per_lb * 1000,
          n2o_g: lbN2O_mkt * kg_per_lb * 1000,
          total_co2e_mt: mkt_co2e_mt,
          factors: mktFactors,
          is_fallback: !hasMarketFactors
        },
        // Primary result for legacy columns (using location-based as default)
        total_co2e_mt: loc_co2e_mt,
        co2_kg: lbCO2_loc * kg_per_lb,
        ch4_g: lbCH4_loc * kg_per_lb * 1000,
        n2o_g: lbN2O_loc * kg_per_lb * 1000,
        electricity_kwh: kWh,
        gridRegion: gridRegion,
        source_id: activityData.source_id,
        source_description: activityData.source_description
      };
    }

    // SCOPE 2: Steam (Calculates both Location & Market based)
    else if (activityType === 'steam') {
      const mmBtu = parseFloat(activityData.amount_purchased) || 0;
      const fuelType = activityData.fuel_type || 'Natural Gas';
      const efficiency = (parseFloat(activityData.boiler_efficiency) || 80) / 100;

      // 1. Calculate Location-Based
      let fuelFactors = { co2_kg: 53.06, ch4_g: 1.0, n2o_g: 0.1 };
      try {
        const factors = await emissionFactorResolver.getStationaryFuelFactors(fuelType, 'GHG_PROTOCOL');
        fuelFactors = { co2_kg: factors.co2_kg_per_unit || 53.06, ch4_g: factors.ch4_g_per_unit || 1.0, n2o_g: factors.n2o_g_per_unit || 0.1 };
      } catch (error) {}

      // Input factors (Location-Based)
      const lCO2 = parseFloat(activityData.location_based_co2_factor);
      const lCH4 = parseFloat(activityData.location_based_ch4_factor);
      const lN2O = parseFloat(activityData.location_based_n2o_factor);

      let locFactors = { ...fuelFactors };
      let locMethod = 'Fuel-based Default';
      
      if (!isNaN(lCO2)) {
        locFactors = { co2_kg: lCO2, ch4_g: lCH4 || 0, n2o_g: lN2O || 0 };
        locMethod = 'User-provided (Location)';
      }

      // Per Excel formula, we always divide by efficiency: Factor * mmBtu / efficiency
      const co2_kg_loc = (mmBtu * locFactors.co2_kg) / efficiency;
      const ch4_g_loc = (mmBtu * locFactors.ch4_g) / efficiency;
      const n2o_g_loc = (mmBtu * locFactors.n2o_g) / efficiency;
      const loc_co2e_mt = (co2_kg_loc + (ch4_g_loc / 1000 * 28) + (n2o_g_loc / 1000 * 265)) / 1000;

      // 2. Calculate Market-Based
      const mCO2 = parseFloat(activityData.market_based_co2_factor);
      const mCH4 = parseFloat(activityData.market_based_ch4_factor);
      const mN2O = parseFloat(activityData.market_based_n2o_factor);
      
      const hasMarketFactors = !isNaN(mCO2);
      const mktFactors = hasMarketFactors 
        ? { co2_kg: mCO2, ch4_g: mCH4 || 0, n2o_g: mN2O || 0 }
        : { ...locFactors };

      // Market-based also divides by efficiency if using fuel factors or provided factors
      let co2_kg_mkt, ch4_g_mkt, n2o_g_mkt;
      if (hasMarketFactors) {
         co2_kg_mkt = (mmBtu * mktFactors.co2_kg) / efficiency;
         ch4_g_mkt = (mmBtu * mktFactors.ch4_g) / efficiency;
         n2o_g_mkt = (mmBtu * mktFactors.n2o_g) / efficiency;
      } else {
         // If fallback to locFactors, they are already divided above
         co2_kg_mkt = co2_kg_loc;
         ch4_g_mkt = ch4_g_loc;
         n2o_g_mkt = n2o_g_loc;
      }
      const mkt_co2e_mt = (co2_kg_mkt + (ch4_g_mkt / 1000 * 28) + (n2o_g_mkt / 1000 * 265)) / 1000;

      calculationResult = {
        location_based: {
          co2_kg: co2_kg_loc,
          ch4_g: ch4_g_loc,
          n2o_g: n2o_g_loc,
          total_co2e_mt: loc_co2e_mt,
          method: locMethod,
          factors: locFactors
        },
        market_based: {
          co2_kg: co2_kg_mkt,
          ch4_g: ch4_g_mkt,
          n2o_g: n2o_g_mkt,
          total_co2e_mt: mkt_co2e_mt,
          is_fallback: !hasMarketFactors,
          factors: mktFactors
        },
        // Primary result (location-based)
        total_co2e_mt: loc_co2e_mt,
        co2_kg: co2_kg_loc,
        ch4_g: ch4_g_loc,
        n2o_g: n2o_g_loc,
        mmbtu_purchased: mmBtu,
        fuelType: fuelType,
        efficiency: efficiency,
        source_id: activityData.source_id,
        source_description: activityData.source_description
      };
    }
    
    // SCOPE 3: Unified Business Travel & Employee Commuting
    else if (activityType.startsWith('business_travel_') && activityType !== 'business_travel_hotel' || activityType.startsWith('employee_commuting_')) {
      const miles = parseFloat(activityData.miles_traveled) || 0;
      const vehicleType = activityData.vehicle_type;
      const factors = SCOPE3_FACTORS[vehicleType] || { co2: 0, ch4: 0, n2o: 0 };
      
      const co2_kg = miles * factors.co2;
      const ch4_g = miles * factors.ch4;
      const n2o_g = miles * factors.n2o;
      
      const ch4_co2e_mt = (ch4_g / 1000 * 28) / 1000;
      const n2o_co2e_mt = (n2o_g / 1000 * 265) / 1000;
      const co2_mt = co2_kg / 1000;
      const total_co2e_mt = co2_mt + ch4_co2e_mt + n2o_co2e_mt;
      
      calculationResult = {
        co2_kg,
        ch4_g,
        n2o_g,
        total_co2e_mt,
        miles_traveled: miles,
        vehicle_type: vehicleType,
        factorsUsed: factors,
        source_id: activityData.source_id,
        source_description: activityData.source_description
      };
    }
    
    // SCOPE 3: Business Travel Hotel (Keep separate for now as it uses different logic)
    else if (activityType === 'business_travel_hotel') {
      const numNights = parseFloat(activityData.num_nights) || 0;
      const emissionFactor = 26.2; // Default per night
      const co2e_kg = numNights * emissionFactor;
      const co2e_mt = co2e_kg / 1000;
      
      calculationResult = {
        co2_kg: co2e_kg,
        ch4_g: 0,
        n2o_g: 0,
        total_co2e_mt: co2e_mt,
        num_nights: numNights,
        emissionFactor: emissionFactor
      };
    }
    
    // SCOPE 3: Upstream Transportation & Distribution (Vehicle-Miles)
    else if (activityType === 'upstream_trans_dist_vehicle_miles' || activityType === 'transportation_distribution') {
      const miles = parseFloat(activityData.vehicle_miles) || parseFloat(activityData.distance_km) || 0;
      const vehicleType = activityData.vehicle_type || 'Medium- and Heavy-duty Truck';
      const factors = UPSTREAM_FACTORS[vehicleType]?.vehicle_miles || { co2: 0, ch4: 0, n2o: 0 };
      
      const co2_kg = miles * factors.co2;
      const ch4_g = miles * (factors.ch4 * 1000); // Factor stored as g/mile
      const n2o_g = miles * (factors.n2o * 1000);
      
      const ch4_co2e_mt = (ch4_g / 1000 * 28) / 1000;
      const n2o_co2e_mt = (n2o_g / 1000 * 265) / 1000;
      const co2_mt = co2_kg / 1000;
      const total_co2e_mt = co2_mt + ch4_co2e_mt + n2o_co2e_mt;
      
      calculationResult = {
        co2_kg,
        ch4_g,
        n2o_g,
        total_co2e_mt,
        vehicle_miles: miles,
        vehicle_type: vehicleType,
        calculation_method: 'VEHICLE_MILES',
        source_id: activityData.source_id,
        source_description: activityData.source_description
      };
    }

    // SCOPE 3: Upstream Transportation & Distribution (Ton-Miles)
    else if (activityType === 'upstream_trans_dist_ton_miles') {
      const tonMiles = parseFloat(activityData.short_ton_miles) || 0;
      const vehicleType = activityData.vehicle_type || 'Medium- and Heavy-Duty Truck';
      const factors = UPSTREAM_FACTORS[vehicleType]?.ton_miles || { co2: 0, ch4: 0, n2o: 0 };
      
      const co2_kg = tonMiles * factors.co2;
      const ch4_g = tonMiles * factors.ch4;
      const n2o_g = tonMiles * factors.n2o;
      
      const ch4_co2e_mt = (ch4_g / 1000 * 28) / 1000;
      const n2o_co2e_mt = (n2o_g / 1000 * 265) / 1000;
      const co2_mt = co2_kg / 1000;
      const total_co2e_mt = co2_mt + ch4_co2e_mt + n2o_co2e_mt;
      
      calculationResult = {
        co2_kg,
        ch4_g,
        n2o_g,
        total_co2e_mt,
        short_ton_miles: tonMiles,
        vehicle_type: vehicleType,
        calculation_method: 'TON_MILES',
        source_id: activityData.source_id,
        source_description: activityData.source_description
      };
    }
    
    // SCOPE 3: Waste Generated in Operations
    else if (activityType === 'waste') {
      const weight = parseFloat(activityData.amount) || parseFloat(activityData.weight) || 0; // Supports amount or weight
      const unit = activityData.units || activityData.amount_units || activityData.unit || 'short ton';
      const wasteMaterial = activityData.waste_type || activityData.waste_material;
      const disposalMethod = activityData.disposal_method;
      
      // Convert to Short Tons (as factors are per Short Ton)
      let shortTons = 0;
      if (unit === 'short ton') shortTons = weight;
      else if (unit === 'metric ton') shortTons = weight * 1.10231;
      else if (unit === 'kg') shortTons = weight * 0.00110231;
      else if (unit === 'lb') shortTons = weight / 2000;
      else shortTons = weight; // Fallback

      // Lookup Factor
      // WASTE_FACTORS keys might need mapping if frontend sends different strings.
      // Assuming strict frontend match.
      const materialFactors = WASTE_FACTORS[wasteMaterial] || {};
      const factor = materialFactors[disposalMethod] || 0; // Metric Tons CO2e / Short Ton
      
      const total_co2e_mt = shortTons * factor;
      
      // Breakdown not available in simple factor, assuming all is CO2e total
      calculationResult = {
        co2_kg: total_co2e_mt * 1000,
        ch4_g: 0,
        n2o_g: 0,
        total_co2e_mt: total_co2e_mt,
        weight_short_tons: shortTons,
        waste_material: wasteMaterial,
        disposal_method: disposalMethod,
        emissionFactor: factor,
        source_id: activityData.source_id,
        source_description: activityData.source_description
      };
      
      if (factor === 0 && !materialFactors[disposalMethod]) {
        // Warning if combination is invalid (factor 0 might be valid for some recycling, but usually not)
        console.warn(`[Calculation] No factor found for ${wasteMaterial} -> ${disposalMethod}`);
        calculationResult.note = "Warning: No emission factor found for this combination.";
      }
    }
    
    // OFFSETS: Store as negative emissions
    else if (activityType === 'offsets') {
      const mtco2e = parseFloat(activityData.amount_mtco2e) || 0;
      calculationResult = {
        co2_kg: -mtco2e * 1000,
        ch4_g: 0,
        n2o_g: 0,
        total_co2e_mt: -mtco2e,
        offsetType: activityData.offset_type,
        certificationStandard: activityData.certification_standard
      };
    }
    
    // If calculation succeeded, store result
    if (calculationResult) {
      await calculationStorage.storeCalculationResult({
        activityId,
        reportingPeriodId,
        activityType,
        calculationResult,
        factorVersion: emissionFactors.version || 'SIMPLIFIED_2024',
        standard: 'GHG_PROTOCOL',
        calculatedBy: userId
      });
      
      console.log(`[AutoCalculate] ${activityType} calculated:`, calculationResult.total_co2e_mt, 'mt CO2e');
      return calculationResult;
    }
  } catch (error) {
    console.error('[AutoCalculate] Failed to auto-calculate emissions:', error.message);
    // Don't fail the activity creation if calculation fails
    return null;
  }
}

// Helper: Get refrigerant GWP values
function getRefrigerantGWP(refrigerantType) {
  const gwpValues = {
    'R-410A': 2088,
    'R-134a': 1430,
    'R-22': 1810,
    'CO2': 1,
    'Ammonia': 0,
    'HFC-134a': 1430,
    'HFC-143a': 4470,
    'HFC-125': 3500,
    'HFC-32': 675
  };
  return gwpValues[refrigerantType] || 1430;
}

// Helper: Get fire suppressant GWP values
function getSuppressantGWP(suppressantType) {
  const gwpValues = {
    'Carbon dioxide': 1,
    'HFC-23': 12400,
    'HFC-125': 3170,
    'HFC-134a': 1300,
    'HFC-227ea': 3350,
    'HFC-236fa': 8060,
    'PFC-14': 6630,
    'PFC-31-10': 9200,
    // Legacy/alternative names
    'CO2': 1,
    'Halon-1301': 7140,
    'Halon-1211': 1890,
    'CF3I': 1,
    'FM-200': 3350
  };
  return gwpValues[suppressantType] || 1;
}

// Helper: Get industrial gas GWP values
function getGasGWP(gasType) {
  const gwpValues = {
    'Carbon dioxide': 1,
    'Methane': 28,
    'Nitrous oxide': 265,
    'HFC-23': 12400,
    'HFC-32': 677,
    'HFC-41': 116,
    'HFC-125': 3170,
    'HFC-134': 1120,
    'HFC-134a': 1300,
    'HFC-143': 328,
    'HFC-143a': 4800,
    'HFC-152': 16,
    'HFC-152a': 138,
    'HFC-161': 4,
    'HFC-227ea': 3350,
    'HFC-236cb': 1210,
    'HFC-236ea': 1330,
    'HFC-236fa': 8060,
    'HFC-245ca': 716,
    'HFC-245fa': 858,
    'HFC-365mfc': 804,
    'HFC-43-10mee': 1650,
    'Sulfur hexafluoride': 23500,
    'Nitrogen trifluoride': 16100,
    'PFC-14': 6630,
    'PFC-116': 11100,
    'PFC-218': 8900,
    'PFC-318': 9540,
    'PFC-31-10': 9200,
    'PFC-41-12': 8550,
    'PFC-51-14': 7910,
    'PFC-91-18': 7190,
    // Legacy mapping (to support common names)
    'CO2': 1,
    'CH4': 28,
    'N2O': 265,
    'SF6': 23500
  };
  return gwpValues[gasType] || 1;
}

/**
 * Create activity
 * POST /api/activities/:activityType
 */
export async function createActivity(req, res, next) {
  try {
    const { activityType } = req.params;
    // Convert hyphenated URLs to underscore format (stationary-combustion -> stationary_combustion)
    const normalizedActivityType = activityType.replace(/-/g, '_');
    // Accept both camelCase and snake_case for reporting period ID
    const reportingPeriodId = req.body.reportingPeriodId || req.body.reporting_period_id;
    let { reportingPeriodId: _, reporting_period_id: __, ...activityDataRaw } = req.body;
    const userId = req.user.userId;
    const companyId = req.params.companyId;

    let activityData = { ...activityDataRaw };

    // For Refrigeration AC, ensure 'gwp' is handled if it's in the DB schema.
    // Previous sessions added 'gwp' column to refrigeration_ac_activities table.
    // So we KEEP it in activityData.
    // if (normalizedActivityType.startsWith('refrigeration_ac')) {
    //   // const { gwp, ...cleanedData } = activityData;
    //   // activityData = cleanedData;
    // }

    // Set calculation_method for Refrigeration types
    if (normalizedActivityType.startsWith('refrigeration_ac_')) {
      if (normalizedActivityType.includes('material_balance') && !normalizedActivityType.includes('simplified')) {
        activityData.calculation_method = 'MATERIAL_BALANCE';
      } else if (normalizedActivityType.includes('simplified')) {
        activityData.calculation_method = 'SIMPLIFIED_MATERIAL_BALANCE';
      } else if (normalizedActivityType.includes('screening')) {
        activityData.calculation_method = 'SCREENING_METHOD';
      }
    }

    // Set calculation_method for Fire Suppression types
    if (normalizedActivityType.startsWith('fire_suppression_')) {
      if (normalizedActivityType.includes('material_balance') && !normalizedActivityType.includes('simplified')) {
        activityData.calculation_method = 'MATERIAL_BALANCE';
      } else if (normalizedActivityType.includes('simplified')) {
        activityData.calculation_method = 'SIMPLIFIED_MATERIAL_BALANCE';
      } else if (normalizedActivityType.includes('screening')) {
        activityData.calculation_method = 'SCREENING_METHOD';
      }
    }

    // Set calculation_method for unified Scope 3 types (Business Travel & Commuting)
    if (normalizedActivityType === 'business_travel_personal_car') {
      activityData.calculation_method = 'PERSONAL_VEHICLE';
    } else if (normalizedActivityType === 'business_travel_rail_bus') {
      activityData.calculation_method = 'RAIL_BUS';
    } else if (normalizedActivityType === 'business_travel_air') {
      activityData.calculation_method = 'AIR';
    } else if (normalizedActivityType === 'employee_commuting_personal_car') {
      activityData.calculation_method = 'PERSONAL_VEHICLE';
    } else if (normalizedActivityType === 'employee_commuting_public_transport') {
      activityData.calculation_method = 'PUBLIC_TRANSPORTATION';
    }

    // For mobile_sources, infer calculation_method if missing (required NOT NULL)
    if (normalizedActivityType === 'upstream_trans_dist_vehicle_miles') {
      activityData.calculation_method = 'VEHICLE_MILES';
    } else if (normalizedActivityType === 'upstream_trans_dist_ton_miles') {
      activityData.calculation_method = 'TON_MILES';
    }

    if (normalizedActivityType === 'mobile_sources') {
      if (!activityData.calculation_method) {
        if (activityData.fuel_usage && parseFloat(activityData.fuel_usage) > 0) {
          activityData.calculation_method = 'FUEL_BASED';
        } else if (activityData.miles_traveled && parseFloat(activityData.miles_traveled) > 0) {
          activityData.calculation_method = 'DISTANCE_BASED';
        } else {
          activityData.calculation_method = 'FUEL_BASED'; // Default fallback
        }
      }
    }
    
    // For electricity, default calculation_method if missing
    if (normalizedActivityType === 'electricity' && !activityData.calculation_method) {
      activityData.calculation_method = 'LOCATION_BASED';
    }

    // Field filtering for Scope 2 (Electricity & Steam) and Purchased Gases
    if (['purchased_gases', 'electricity', 'steam'].includes(normalizedActivityType)) {
      const allowedFields = {
        purchased_gases: ['gas_type', 'amount_purchased', 'amount_units', 'external_id'],
        electricity: ['source_id', 'source_description', 'facility_location', 'source_area_sqft', 'kwh_purchased', 'market_based_co2_factor', 'market_based_ch4_factor', 'market_based_n2o_factor', 'external_id', 'calculation_method'],
        steam: ['source_id', 'source_description', 'source_area_sqft', 'fuel_type', 'boiler_efficiency', 'amount_purchased', 'amount_units', 'location_based_co2_factor', 'location_based_ch4_factor', 'location_based_n2o_factor', 'market_based_co2_factor', 'market_based_ch4_factor', 'market_based_n2o_factor', 'external_id']
      };

      const allowed = allowedFields[normalizedActivityType];
      activityData = Object.fromEntries(
        Object.entries(activityData).filter(([k]) => allowed.includes(k.toLowerCase()))
      );
    }

    console.log('Creating activity:', normalizedActivityType, 'for company:', companyId);

    // Validate activity data
    const validation = validateActivity(normalizedActivityType, activityData);
    if (!validation.valid) {
      console.log('Validation failed for', normalizedActivityType, ':', validation.errors);
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    const tableName = getTableName(normalizedActivityType);
    if (!tableName) {
      return res.status(400).json({ error: `Unknown activity type: ${normalizedActivityType}` });
    }

    const id = uuidv4();
    const now = new Date();

    // Build dynamic INSERT query
    const fields = ['id', 'company_id', 'reporting_period_id', 'entered_by', 'created_at', 'updated_at'];
    const values = [id, companyId, reportingPeriodId, userId, now, now];
    const placeholders = ['$1', '$2', '$3', '$4', '$5', '$6'];

    let paramIndex = 7;
    for (const [key, value] of Object.entries(activityData)) {
      // Skip reporting_period_id and entered_by as they're already included in base fields
      if (key === 'reporting_period_id' || key === 'entered_by') continue;
      // Standard INSERT fields logic
      fields.push(key);
      // Convert empty strings to null to prevent "invalid input syntax for type numeric" errors
      const sanitizedValue = value === '' ? null : value;
      values.push(sanitizedValue);
      placeholders.push(`$${paramIndex}`);
      paramIndex++;
    }
    if (normalizedActivityType === 'purchased_gases') {
      console.log('[DEBUG] FINAL Insert fields:', fields);
    }

    // Debug: Log final fields and values for verification
    if (normalizedActivityType === 'purchased_gases') {
      console.log('[DEBUG] Purchased Gases Insert Fields:', fields);
      console.log('[DEBUG] Purchased Gases Insert Values:', values);
    }

    const query = `
      INSERT INTO ${tableName} (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const result = await queryOne(query, values);

    // Auto-calculate emissions immediately (await to ensure it completes)
    let calculation = null;
    try {
      calculation = await autoCalculateEmissions(normalizedActivityType, activityData, id, reportingPeriodId, userId);
      console.log(`✅ Auto-calculated emissions for ${normalizedActivityType} activity ${id}`);
    } catch (calcError) {
      console.error(`⚠️ Failed to auto-calculate emissions for activity ${id}:`, calcError.message);
      // Don't fail the activity creation if calculation fails, but log it
    }

    // Attach calculation result to the response
    const activityWithCalc = {
      ...result,
      co2e_kg: calculation ? calculation.total_co2e_mt * 1000 : 0,
      calculation_result: calculation ? {
        co2_kg: calculation.co2_kg,
        ch4_g: calculation.ch4_g,
        n2o_g: calculation.n2o_g,
        co2e_metric_tons: calculation.total_co2e_mt,
        calculation_metadata: calculation
      } : null
    };

    res.status(201).json({
      message: `${activityType} activity created`,
      activity: activityWithCalc,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get activity by ID
 * GET /api/activities/:activityType/:id
 */
export async function getActivity(req, res, next) {
  try {
    const { activityType, id } = req.params;
    const companyId = req.params.companyId;
    
    // Convert hyphenated URLs to underscore format
    const normalizedActivityType = activityType.replace(/-/g, '_');

    const tableName = getTableName(normalizedActivityType);
    if (!tableName) {
      return res.status(400).json({ error: `Unknown activity type: ${normalizedActivityType}` });
    }

    // Join with emission_calculations to get emissions data
    const activity = await queryOne(
      `SELECT 
        a.*,
        COALESCE(ec.co2e_metric_tons * 1000, 0) as co2e_kg,
        ec.calculation_metadata as calculation_result
      FROM ${tableName} a
      LEFT JOIN emission_calculations ec ON ec.activity_id = a.id AND ec.activity_type = $3
      WHERE a.id = $1 AND a.company_id = $2`,
      [id, companyId, normalizedActivityType]
    );

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json({ activity });
  } catch (error) {
    next(error);
  }
}

/**
 * List activities by type
 * GET /api/activities/:activityType
 */
export async function listActivities(req, res, next) {
  try {
    const { activityType } = req.params;
    // Convert hyphenated URLs to underscore format
    const normalizedActivityType = activityType.replace(/-/g, '_');
    const { reportingPeriodId } = req.query;
    const companyId = req.params.companyId;

    const tableName = getTableName(normalizedActivityType);
    if (!tableName) {
      return res.status(400).json({ error: `Unknown activity type: ${normalizedActivityType}` });
    }

    // Join with emission_calculations to get emissions data
    let query = `
      SELECT 
        a.*,
        COALESCE(ec.co2e_metric_tons * 1000, 0) as co2e_kg,
        COALESCE(ec.location_based_co2e_mt, 0) as location_based_co2e_mt,
        COALESCE(ec.market_based_co2e_mt, 0) as market_based_co2e_mt,
        rp.period_label as reporting_period_label,
        rp.period_start_date as start_date,
        rp.period_end_date as end_date
      FROM ${tableName} a
      LEFT JOIN emission_calculations ec ON ec.activity_id = a.id AND ec.activity_type = '${normalizedActivityType}'
      LEFT JOIN reporting_periods rp ON a.reporting_period_id = rp.id
      WHERE a.company_id = $1
    `;
    const values = [companyId];

    if (reportingPeriodId) {
      query += ` AND a.reporting_period_id = $2`;
      values.push(reportingPeriodId);
    }

    // Filter by calculation_method for Refrigeration types sharing the same table
    if (normalizedActivityType === 'refrigeration_ac_material_balance') {
      query += ` AND a.calculation_method = 'MATERIAL_BALANCE'`;
    } else if (normalizedActivityType === 'refrigeration_ac_simplified_material_balance') {
      query += ` AND a.calculation_method = 'SIMPLIFIED_MATERIAL_BALANCE'`;
    } else if (normalizedActivityType === 'refrigeration_ac_screening_method') {
      query += ` AND a.calculation_method = 'SCREENING_METHOD'`;
    }

    // Filter by calculation_method for Fire Suppression types sharing the same table
    if (normalizedActivityType === 'fire_suppression_material_balance') {
      query += ` AND a.calculation_method = 'MATERIAL_BALANCE'`;
    } else if (normalizedActivityType === 'fire_suppression_simplified_material_balance') {
      query += ` AND a.calculation_method = 'SIMPLIFIED_MATERIAL_BALANCE'`;
    } else if (normalizedActivityType === 'fire_suppression_screening_method') {
      query += ` AND a.calculation_method = 'SCREENING_METHOD'`;
    }

    // Filter by calculation_method for Unified Business Travel & Commuting
    if (normalizedActivityType === 'business_travel_personal_car') {
      query += ` AND a.calculation_method = 'PERSONAL_VEHICLE'`;
    } else if (normalizedActivityType === 'business_travel_rail_bus') {
      query += ` AND a.calculation_method = 'RAIL_BUS'`;
    } else if (normalizedActivityType === 'business_travel_air') {
      query += ` AND a.calculation_method = 'AIR'`;
    } else if (normalizedActivityType === 'employee_commuting_personal_car') {
      query += ` AND a.calculation_method = 'PERSONAL_VEHICLE'`;
    } else if (normalizedActivityType === 'employee_commuting_public_transport') {
      query += ` AND a.calculation_method = 'PUBLIC_TRANSPORTATION'`;
    }

    // Filter for Upstream Transportation & Distribution
    if (normalizedActivityType === 'upstream_trans_dist_vehicle_miles') {
      query += ` AND a.calculation_method = 'VEHICLE_MILES'`;
    } else if (normalizedActivityType === 'upstream_trans_dist_ton_miles') {
      query += ` AND a.calculation_method = 'TON_MILES'`;
    }

    query += ` ORDER BY a.created_at DESC`;

    const activities = await queryAll(query, values);

    res.json({
      activityType: normalizedActivityType,
      count: activities.length,
      activities,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update activity
 * PUT /api/activities/:activityType/:id
 */
export async function updateActivity(req, res, next) {
  try {
    const { activityType, id } = req.params;
    const companyId = req.params.companyId;
    const activityData = req.body;
    
    // Convert hyphenated URLs to underscore format
    const normalizedActivityType = activityType.replace(/-/g, '_');

    // Validate activity data
    const validation = validateActivity(normalizedActivityType, activityData);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    const tableName = getTableName(normalizedActivityType);
    if (!tableName) {
      return res.status(400).json({ error: `Unknown activity type: ${normalizedActivityType}` });
    }

    // Build dynamic UPDATE query
    const updates = [];
    const values = [companyId, id];
    let paramIndex = 3;

    updates.push('updated_at = $' + paramIndex);
    values.push(new Date());
    paramIndex++;

    // Filter out system fields and duplicate camelCase fields like reportingPeriodId
    // Also exclude co2e_kg and calculation_result as these are virtual/computed fields
    const fieldsToExclude = ['id', 'company_id', 'created_at', 'updated_at', 'reportingPeriodId', 'companyId', 'co2e_kg', 'calculation_result'];
    
    for (const [key, value] of Object.entries(activityData)) {
      if (!fieldsToExclude.includes(key)) {
        updates.push(`${key} = $${paramIndex}`);
        
        // Convert empty strings to null
        const sanitizedValue = value === '' ? null : value;
        values.push(sanitizedValue);
        
        paramIndex++;
      }
    }

    const query = `
      UPDATE ${tableName}
      SET ${updates.join(', ')}
      WHERE id = $2 AND company_id = $1
      RETURNING *
    `;

    const result = await queryOne(query, values);

    if (!result) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Recalculate emissions after update
    try {
      // First, delete existing calculations for this activity to avoid duplicates
      await execute(
        'DELETE FROM emission_calculations WHERE activity_id = $1',
        [result.id]
      );
      
      // Then recalculate and store new emissions
      await autoCalculateEmissions(
        normalizedActivityType, 
        result, // Pass the updated activity data
        result.id, 
        result.reporting_period_id, 
        req.user.userId
      );
      console.log(`✅ Auto-calculated emissions for updated ${normalizedActivityType} activity ${result.id}`);
    } catch (calcError) {
      console.error(`⚠️ Failed to auto-calculate emissions for updated activity:`, calcError);
      // Don't fail the update if calculation fails
    }

    // Fetch the updated activity with recalculated emissions
    const selectQuery = `
      SELECT a.*, 
             COALESCE(ec.co2e_metric_tons * 1000, 0) as co2e_kg,
             jsonb_build_object(
               'co2_kg', ec.co2_kg,
               'ch4_g', ec.ch4_g,
               'n2o_g', ec.n2o_g,
               'co2e_metric_tons', ec.co2e_metric_tons,
               'calculation_metadata', ec.calculation_metadata
             ) as calculation_result
      FROM ${tableName} a
      LEFT JOIN emission_calculations ec ON ec.activity_id = a.id
      WHERE a.id = $1 AND a.company_id = $2
      ORDER BY ec.created_at DESC
      LIMIT 1
    `;
    const updatedActivity = await queryOne(selectQuery, [id, companyId]);

    res.json({
      message: `${activityType} activity updated`,
      activity: updatedActivity || result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete activity
 * DELETE /api/activities/:activityType/:id
 */
export async function deleteActivity(req, res, next) {
  try {
    const { activityType, id } = req.params;
    const companyId = req.params.companyId;
    
    // Convert hyphenated URLs to underscore format
    const normalizedActivityType = activityType.replace(/-/g, '_');

    const tableName = getTableName(normalizedActivityType);
    if (!tableName) {
      return res.status(400).json({ error: `Unknown activity type: ${normalizedActivityType}` });
    }

    // Get reporting period ID before deletion
    const activityToDelete = await queryOne(
      `SELECT reporting_period_id FROM ${tableName} WHERE id = $1 AND company_id = $2`,
      [id, companyId]
    );

    if (!activityToDelete) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Delete associated calculations first
    await execute(
      'DELETE FROM emission_calculations WHERE activity_id = $1',
      [id]
    );
    console.log(`[DeleteActivity] Deleted calculations for activity ${id}`);

    // Delete the activity
    await execute(
      `DELETE FROM ${tableName} WHERE id = $1 AND company_id = $2`,
      [id, companyId]
    );

    // Update summary for the reporting period
    if (activityToDelete.reporting_period_id) {
      await calculationStorage.updateReportingPeriodSummary(companyId, activityToDelete.reporting_period_id);
      console.log(`[DeleteActivity] Updated summary for period ${activityToDelete.reporting_period_id}`);
    }

    res.json({ message: `${normalizedActivityType} activity deleted` });
  } catch (error) {
    next(error);
  }
}

/**
 * List all activities for a reporting period (all types combined)
 * GET /api/reporting-periods/:periodId/activities
 */
export async function listAllActivitiesByPeriod(req, res, next) {
  try {
    const { periodId } = req.params;
    const companyId = req.params.companyId;

    const activityTables = [
      'stationary_combustion_activities',
      'mobile_sources_activities',
      'refrigeration_ac_activities',
      'fire_suppression_activities',
      'purchased_gases_activities',
      'electricity_activities',
      'steam_activities',
      'business_travel_air',
      'business_travel_rail',
      'business_travel_road',
      'business_travel_hotel',
      'commuting_activities',
      'transportation_distribution_activities',
      'waste_activities',
      'offsets_activities',
    ];

    const results = {};

    for (const table of activityTables) {
      const activities = await queryAll(
        `SELECT * FROM ${table} WHERE company_id = $1 AND reporting_period_id = $2`,
        [companyId, periodId]
      );
      results[table] = activities;
    }

    res.json({
      reportingPeriodId: periodId,
      activities: results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get activity counts by type for a reporting period
 * GET /api/reporting-periods/:periodId/activity-counts
 */
export async function getActivityCountsByPeriod(req, res, next) {
  try {
    const { periodId } = req.params;
    const companyId = req.params.companyId;

    const activityTableMap = {
      stationary_combustion: 'stationary_combustion_activities',
      mobile_sources: 'mobile_sources_activities',
      refrigeration_ac: 'refrigeration_ac_activities',
      fire_suppression: 'fire_suppression_activities',
      purchased_gases: 'purchased_gases_activities',
      electricity: 'electricity_activities',
      steam: 'steam_activities',
      business_travel_air: 'business_travel_activities',
      business_travel_rail: 'business_travel_activities',
      business_travel_road: 'business_travel_activities',
      business_travel_hotel: 'business_travel_hotel',
      commuting: 'employee_commuting_activities',
      transportation_distribution: 'transportation_distribution_activities',
      waste: 'waste_activities',
      offsets: 'offsets_activities',
    };

    const counts = {};

    // Grouping by "base" type for UI simplicity
    for (const [type, table] of Object.entries(activityTableMap)) {
      const result = await queryOne(
        `SELECT COUNT(*) as count FROM ${table} WHERE company_id = $1 AND reporting_period_id = $2`,
        [companyId, periodId]
      );
      counts[type] = parseInt(result.count || 0);
    }

    res.json({
      reportingPeriodId: periodId,
      counts,
    });
  } catch (error) {
    next(error);
  }
}
