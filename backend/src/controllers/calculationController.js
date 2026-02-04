/**
 * ========================================================================
 * CALCULATION CONTROLLER
 * ========================================================================
 * 
 * Orchestrates the calculation workflow:
 * 1. Load emission factors from DB (via resolver)
 * 2. Execute pure calculation functions (from engine)
 * 3. Store results immutably (via storage)
 */

import * as calculationEngine from '../services/calculationEngine.js';
import * as emissionFactorResolver from '../services/emissionFactorResolver.js';
import * as calculationStorage from '../services/calculationStorage.js';
import pool from '../utils/db.js';

/**
 * Calculate emissions for stationary combustion activity
 * POST /api/calculate/stationary-combustion
 */
async function calculateStationaryCombustion(req, res) {
  try {
    const { activityId, fuelType, quantity, unit, isBiomass, reportingStandard } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (!activityId || !fuelType || quantity === undefined || !unit) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: activityId, fuelType, quantity, unit'
      });
    }
    
    // Get activity details to get reporting period
    const activityQuery = await pool.query(
      'SELECT reporting_period_id FROM stationary_combustion_activities WHERE id = $1',
      [activityId]
    );
    
    if (activityQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }
    
    const reportingPeriodId = activityQuery.rows[0].reporting_period_id;
    
    // Load emission factors
    const standard = reportingStandard || 'GHG_PROTOCOL';
    const emissionFactors = await emissionFactorResolver.getStationaryFuelFactors(
      fuelType,
      standard
    );
    
    // Execute calculation (pure function)
    const calculationResult = calculationEngine.calculateStationaryCombustion({
      fuelType,
      quantity,
      unit,
      emissionFactors,
      isBiomass: isBiomass || false
    });
    
    // Store result immutably
    const storedResult = await calculationStorage.storeCalculationResult({
      activityId,
      reportingPeriodId,
      activityType: 'stationary_combustion',
      calculationResult,
      factorVersion: emissionFactors.version,
      standard,
      calculatedBy: userId
    });
    
    res.json({
      success: true,
      calculation: storedResult,
      result: {
        ...calculationResult,
        // Always provide emissions in MT for frontend/table use
        co2e_mt: calculationResult.total_co2e_mt
      }
    });
  } catch (error) {
    console.error('[CalculationController] Error in calculateStationaryCombustion:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate stationary combustion emissions'
    });
  }
}

/**
 * Calculate emissions for mobile sources activity
 * POST /api/calculate/mobile-sources
 */
async function calculateMobileSources(req, res) {
  try {
    const { 
      activityId, 
      vehicleType, 
      vehicleYear, 
      fuelType, 
      fuelUsage, 
      mileage,
      biodieselPercent,
      ethanolPercent,
      reportingStandard 
    } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (!activityId || !vehicleType || !vehicleYear || !fuelType || fuelUsage === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: activityId, vehicleType, vehicleYear, fuelType, fuelUsage'
      });
    }
    
    // Get activity details
    const activityQuery = await pool.query(
      'SELECT reporting_period_id FROM mobile_sources_activities WHERE id = $1',
      [activityId]
    );
    
    if (activityQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }
    
    const reportingPeriodId = activityQuery.rows[0].reporting_period_id;
    
    // Load emission factors
    const standard = reportingStandard || 'GHG_PROTOCOL';
    const emissionFactors = await emissionFactorResolver.getMobileSourceFactors(
      vehicleType,
      vehicleYear,
      fuelType,
      standard
    );
    
    // Execute calculation
    const calculationResult = calculationEngine.calculateMobileSources({
      vehicleType,
      vehicleYear,
      fuelType,
      fuelUsage,
      mileage: mileage || 0,
      emissionFactors,
      biodieselPercent: biodieselPercent || 0,
      ethanolPercent: ethanolPercent || 0
    });
    
    // Store result
    const storedResult = await calculationStorage.storeCalculationResult({
      activityId,
      reportingPeriodId,
      activityType: 'mobile_sources',
      calculationResult,
      factorVersion: emissionFactors.version,
      standard,
      calculatedBy: userId
    });
    
    res.json({
      success: true,
      calculation: storedResult,
      result: calculationResult
    });
  } catch (error) {
    console.error('[CalculationController] Error in calculateMobileSources:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate mobile sources emissions'
    });
  }
}

