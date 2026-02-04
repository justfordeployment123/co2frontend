/**
 * ========================================================================
 * CALCULATION STORAGE SERVICE - IMMUTABLE RESULTS
 * ========================================================================
 * 
 * This service stores calculation results immutably in the database.
 * NEVER UPDATE - always INSERT new records.
 * 
 * This ensures a complete audit trail of all calculations.
 */

import pool from '../utils/db.js';

/**
 * Store a calculation result (immutable - never update)
 * 
 * @param {Object} params - Calculation result parameters
 * @param {UUID} params.activityId - ID of the activity this calculation is for
 * @param {UUID} params.reportingPeriodId - ID of the reporting period
 * @param {string} params.activityType - Activity category
 * @param {Object} params.calculationResult - The calculation result object
 * @param {string} params.factorVersion - Version of emission factors used
 * @param {string} params.standard - Reporting standard used
 * @param {UUID} params.calculatedBy - User who triggered the calculation
 * @returns {Promise<Object>} Stored calculation record
 */
async function storeCalculationResult(params) {
  const {
    activityId,
    reportingPeriodId,
    activityType,
    calculationResult,
    factorVersion,
    standard,
    calculatedBy
  } = params;
  
  try {
    // Get company_id from activity - query all activity tables
    const activityQuery = await pool.query(
      `SELECT company_id FROM stationary_combustion_activities WHERE id = $1
       UNION SELECT company_id FROM mobile_sources_activities WHERE id = $1
       UNION SELECT company_id FROM refrigeration_ac_activities WHERE id = $1
       UNION SELECT company_id FROM fire_suppression_activities WHERE id = $1
       UNION SELECT company_id FROM purchased_gases_activities WHERE id = $1
       UNION SELECT company_id FROM electricity_activities WHERE id = $1
       UNION SELECT company_id FROM steam_activities WHERE id = $1
       UNION SELECT company_id FROM business_travel_activities WHERE id = $1
       UNION SELECT company_id FROM business_travel_hotel WHERE id = $1
       UNION SELECT company_id FROM employee_commuting_activities WHERE id = $1
       UNION SELECT company_id FROM transportation_distribution_activities WHERE id = $1
       UNION SELECT company_id FROM waste_activities WHERE id = $1
       UNION SELECT company_id FROM offsets_activities WHERE id = $1`,
      [activityId]
    );
    
    if (activityQuery.rows.length === 0) {
      throw new Error(`Activity ${activityId} not found in any activity table`);
    }
    
    const companyId = activityQuery.rows[0].company_id;
    
    if (!companyId) {
      throw new Error(`Company ID not found for activity ${activityId}`);
    }

    const query = `
      INSERT INTO emission_calculations (
        activity_id,
        company_id,
        reporting_period_id,
        activity_type,
        co2_kg,
        ch4_g,
        n2o_g,
        co2e_metric_tons,
        location_based_co2e_mt,
        market_based_co2e_mt,
        calculation_metadata,
        calculated_by,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *
    `;
    
    // Build comprehensive metadata object
    const metadata = {
      ...calculationResult,
      factorVersion: factorVersion || 'SIMPLIFIED_2024',
      standard: standard || 'GHG_PROTOCOL',
      calculatedAt: new Date().toISOString(),
      // Ensure all required fields are present
      co2_mt: (calculationResult.co2_kg || 0) / 1000,
      ch4_co2e_mt: calculationResult.ch4_co2e_mt || 0,
      n2o_co2e_mt: calculationResult.n2o_co2e_mt || 0,
      biomass_co2_mt: calculationResult.biomass_co2_mt || 0,
      total_emissions_mt_co2e: calculationResult.total_co2e_mt || 0
    };
    
    // Extract separate MTs for Scope 2 dual reporting
    const loc_mt = calculationResult.location_based?.total_co2e_mt || calculationResult.total_co2e_mt || 0;
    const mkt_mt = calculationResult.market_based?.total_co2e_mt || calculationResult.total_co2e_mt || 0;

    const values = [
      activityId,
      companyId,
      reportingPeriodId,
      activityType,
      calculationResult.co2_kg || 0,
      calculationResult.ch4_g || 0,
      calculationResult.n2o_g || 0,
      calculationResult.total_co2e_mt || 0,
      loc_mt,
      mkt_mt,
      JSON.stringify(metadata), // Full breakdown in metadata
      calculatedBy || 'SYSTEM'
    ];
    
    const result = await pool.query(query, values);
    
    console.log('[CalculationStorage] Stored calculation result:', {
      calculationId: result.rows[0].id,
      activityId,
      total_co2e_mt: calculationResult.total_co2e_mt
    });

    // Update the summary table for this reporting period
    await updateReportingPeriodSummary(companyId, reportingPeriodId);
    
    return result.rows[0];
  } catch (error) {
    console.error('[CalculationStorage] Error storing calculation result:', error);
    throw error;
  }
}

