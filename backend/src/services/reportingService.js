/**
 * ========================================================================
 * REPORTING SERVICE
 * ========================================================================
 * 
 * Advanced reporting features:
 * - Multi-period trends and comparisons
 * - Scope 1/2/3 breakdowns
 * - Goal tracking and progress
 * - Emission intensity metrics
 */

import pool from '../utils/db.js';

/**
 * Get emissions trends across multiple reporting periods
 */
async function getEmissionsTrends(companyId, options = {}) {
  const { startDate, endDate, groupBy = 'month', activityType } = options;
  
  try {
    let whereClause = 'WHERE rp.company_id = $1';
    const params = [companyId];
    
    if (startDate) {
      params.push(startDate);
      whereClause += ` AND rp.period_start_date >= $${params.length}`;
    }
    
    if (endDate) {
      params.push(endDate);
      whereClause += ` AND rp.period_end_date <= $${params.length}`;
    }
    
    if (activityType) {
      params.push(activityType);
      whereClause += ` AND ec.activity_type = $${params.length}`;
    }
    
    // We need to join with a subquery that gets only the latest calculation per activity
    const query = `
      WITH LatestCalculations AS (
        SELECT DISTINCT ON (activity_id) *
        FROM emission_calculations
        ORDER BY activity_id, created_at DESC
      )
      SELECT 
        rp.id as period_id,
        rp.period_label,
        rp.period_start_date,
        rp.period_end_date,
        ec.activity_type,
        CASE 
          WHEN ec.activity_type::text IN (
            'stationary_combustion', 'mobile_sources', 
            'refrigeration_ac', 'refrigeration_ac_material_balance', 'refrigeration_ac_simplified_material_balance', 'refrigeration_ac_screening_method', 
            'fire_suppression', 'fire_suppression_material_balance', 'fire_suppression_simplified_material_balance', 'fire_suppression_screening_method', 
            'purchased_gases'
          ) THEN 'scope_1'
          WHEN ec.activity_type::text IN ('electricity', 'steam') THEN 'scope_2'
          ELSE 'scope_3'
        END as scope,
        SUM(ec.co2e_metric_tons) as total_co2e_mt,
        COUNT(DISTINCT ec.activity_id) as activity_count
      FROM reporting_periods rp
      LEFT JOIN LatestCalculations ec ON ec.reporting_period_id = rp.id
      ${whereClause}
      GROUP BY rp.id, rp.period_label, rp.period_start_date, rp.period_end_date, ec.activity_type
      ORDER BY rp.period_start_date
    `;
    
    const result = await pool.query(query, params);
    
    // Group by period
    const periodMap = new Map();
    result.rows.forEach(row => {
      if (!periodMap.has(row.period_id)) {
        periodMap.set(row.period_id, {
          period_id: row.period_id,
          period_label: row.period_label,
          period_start: row.period_start_date,
          period_end: row.period_end_date,
          total_emissions: 0,
          by_scope: { scope_1: 0, scope_2: 0, scope_3: 0 },
          by_activity_type: {},
          activity_count: 0
        });
      }
      
      const period = periodMap.get(row.period_id);
      const emissions = parseFloat(row.total_co2e_mt || 0);
      
      period.total_emissions += emissions;
      if (row.scope) {
        period.by_scope[row.scope] = (period.by_scope[row.scope] || 0) + emissions;
      }
      if (row.activity_type) {
        period.by_activity_type[row.activity_type] = 
          (period.by_activity_type[row.activity_type] || 0) + emissions;
      }
      period.activity_count += parseInt(row.activity_count || 0);
    });
    
    return Array.from(periodMap.values());
  } catch (error) {
    throw new Error(`Error fetching emissions trends: ${error.message}`);
  }
}

/**
 * Get detailed scope breakdown for a reporting period
 */