/**
 * Calculate emissions for refrigeration/AC activity
 * POST /api/calculate/refrigeration-ac
 */
async function calculateRefrigerationAC(req, res) {
  try {
    const { 
      activityId, 
      refrigerantType, 
      inventoryChange_kg, 
      transferredAmount_kg, 
      capacityChange_kg,
      reportingStandard 
    } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (!activityId || !refrigerantType || 
        inventoryChange_kg === undefined || 
        transferredAmount_kg === undefined || 
        capacityChange_kg === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: activityId, refrigerantType, inventoryChange_kg, transferredAmount_kg, capacityChange_kg'
      });
    }
    
    // Get activity details
    const activityQuery = await pool.query(
      'SELECT reporting_period_id FROM refrigeration_ac_activities WHERE id = $1',
      [activityId]
    );
    
    if (activityQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }
    
    const reportingPeriodId = activityQuery.rows[0].reporting_period_id;
    
    // Load emission factors (GWP)
    const standard = reportingStandard || 'GHG_PROTOCOL';
    const emissionFactors = await emissionFactorResolver.getRefrigerantGWP(
      refrigerantType,
      standard
    );
    
    // Execute calculation
    const calculationResult = calculationEngine.calculateRefrigerationAC({
      refrigerantType,
      inventoryChange_kg,
      transferredAmount_kg,
      capacityChange_kg,
      emissionFactors
    });
    
    // Store result
    const storedResult = await calculationStorage.storeCalculationResult({
      activityId,
      reportingPeriodId,
      activityType: 'refrigeration_ac',
      calculationResult,
      factorVersion: emissionFactors.version,
      standard,
      calculatedBy: userId
    });
    
    res.json({
      success: true,
      calculation: storedResult,
      result: calculationResult
    });
  } catch (error) {
    console.error('[CalculationController] Error in calculateRefrigerationAC:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate refrigeration/AC emissions'
    });
  }
}

/**
 * Calculate emissions for purchased electricity
 * POST /api/calculate/electricity
 */
async function calculateElectricity(req, res) {
  try {
    const { activityId, electricityUsage_kWh, gridRegion, reportingStandard } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (!activityId || electricityUsage_kWh === undefined || !gridRegion) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: activityId, electricityUsage_kWh, gridRegion'
      });
    }
    
    // Get activity details
    const activityQuery = await pool.query(
      'SELECT reporting_period_id FROM electricity_activities WHERE id = $1',
      [activityId]
    );
    
    if (activityQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }
    
    const reportingPeriodId = activityQuery.rows[0].reporting_period_id;
    
    // Load emission factors
    const standard = reportingStandard || 'GHG_PROTOCOL';
    const emissionFactors = await emissionFactorResolver.getElectricityFactors(
      gridRegion,
      standard
    );
    
    // Execute calculation
    const calculationResult = calculationEngine.calculateElectricity({
      electricityUsage_kWh,
      gridRegion,
      emissionFactors
    });
    
    // Store result
    const storedResult = await calculationStorage.storeCalculationResult({
      activityId,
      reportingPeriodId,
      activityType: 'electricity',
      calculationResult,
      factorVersion: emissionFactors.version,
      standard,
      calculatedBy: userId
    });
    
    res.json({
      success: true,
      calculation: storedResult,
      result: calculationResult
    });
  } catch (error) {
    console.error('[CalculationController] Error in calculateElectricity:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate electricity emissions'
    });
  }
}