/**
 * Update the summary table for a reporting period based on latest calculations
 */
async function updateReportingPeriodSummary(companyId, reportingPeriodId) {
  try {
    const aggregation = await aggregateCalculationsForPeriod(reportingPeriodId);
    
    // Map aggregation breakdown to summary columns
    // Note: This mapping needs to align with table columns in calculation_results_summary
    // The aggregation.byActivityType keys match the activity types (e.g. mobile_sources)
    
    // Helper to safely get value
    const getVal = (type) => aggregation.byActivityType[type]?.total_co2e_mt || 0;
    const getS2Loc = (type) => aggregation.byActivityType[type]?.location_based_co2e_mt || 0;
    const getS2Mkt = (type) => aggregation.byActivityType[type]?.market_based_co2e_mt || 0;
    
    // Total Scope 1
    const s1_stationary = getVal('stationary_combustion');
    const s1_mobile = getVal('mobile_sources');
    const s1_refrigeration = getVal('refrigeration_ac') + 
                             getVal('refrigeration_ac_material_balance') + 
                             getVal('refrigeration_ac_simplified_material_balance') + 
                             getVal('refrigeration_ac_screening_method') +
                             getVal('refrigeration_ac_screening');
    const s1_fire = getVal('fire_suppression') +
                    getVal('fire_suppression_material_balance') +
                    getVal('fire_suppression_simplified_material_balance') + 
                    getVal('fire_suppression_screening_method');
    const s1_gases = getVal('purchased_gases'); 
    const s1_total = s1_stationary + s1_mobile + s1_refrigeration + s1_fire + s1_gases;
    
    // Scope 2
    const s2_elec_loc = getS2Loc('electricity');
    const s2_steam_loc = getS2Loc('steam');
    const s2_total_loc = s2_elec_loc + s2_steam_loc;
    
    const s2_elec_mkt = getS2Mkt('electricity');
    const s2_steam_mkt = getS2Mkt('steam');
    const s2_total_mkt = s2_elec_mkt + s2_steam_mkt;
    
    // Scope 3
    const s3_air = getVal('business_travel_air');
    const s3_rail = getVal('business_travel_rail');
    const s3_road = getVal('business_travel_road');
    const s3_hotel = getVal('business_travel_hotel');
    const s3_commuting = getVal('commuting');
    const s3_transport = getVal('transportation_distribution');
    const s3_waste = getVal('waste');
    const s3_total = s3_air + s3_rail + s3_road + s3_hotel + s3_commuting + s3_transport + s3_waste;

    // Offsets
    const offsets = getVal('offsets');
    
    // Net totals
    const s1_net = s1_total - offsets; // simplified offset attribution
    const s2_loc_net = s2_total_loc;
    const s2_mkt_net = s2_total_mkt;
    const s3_net = s3_total;

    // Combined Gross/Net
    const total_s1s2_loc_gross = s1_total + s2_total_loc;
    const total_s1s2_loc_net = s1_net + s2_loc_net;
    const total_s1s2_mkt_gross = s1_total + s2_total_mkt;
    const total_s1s2_mkt_net = s1_net + s2_mkt_net;

    const query = `
      INSERT INTO calculation_results_summary (
        company_id, reporting_period_id, 
        scope1_stationary_combustion_co2e, scope1_mobile_sources_co2e,
        scope1_refrigeration_ac_co2e, scope1_fire_suppression_co2e,
        scope1_purchased_gases_co2e, scope1_total_gross_co2e,
        scope1_offsets_co2e, scope1_total_net_co2e,
        scope2_location_based_electricity_co2e, scope2_location_based_steam_co2e,
        scope2_location_based_total_gross_co2e, scope2_location_based_total_net_co2e,
        scope2_market_based_electricity_co2e, scope2_market_based_steam_co2e,
        scope2_market_based_total_gross_co2e, scope2_market_based_total_net_co2e,
        scope3_business_travel_air_co2e, scope3_business_travel_rail_co2e,
        scope3_business_travel_road_co2e, scope3_business_travel_hotel_co2e,
        scope3_commuting_co2e, scope3_transportation_distribution_co2e,
        scope3_waste_co2e, scope3_total_gross_co2e, scope3_total_net_co2e,
        total_scope1_and_scope2_location_based_gross_co2e, total_scope1_and_scope2_location_based_net_co2e,
        total_scope1_and_scope2_market_based_gross_co2e, total_scope1_and_scope2_market_based_net_co2e,
        calculation_status, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, 
        'complete', NOW()
      )
      ON CONFLICT (company_id, reporting_period_id)
      DO UPDATE SET
        scope1_stationary_combustion_co2e = EXCLUDED.scope1_stationary_combustion_co2e,
        scope1_mobile_sources_co2e = EXCLUDED.scope1_mobile_sources_co2e,
        scope1_refrigeration_ac_co2e = EXCLUDED.scope1_refrigeration_ac_co2e,
        scope1_fire_suppression_co2e = EXCLUDED.scope1_fire_suppression_co2e,
        scope1_purchased_gases_co2e = EXCLUDED.scope1_purchased_gases_co2e,
        scope1_total_gross_co2e = EXCLUDED.scope1_total_gross_co2e,
        scope1_offsets_co2e = EXCLUDED.scope1_offsets_co2e,
        scope1_total_net_co2e = EXCLUDED.scope1_total_net_co2e,
        scope2_location_based_electricity_co2e = EXCLUDED.scope2_location_based_electricity_co2e,
        scope2_location_based_steam_co2e = EXCLUDED.scope2_location_based_steam_co2e,
        scope2_location_based_total_gross_co2e = EXCLUDED.scope2_location_based_total_gross_co2e,
        scope2_location_based_total_net_co2e = EXCLUDED.scope2_location_based_total_net_co2e,
        scope2_market_based_electricity_co2e = EXCLUDED.scope2_market_based_electricity_co2e,
        scope2_market_based_steam_co2e = EXCLUDED.scope2_market_based_steam_co2e,
        scope2_market_based_total_gross_co2e = EXCLUDED.scope2_market_based_total_gross_co2e,
        scope2_market_based_total_net_co2e = EXCLUDED.scope2_market_based_total_net_co2e,
        scope3_business_travel_air_co2e = EXCLUDED.scope3_business_travel_air_co2e,
        scope3_business_travel_rail_co2e = EXCLUDED.scope3_business_travel_rail_co2e,
        scope3_business_travel_road_co2e = EXCLUDED.scope3_business_travel_road_co2e,
        scope3_business_travel_hotel_co2e = EXCLUDED.scope3_business_travel_hotel_co2e,
        scope3_commuting_co2e = EXCLUDED.scope3_commuting_co2e,
        scope3_transportation_distribution_co2e = EXCLUDED.scope3_transportation_distribution_co2e,
        scope3_waste_co2e = EXCLUDED.scope3_waste_co2e,
        scope3_total_gross_co2e = EXCLUDED.scope3_total_gross_co2e,
        scope3_total_net_co2e = EXCLUDED.scope3_total_net_co2e,
        total_scope1_and_scope2_location_based_gross_co2e = EXCLUDED.total_scope1_and_scope2_location_based_gross_co2e,
        total_scope1_and_scope2_location_based_net_co2e = EXCLUDED.total_scope1_and_scope2_location_based_net_co2e,
        total_scope1_and_scope2_market_based_gross_co2e = EXCLUDED.total_scope1_and_scope2_market_based_gross_co2e,
        total_scope1_and_scope2_market_based_net_co2e = EXCLUDED.total_scope1_and_scope2_market_based_net_co2e,
        calculation_status = 'complete',
        updated_at = NOW()
    `;
    
    await pool.query(query, [
      companyId, reportingPeriodId,
      s1_stationary, s1_mobile, s1_refrigeration, s1_fire, s1_gases, s1_total, offsets, s1_net,
      s2_elec_loc, s2_steam_loc, s2_total_loc, s2_loc_net,
      s2_elec_mkt, s2_steam_mkt, s2_total_mkt, s2_mkt_net,
      s3_air, s3_rail, s3_road, s3_hotel, s3_commuting, s3_transport, s3_waste, s3_total, s3_net,
      total_s1s2_loc_gross, total_s1s2_loc_net, total_s1s2_mkt_gross, total_s1s2_mkt_net
    ]);

    console.log('[CalculationStorage] Updated summary for period:', reportingPeriodId);
  } catch (err) {
    console.error('[CalculationStorage] Failed to update summary:', err);
    // Don't throw, just log - we don't want to fail the main response if summary update fails
  }
}