async function getScopeBreakdown(reportingPeriodId) {
  try {
    const query = `
      WITH LatestCalculations AS (
        SELECT DISTINCT ON (activity_id) *
        FROM emission_calculations
        WHERE reporting_period_id = $1
        ORDER BY activity_id, created_at DESC
      )
      SELECT 
        CASE 
          WHEN activity_type::text IN (
            'stationary_combustion', 'mobile_sources', 
            'refrigeration_ac', 'refrigeration_ac_material_balance', 'refrigeration_ac_simplified_material_balance', 'refrigeration_ac_screening_method', 
            'fire_suppression', 'fire_suppression_material_balance', 'fire_suppression_simplified_material_balance', 'fire_suppression_screening_method', 
            'purchased_gases'
          ) THEN 'scope_1'
          WHEN activity_type::text IN ('electricity', 'steam') THEN 'scope_2'
          WHEN activity_type::text = 'offsets' THEN 'offsets'
          ELSE 'scope_3'
        END as scope,
        activity_type,
        COUNT(*) as calculation_count,
        SUM(co2e_metric_tons) as total_co2e_mt,
        SUM(co2_kg / 1000.0) as total_co2_mt,
        SUM((calculation_metadata->>'ch4_co2e_mt')::numeric) as total_ch4_co2e_mt,
        SUM((calculation_metadata->>'n2o_co2e_mt')::numeric) as total_n2o_co2e_mt,
        MIN(created_at) as first_calculation,
        MAX(created_at) as last_calculation
      FROM LatestCalculations
      GROUP BY scope, activity_type
      ORDER BY scope, total_co2e_mt DESC
    `;
    
    const result = await pool.query(query, [reportingPeriodId]);
    
    const breakdown = {
      scope_1: { total: 0, activities: [] },
      scope_2: { total: 0, activities: [] },
      scope_3: { total: 0, activities: [] }
    };
    
    result.rows.forEach(row => {
      const scope = row.scope;
      if (breakdown[scope]) {
        const emissions = parseFloat(row.total_co2e_mt || 0);
        breakdown[scope].total += emissions;
        breakdown[scope].activities.push({
          activity_type: row.activity_type,
          emissions: emissions,
          co2: parseFloat(row.total_co2_mt || 0),
          ch4_co2e: parseFloat(row.total_ch4_co2e_mt || 0),
          n2o_co2e: parseFloat(row.total_n2o_co2e_mt || 0),
          calculation_count: parseInt(row.calculation_count),
          first_calculation: row.first_calculation,
          last_calculation: row.last_calculation
        });
      }
    });
    
    const grandTotal = breakdown.scope_1.total + breakdown.scope_2.total + breakdown.scope_3.total;
    
    return {
      grand_total: grandTotal,
      scope_1: breakdown.scope_1,
      scope_2: breakdown.scope_2,
      scope_3: breakdown.scope_3,
      percentages: {
        scope_1: grandTotal > 0 ? (breakdown.scope_1.total / grandTotal * 100).toFixed(2) : 0,
        scope_2: grandTotal > 0 ? (breakdown.scope_2.total / grandTotal * 100).toFixed(2) : 0,
        scope_3: grandTotal > 0 ? (breakdown.scope_3.total / grandTotal * 100).toFixed(2) : 0
      }
    };
  } catch (error) {
    throw new Error(`Error fetching scope breakdown: ${error.message}`);
  }
}

/**
 * Compare two reporting periods
 */