/**
 * Calculate emissions for purchased steam/heat
 * POST /api/calculate/steam
 */
async function calculateSteam(req, res) {
  try {
    const { activityId, steamUsage_mmBtu, reportingStandard } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (!activityId || steamUsage_mmBtu === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: activityId, steamUsage_mmBtu'
      });
    }
    
    // Get activity details
    const activityQuery = await pool.query(
      'SELECT reporting_period_id FROM steam_activities WHERE id = $1',
      [activityId]
    );
    
    if (activityQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }
    
    const reportingPeriodId = activityQuery.rows[0].reporting_period_id;
    
    // Load emission factors
    const standard = reportingStandard || 'GHG_PROTOCOL';
    const emissionFactors = await emissionFactorResolver.getSteamFactors(standard);
    
    // Execute calculation
    const calculationResult = calculationEngine.calculateSteam({
      steamUsage_mmBtu,
      emissionFactors
    });
    
    // Store result
    const storedResult = await calculationStorage.storeCalculationResult({
      activityId,
      reportingPeriodId,
      activityType: 'steam',
      calculationResult,
      factorVersion: emissionFactors.version,
      standard,
      calculatedBy: userId
    });
    
    res.json({
      success: true,
      calculation: storedResult,
      result: calculationResult
    });
  } catch (error) {
    console.error('[CalculationController] Error in calculateSteam:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate steam emissions'
    });
  }
}

/**
 * Get all calculations for a reporting period
 * GET /api/calculations/reporting-period/:reportingPeriodId
 */
async function getCalculationsByPeriod(req, res) {
  try {
    const { reportingPeriodId } = req.params;
    const { latestOnly, activityType } = req.query;
    
    const options = {
      latestOnly: latestOnly !== 'false',
      activityType: activityType || undefined
    };
    
    const calculations = await calculationStorage.getCalculationsByReportingPeriod(
      reportingPeriodId,
      options
    );
    
    res.json({
      success: true,
      calculations,
      count: calculations.length
    });
  } catch (error) {
    console.error('[CalculationController] Error in getCalculationsByPeriod:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve calculations'
    });
  }
}

/**
 * Get calculation by ID
 * GET /api/calculations/:id
 */
async function getCalculationById(req, res) {
  try {
    const { id } = req.params;
    
    const query = 'SELECT * FROM calculation_results WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Calculation not found'
      });
    }
    
    res.json({
      success: true,
      calculation: result.rows[0]
    });
  } catch (error) {
    console.error('[CalculationController] Error in getCalculationById:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve calculation'
    });
  }
}

/**
 * Get calculation history for an activity
 * GET /api/calculations/activity/:activityId/history
 */
async function getCalculationHistory(req, res) {
  try {
    const { activityId } = req.params;
    const { limit } = req.query;
    
    const history = await calculationStorage.getCalculationHistory(
      activityId,
      limit ? parseInt(limit) : 10
    );
    
    res.json({
      success: true,
      history,
      count: history.length
    });
  } catch (error) {
    console.error('[CalculationController] Error in getCalculationHistory:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve calculation history'
    });
  }
}

/**
 * Get aggregated calculations for a reporting period
 * GET /api/calculations/reporting-period/:reportingPeriodId/aggregate
 */
async function getAggregatedCalculations(req, res) {
  try {
    const { reportingPeriodId } = req.params;
    
    const aggregation = await calculationStorage.aggregateCalculationsForPeriod(
      reportingPeriodId
    );
    
    res.json({
      success: true,
      aggregation
    });
  } catch (error) {
    console.error('[CalculationController] Error in getAggregatedCalculations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to aggregate calculations'
    });
  }
}

/**
 * Compare two calculations
 * GET /api/calculations/compare/:id1/:id2
 */