/**
 * Get the latest calculation for a specific activity
 * 
 * @param {UUID} activityId - Activity ID
 * @returns {Promise<Object|null>} Latest calculation result or null
 */
async function getLatestCalculation(activityId) {
  try {
    const query = `
      SELECT *
      FROM emission_calculations
      WHERE activity_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const result = await pool.query(query, [activityId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('[CalculationStorage] Error getting latest calculation:', error);
    throw error;
  }
}

/**
 * Get all calculations for a reporting period
 * 
 * @param {UUID} reportingPeriodId - Reporting period ID
 * @param {Object} [options] - Query options
 * @param {boolean} [options.latestOnly=true] - Only return latest calculation per activity
 * @param {string} [options.activityType] - Filter by activity type
 * @returns {Promise<Array>} List of calculation results
 */
async function getCalculationsByReportingPeriod(reportingPeriodId, options = {}) {
  const { latestOnly = true, activityType } = options;
  
  try {
    let query;
    let values;
    
    if (latestOnly) {
      // Get only the latest calculation for each activity
      query = `
        SELECT DISTINCT ON (activity_id) *
        FROM emission_calculations
        WHERE reporting_period_id = $1
          ${activityType ? 'AND activity_type = $2' : ''}
        ORDER BY activity_id, created_at DESC
      `;
      values = activityType ? [reportingPeriodId, activityType] : [reportingPeriodId];
    } else {
      // Get all calculations (full history)
      query = `
        SELECT *
        FROM emission_calculations
        WHERE reporting_period_id = $1
          ${activityType ? 'AND activity_type = $2' : ''}
        ORDER BY created_at DESC
      `;
      values = activityType ? [reportingPeriodId, activityType] : [reportingPeriodId];
    }
    
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('[CalculationStorage] Error getting calculations by reporting period:', error);
    throw error;
  }
}

/**
 * Get calculation history for a specific activity
 * 
 * @param {UUID} activityId - Activity ID
 * @param {number} [limit=10] - Maximum number of records to return
 * @returns {Promise<Array>} Calculation history
 */
async function getCalculationHistory(activityId, limit = 10) {
  try {
    const query = `
      SELECT *
      FROM emission_calculations
      WHERE activity_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [activityId, limit]);
    return result.rows;
  } catch (error) {
    console.error('[CalculationStorage] Error getting calculation history:', error);
    throw error;
  }
}