async function comparePeriods(periodId1, periodId2) {
  try {
    const breakdown1 = await getScopeBreakdown(periodId1);
    const breakdown2 = await getScopeBreakdown(periodId2);
    
    const calculateChange = (val1, val2) => {
      if (val1 === 0) return val2 > 0 ? 100 : 0;
      return ((val2 - val1) / val1 * 100).toFixed(2);
    };
    
    return {
      period1: { id: periodId1, ...breakdown1 },
      period2: { id: periodId2, ...breakdown2 },
      changes: {
        grand_total_change: calculateChange(breakdown1.grand_total, breakdown2.grand_total),
        scope_1_change: calculateChange(breakdown1.scope_1.total, breakdown2.scope_1.total),
        scope_2_change: calculateChange(breakdown1.scope_2.total, breakdown2.scope_2.total),
        scope_3_change: calculateChange(breakdown1.scope_3.total, breakdown2.scope_3.total)
      }
    };
  } catch (error) {
    throw new Error(`Error comparing periods: ${error.message}`);
  }
}

/**
 * Get emission intensity metrics
 */
async function getEmissionIntensity(reportingPeriodId, options = {}) {
  const { revenue, employees, floorArea, production } = options;
  
  try {
    const breakdown = await getScopeBreakdown(reportingPeriodId);
    const totalEmissions = breakdown.grand_total;
    
    const metrics = {
      total_emissions: totalEmissions,
      intensity_metrics: {}
    };
    
    if (revenue) {
      metrics.intensity_metrics.per_revenue = (totalEmissions / revenue).toFixed(6);
      metrics.intensity_metrics.revenue_currency = options.currency || 'USD';
    }
    
    if (employees) {
      metrics.intensity_metrics.per_employee = (totalEmissions / employees).toFixed(6);
    }
    
    if (floorArea) {
      metrics.intensity_metrics.per_sqm = (totalEmissions / floorArea).toFixed(6);
    }
    
    if (production) {
      metrics.intensity_metrics.per_unit_production = (totalEmissions / production).toFixed(6);
      metrics.intensity_metrics.production_unit = options.productionUnit || 'units';
    }
    
    return metrics;
  } catch (error) {
    throw new Error(`Error calculating emission intensity: ${error.message}`);
  }
}

/**
 * Track goals and progress
 */
async function getGoalProgress(companyId, goalYear) {
  try {
    // Shared CTE for getting latest calculations for a given year
    const getEmissionsForYear = async (year) => {
      const query = `
        WITH LatestCalculations AS (
          SELECT DISTINCT ON (activity_id) *
          FROM emission_calculations
          WHERE company_id = $1
          ORDER BY activity_id, created_at DESC
        )
        SELECT 
          SUM(lc.co2e_metric_tons) as total_emissions,
          rp.period_label
        FROM LatestCalculations lc
        JOIN reporting_periods rp ON rp.id = lc.reporting_period_id
        WHERE EXTRACT(YEAR FROM rp.period_start_date) = $2
        GROUP BY rp.period_label
        LIMIT 1
      `;
      const res = await pool.query(query, [companyId, year]);
      return res.rows.length > 0 ? {
        emissions: parseFloat(res.rows[0].total_emissions),
        period: res.rows[0].period_label
      } : null;
    };

    const baselineData = await getEmissionsForYear(goalYear);
    
    if (!baselineData) {
      throw new Error(`No baseline data found for year ${goalYear}`);
    }
    
    const baselineEmissions = baselineData.emissions;
    
    // Get current year emissions
    const currentYear = new Date().getFullYear();
    const currentData = await getEmissionsForYear(currentYear);
    const currentEmissions = currentData ? currentData.emissions : 0;
    
    const reductionAchieved = baselineEmissions - currentEmissions;
    const reductionPercent = (reductionAchieved / baselineEmissions * 100).toFixed(2);
    
    return {
      baseline_year: goalYear,
      baseline_emissions: baselineEmissions,
      current_year: currentYear,
      current_emissions: currentEmissions,
      reduction_achieved: reductionAchieved,
      reduction_percent: reductionPercent,
      on_track: reductionPercent > 0
    };
  } catch (error) {
    throw new Error(`Error tracking goal progress: ${error.message}`);
  }
}

export {
  getEmissionsTrends,
  getScopeBreakdown,
  comparePeriods,
  getEmissionIntensity,
  getGoalProgress
};