async function compareCalculations(req, res) {
  try {
    const { id1, id2 } = req.params;
    
    const comparison = await calculationStorage.compareCalculations(id1, id2);
    
    res.json({
      success: true,
      comparison
    });
  } catch (error) {
    console.error('[CalculationController] Error in compareCalculations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to compare calculations'
    });
  }
}

/**
 * Get calculation statistics for a reporting period
 * GET /api/calculations/reporting-period/:reportingPeriodId/stats
 */
async function getCalculationStats(req, res) {
  try {
    const { reportingPeriodId } = req.params;
    
    const stats = await calculationStorage.getCalculationStats(reportingPeriodId);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('[CalculationController] Error in getCalculationStats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve calculation statistics'
    });
  }
}

/**
 * Clear emission factor cache (admin only)
 * DELETE /api/calculations/cache
 */
async function clearFactorCache(req, res) {
  try {
    emissionFactorResolver.clearCache();
    
    res.json({
      success: true,
      message: 'Emission factor cache cleared successfully'
    });
  } catch (error) {
    console.error('[CalculationController] Error in clearFactorCache:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear cache'
    });
  }
}

/**
 * Get cache statistics
 * GET /api/calculations/cache/stats
 */
async function getCacheStats(req, res) {
  try {
    const stats = emissionFactorResolver.getCacheStats();
    
    res.json({
      success: true,
      cache: stats
    });
  } catch (error) {
    console.error('[CalculationController] Error in getCacheStats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve cache statistics'
    });
  }
}

/**
 * Get available fuel types for stationary combustion
 * GET /api/calculations/fuel-types
 */
async function getAvailableFuelTypes(req, res) {
  try {
    const { standard } = req.query;
    
    const fuelTypes = await emissionFactorResolver.getAvailableFuelTypes(
      standard || 'GHG_PROTOCOL'
    );
    
    res.json({
      success: true,
      fuelTypes
    });
  } catch (error) {
    console.error('[CalculationController] Error in getAvailableFuelTypes:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve fuel types'
    });
  }
}

/**
 * Get available vehicle types for mobile sources
 * GET /api/calculations/vehicle-types
 */
async function getAvailableVehicleTypes(req, res) {
  try {
    const { standard } = req.query;
    
    const vehicleTypes = await emissionFactorResolver.getAvailableVehicleTypes(
      standard || 'GHG_PROTOCOL'
    );
    
    res.json({
      success: true,
      vehicleTypes
    });
  } catch (error) {
    console.error('[CalculationController] Error in getAvailableVehicleTypes:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve vehicle types'
    });
  }
}

/**
 * Calculate emissions for waste disposal
 * POST /api/calculate/waste
 */