/**
 * Aggregate calculation results for a reporting period
 * 
 * @param {UUID} reportingPeriodId - Reporting period ID
 * @returns {Promise<Object>} Aggregated totals
 */
async function aggregateCalculationsForPeriod(reportingPeriodId) {
  try {
    // Get latest calculation for each activity
    // Note: We cast metadata fields safely, with fallbacks
    const query = `
      SELECT DISTINCT ON (activity_id)
        activity_id,
        activity_type,
        co2_kg,
        ch4_g,
        n2o_g,
        co2e_metric_tons as total_co2e_mt,
        calculation_metadata
      FROM emission_calculations
      WHERE reporting_period_id = $1
      ORDER BY activity_id, created_at DESC
    `;
    
    const result = await pool.query(query, [reportingPeriodId]);
    
    // Aggregate by activity type and overall
    const aggregation = {
      total_co2_mt: 0,
      total_ch4_co2e_mt: 0,
      total_n2o_co2e_mt: 0,
      total_co2e_mt: 0,
      total_biomass_co2_mt: 0,
      byActivityType: {}
    };
    
    result.rows.forEach(row => {
      const meta = row.calculation_metadata || {};
      
      // By activity type
      if (!aggregation.byActivityType[row.activity_type]) {
        aggregation.byActivityType[row.activity_type] = {
          total_co2e_mt: 0,
          location_based_co2e_mt: 0,
          market_based_co2e_mt: 0,
          count: 0
        };
      }
      
      const typeAgg = aggregation.byActivityType[row.activity_type];
      
      // Scope 2 specific logic
      if (['electricity', 'steam'].includes(row.activity_type)) {
        typeAgg.location_based_co2e_mt += parseFloat(meta.location_based?.total_co2e_mt || row.total_co2e_mt || 0);
        typeAgg.market_based_co2e_mt += parseFloat(meta.market_based?.total_co2e_mt || row.total_co2e_mt || 0);
        // Still track total_co2e_mt as location-based for general consistency
        typeAgg.total_co2e_mt += parseFloat(row.total_co2e_mt || 0);
      } else {
        typeAgg.total_co2e_mt += parseFloat(row.total_co2e_mt || 0);
      }
      
      typeAgg.count++;
      
      // Global totals
      aggregation.total_co2e_mt += parseFloat(row.total_co2e_mt || 0);
    });
    
    return aggregation;
  } catch (error) {
    console.error('[CalculationStorage] Error aggregating calculations:', error);
    throw error;
  }
}

