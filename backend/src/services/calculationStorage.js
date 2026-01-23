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
    const query = `
      INSERT INTO calculation_results (
        activity_id,
        reporting_period_id,
        activity_type,
        co2_mt,
        ch4_co2e_mt,
        n2o_co2e_mt,
        total_co2e_mt,
        biomass_co2_mt,
        calculation_breakdown,
        emission_factor_version,
        reporting_standard,
        calculated_at,
        calculated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12)
      RETURNING *
    `;
    
    const values = [
      activityId,
      reportingPeriodId,
      activityType,
      calculationResult.co2_mt || 0,
      calculationResult.ch4_co2e_mt || 0,
      calculationResult.n2o_co2e_mt || 0,
      calculationResult.total_co2e_mt || 0,
      calculationResult.biomass_co2_mt || 0,
      JSON.stringify(calculationResult), // Full breakdown
      factorVersion,
      standard,
      calculatedBy
    ];
    
    const result = await pool.query(query, values);
    
    console.log('[CalculationStorage] Stored calculation result:', {
      calculationId: result.rows[0].id,
      activityId,
      total_co2e_mt: calculationResult.total_co2e_mt
    });
    
    return result.rows[0];
  } catch (error) {
    console.error('[CalculationStorage] Error storing calculation result:', error);
    throw error;
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
      FROM calculation_results
      WHERE activity_id = $1
      ORDER BY calculated_at DESC
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
        FROM calculation_results
        WHERE reporting_period_id = $1
          ${activityType ? 'AND activity_type = $2' : ''}
        ORDER BY activity_id, calculated_at DESC
      `;
      values = activityType ? [reportingPeriodId, activityType] : [reportingPeriodId];
    } else {
      // Get all calculations (full history)
      query = `
        SELECT *
        FROM calculation_results
        WHERE reporting_period_id = $1
          ${activityType ? 'AND activity_type = $2' : ''}
        ORDER BY calculated_at DESC
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
      FROM calculation_results
      WHERE activity_id = $1
      ORDER BY calculated_at DESC
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
    const query = `
      SELECT DISTINCT ON (activity_id)
        activity_type,
        co2_mt,
        ch4_co2e_mt,
        n2o_co2e_mt,
        total_co2e_mt,
        biomass_co2_mt
      FROM calculation_results
      WHERE reporting_period_id = $1
      ORDER BY activity_id, calculated_at DESC
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
      // Overall totals
      aggregation.total_co2_mt += parseFloat(row.co2_mt || 0);
      aggregation.total_ch4_co2e_mt += parseFloat(row.ch4_co2e_mt || 0);
      aggregation.total_n2o_co2e_mt += parseFloat(row.n2o_co2e_mt || 0);
      aggregation.total_co2e_mt += parseFloat(row.total_co2e_mt || 0);
      aggregation.total_biomass_co2_mt += parseFloat(row.biomass_co2_mt || 0);
      
      // By activity type
      if (!aggregation.byActivityType[row.activity_type]) {
        aggregation.byActivityType[row.activity_type] = {
          co2_mt: 0,
          ch4_co2e_mt: 0,
          n2o_co2e_mt: 0,
          total_co2e_mt: 0,
          biomass_co2_mt: 0,
          count: 0
        };
      }
      
      const typeAgg = aggregation.byActivityType[row.activity_type];
      typeAgg.co2_mt += parseFloat(row.co2_mt || 0);
      typeAgg.ch4_co2e_mt += parseFloat(row.ch4_co2e_mt || 0);
      typeAgg.n2o_co2e_mt += parseFloat(row.n2o_co2e_mt || 0);
      typeAgg.total_co2e_mt += parseFloat(row.total_co2e_mt || 0);
      typeAgg.biomass_co2_mt += parseFloat(row.biomass_co2_mt || 0);
      typeAgg.count++;
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
      FROM calculation_results
      WHERE id IN ($1, $2)
      ORDER BY calculated_at
    `;
    
    const result = await pool.query(query, [calculation1Id, calculation2Id]);
    
    if (result.rows.length !== 2) {
      throw new Error('One or both calculation records not found');
    }
    
    const [calc1, calc2] = result.rows;
    
    return {
      calculation1: calc1,
      calculation2: calc2,
      differences: {
        co2_mt_change: calc2.co2_mt - calc1.co2_mt,
        ch4_co2e_mt_change: calc2.ch4_co2e_mt - calc1.ch4_co2e_mt,
        n2o_co2e_mt_change: calc2.n2o_co2e_mt - calc1.n2o_co2e_mt,
        total_co2e_mt_change: calc2.total_co2e_mt - calc1.total_co2e_mt,
        biomass_co2_mt_change: calc2.biomass_co2_mt - calc1.biomass_co2_mt
      },
      percentChanges: {
        total_co2e_mt_percent: calc1.total_co2e_mt 
          ? ((calc2.total_co2e_mt - calc1.total_co2e_mt) / calc1.total_co2e_mt * 100)
          : 0
      },
      factorVersionChanged: calc1.emission_factor_version !== calc2.emission_factor_version
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
        MIN(calculated_at) as first_calculation_at,
        MAX(calculated_at) as last_calculation_at
      FROM calculation_results
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
  getLatestCalculation,
  getCalculationsByReportingPeriod,
  getCalculationHistory,
  aggregateCalculationsForPeriod,
  compareCalculations,
  getCalculationStats
};