async function calculateWaste(req, res) {
  try {
    const { activityId, wasteType, disposalMethod, amount, units } = req.body;
    const userId = req.user.id;
    
    if (!activityId || !wasteType || !disposalMethod || !amount) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const activityQuery = await pool.query(
      'SELECT reporting_period_id FROM waste_activities WHERE id = $1', [activityId]
    );
    if (activityQuery.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }
    
    const reportingPeriodId = activityQuery.rows[0].reporting_period_id;
    const emissionFactor = await emissionFactorResolver.getWasteFactors(wasteType, disposalMethod);
    
    const result = calculationEngine.calculateWasteDisposal(
      { waste_type: wasteType, disposal_method: disposalMethod, amount, amount_units: units },
      emissionFactor
    );
    
    const storedResult = await calculationStorage.storeCalculationResult({
      activityId,
      reportingPeriodId,
      activityType: 'waste',
      calculationResult: result,
      factorVersion: emissionFactor.version || 'EPA_2024_v1',
      standard: 'GHG_PROTOCOL',
      calculatedBy: userId
    });
    
    res.json({ success: true, calculation: storedResult, result });
  } catch (error) {
    console.error('[CalculationController] Error calculating waste:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Calculate emissions for purchased gases
 * POST /api/calculate/purchased-gases
 */
async function calculatePurchasedGases(req, res) {
  try {
    const { activityId, gasType, amountPurchased, units } = req.body;
    const userId = req.user.id;
    
    if (!activityId || !gasType || !amountPurchased) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const activityQuery = await pool.query(
      'SELECT reporting_period_id FROM purchased_gases_activities WHERE id = $1', [activityId]
    );
    if (activityQuery.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }
    
    const reportingPeriodId = activityQuery.rows[0].reporting_period_id;
    const emissionFactor = await emissionFactorResolver.getPurchasedGasGWP(gasType);
    
    const result = calculationEngine.calculatePurchasedGases(
      { gas_type: gasType, amount_purchased: amountPurchased, amount_units: units },
      emissionFactor
    );
    
    const storedResult = await calculationStorage.storeCalculationResult({
      activityId,
      reportingPeriodId,
      activityType: 'purchased_gases',
      calculationResult: result,
      factorVersion: emissionFactor.version || 'EPA_2024_v1',
      standard: 'GHG_PROTOCOL',
      calculatedBy: userId
    });
    
    res.json({ success: true, calculation: storedResult, result });
  } catch (error) {
    console.error('[CalculationController] Error calculating purchased gases:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Calculate emissions for business travel
 * POST /api/calculate/business-travel
 */
async function calculateBusinessTravel(req, res) {
  try {
    const { activityId, travelMode, distance, distanceUnit, numTrips, cabinClass, vehicleSize, flightType } = req.body;
    const userId = req.user.id;
    
    if (!activityId || !travelMode || !distance) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    let tableName;
    if (travelMode === 'Air') tableName = 'business_travel_air';
    else if (travelMode === 'Rail') tableName = 'business_travel_rail';
    else if (travelMode === 'Road') tableName = 'business_travel_road';
    else return res.status(400).json({ success: false, error: 'Invalid travel mode' });
    
    const activityQuery = await pool.query(
      `SELECT reporting_period_id FROM ${tableName} WHERE id = $1`, [activityId]
    );
    if (activityQuery.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }
    
    const reportingPeriodId = activityQuery.rows[0].reporting_period_id;
    const emissionFactor = await emissionFactorResolver.getBusinessTravelFactors(travelMode, {
      vehicleSize, cabinClass, flightType
    });
    
    const distanceKey = distanceUnit === 'miles' ? 'distance_miles' : 'distance_km';
    const result = calculationEngine.calculateBusinessTravel(
      { travel_mode: travelMode, [distanceKey]: distance, num_trips: numTrips, cabin_class: cabinClass, vehicle_size: vehicleSize, flight_type: flightType },
      emissionFactor
    );
    
    const storedResult = await calculationStorage.storeCalculationResult({
      activityId,
      reportingPeriodId,
      activityType: `business_travel_${travelMode.toLowerCase()}`,
      calculationResult: result,
      factorVersion: emissionFactor.version || 'EPA_2024_v1',
      standard: 'GHG_PROTOCOL',
      calculatedBy: userId
    });
    
    res.json({ success: true, calculation: storedResult, result });
  } catch (error) {
    console.error('[CalculationController] Error calculating business travel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Calculate emissions for hotel stays
 * POST /api/calculate/hotel
 */
async function calculateHotel(req, res) {
  try {
    const { activityId, hotelCategory, numNights, numRooms } = req.body;
    const userId = req.user.id;
    
    if (!activityId || !hotelCategory || !numNights) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const activityQuery = await pool.query(
      'SELECT reporting_period_id FROM business_travel_hotel WHERE id = $1', [activityId]
    );
    if (activityQuery.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }
    
    const reportingPeriodId = activityQuery.rows[0].reporting_period_id;
    const emissionFactor = await emissionFactorResolver.getHotelFactors(hotelCategory);
    
    const result = calculationEngine.calculateHotelStay(
      { hotel_category: hotelCategory, num_nights: numNights, num_rooms: numRooms },
      emissionFactor
    );
    
    const storedResult = await calculationStorage.storeCalculationResult({
      activityId,
      reportingPeriodId,
      activityType: 'business_travel_hotel',
      calculationResult: result,
      factorVersion: emissionFactor.version || 'EPA_2024_v1',
      standard: 'GHG_PROTOCOL',
      calculatedBy: userId
    });
    
    res.json({ success: true, calculation: storedResult, result });
  } catch (error) {
    console.error('[CalculationController] Error calculating hotel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Calculate emissions for commuting
 * POST /api/calculate/commuting
 */
async function calculateCommuting(req, res) {
  try {
    const { activityId, commuteMode, vehicleType, distancePerTrip, daysPerYear, numCommuters } = req.body;
    const userId = req.user.id;
    
    if (!activityId || !commuteMode || !distancePerTrip || !daysPerYear) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const activityQuery = await pool.query(
      'SELECT reporting_period_id FROM commuting_activities WHERE id = $1', [activityId]
    );
    if (activityQuery.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }
    
    const reportingPeriodId = activityQuery.rows[0].reporting_period_id;
    const emissionFactor = await emissionFactorResolver.getCommutingFactors(commuteMode, vehicleType);
    
    const result = calculationEngine.calculateCommuting(
      { commute_mode: commuteMode, vehicle_type: vehicleType, distance_per_trip_km: distancePerTrip, commute_days_per_year: daysPerYear, num_commuters: numCommuters },
      emissionFactor
    );
    
    const storedResult = await calculationStorage.storeCalculationResult({
      activityId,
      reportingPeriodId,
      activityType: 'commuting',
      calculationResult: result,
      factorVersion: emissionFactor.version || 'EPA_2024_v1',
      standard: 'GHG_PROTOCOL',
      calculatedBy: userId
    });
    
    res.json({ success: true, calculation: storedResult, result });
  } catch (error) {
    console.error('[CalculationController] Error calculating commuting:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Calculate emissions for transportation
 * POST /api/calculate/transportation
 */
async function calculateTransportation(req, res) {
  try {
    const { activityId, transportMode, vehicleType, distance, weight } = req.body;
    const userId = req.user.id;
    
    if (!activityId || !transportMode || !distance || !weight) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const activityQuery = await pool.query(
      'SELECT reporting_period_id FROM transportation_distribution_activities WHERE id = $1', [activityId]
    );
    if (activityQuery.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }
    
    const reportingPeriodId = activityQuery.rows[0].reporting_period_id;
    const emissionFactor = await emissionFactorResolver.getTransportationFactors(transportMode, vehicleType);
    
    const result = calculationEngine.calculateTransportation(
      { transport_mode: transportMode, distance_km: distance, weight_tons: weight },
      emissionFactor
    );
    
    const storedResult = await calculationStorage.storeCalculationResult({
      activityId,
      reportingPeriodId,
      activityType: 'transportation_distribution',
      calculationResult: result,
      factorVersion: emissionFactor.version || 'EPA_2024_v1',
      standard: 'GHG_PROTOCOL',
      calculatedBy: userId
    });
    
    res.json({ success: true, calculation: storedResult, result });
  } catch (error) {
    console.error('[CalculationController] Error calculating transportation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export {
  calculateStationaryCombustion,
  calculateMobileSources,
  calculateRefrigerationAC,
  calculateElectricity,
  calculateSteam,
  calculateWaste,
  calculatePurchasedGases,
  calculateBusinessTravel,
  calculateHotel,
  calculateCommuting,
  calculateTransportation,
  getCalculationsByPeriod,
  getCalculationById,
  getCalculationHistory,
  getAggregatedCalculations,
  compareCalculations,
  getCalculationStats,
  clearFactorCache,
  getCacheStats,
  getAvailableFuelTypes,
  getAvailableVehicleTypes
};