/**
 * Compare two calculation results (for recalculation analysis)
 * 
 * @param {UUID} calculation1Id - First calculation ID
 * @param {UUID} calculation2Id - Second calculation ID
 * @returns {Promise<Object>} Comparison results
 */
async function compareCalculations(calculation1Id, calculation2Id) {
  try {
    const query = `
      SELECT *
      FROM emission_calculations
      WHERE id IN ($1, $2)
      ORDER BY created_at
    `;
    
    const result = await pool.query(query, [calculation1Id, calculation2Id]);
    
    if (result.rows.length !== 2) {
      throw new Error('One or both calculation records not found');
    }
    
    const [calc1, calc2] = result.rows;
    
    const calc1_total = parseFloat(calc1.co2e_metric_tons);
    const calc2_total = parseFloat(calc2.co2e_metric_tons);
    const calc1_bio = parseFloat((calc1.calculation_metadata?.biomass_co2_mt) || 0);
    const calc2_bio = parseFloat((calc2.calculation_metadata?.biomass_co2_mt) || 0);

    return {
      calculation1: calc1,
      calculation2: calc2,
      differences: {
        co2_mt_change: (parseFloat(calc2.co2_kg) - parseFloat(calc1.co2_kg)) / 1000,
        total_co2e_mt_change: calc2_total - calc1_total,
        biomass_co2_mt_change: calc2_bio - calc1_bio
      },
      percentChanges: {
        total_co2e_mt_percent: calc1_total 
          ? ((calc2_total - calc1_total) / calc1_total * 100)
          : 0
      },
      factorVersionChanged: false // Simplified
    };
  } catch (error) {
    console.error('[CalculationStorage] Error comparing calculations:', error);
    throw error;
  }
}

/**
 * Get calculation statistics for a reporting period
 * 
 * @param {UUID} reportingPeriodId - Reporting period ID
 * @returns {Promise<Object>} Statistics
 */
async function getCalculationStats(reportingPeriodId) {
  try {
    const query = `
      SELECT 
        COUNT(DISTINCT activity_id) as total_activities,
        COUNT(*) as total_calculations,
        COUNT(DISTINCT activity_type) as activity_types_count,
        MIN(created_at) as first_calculation_at,
        MAX(created_at) as last_calculation_at
      FROM emission_calculations
      WHERE reporting_period_id = $1
    `;
    
    const result = await pool.query(query, [reportingPeriodId]);
    return result.rows[0];
  } catch (error) {
    console.error('[CalculationStorage] Error getting calculation stats:', error);
    throw error;
  }
}

export {
  storeCalculationResult,
  updateReportingPeriodSummary,
  getLatestCalculation,
  getCalculationsByReportingPeriod,
  getCalculationHistory,
  aggregateCalculationsForPeriod,
  compareCalculations,
  getCalculationStats
};
