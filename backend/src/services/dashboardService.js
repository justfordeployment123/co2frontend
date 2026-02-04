/**
 * ========================================================================
 * DASHBOARD SERVICE
 * ========================================================================
 * 
 * Business logic for dashboard KPIs, alerts, and analytics
 */

import pool from '../utils/db.js';

/**
 * Get KPIs for a company
 * @param {number} companyId - Company ID
 * @param {number} periodId - Optional specific period ID
 * @returns {Promise<object>} KPI data
 */
export async function getCompanyKPIs(companyId, periodId = null) {
  // Check if periodId is a valid UUID, otherwise ignore it
  const isValidUUID = periodId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(periodId);
  
  const periodFilter = isValidUUID ? 'AND rp.id = $2' : '';
  const params = isValidUUID ? [companyId, periodId] : [companyId];

  // Get Scope 2 specific breakdown (Location vs Market)
  const scope2Query = await pool.query(
    `SELECT 
       SUM(ec.location_based_co2e_mt) as location_based,
       SUM(ec.market_based_co2e_mt) as market_based
     FROM emission_calculations ec
     WHERE ec.company_id = $1 ${periodFilter ? 'AND ec.reporting_period_id = $2' : ''}
       AND ec.activity_type IN ('electricity', 'steam')`,
    params
  );
  
  const scope2Data = {
    location: parseFloat(scope2Query.rows[0]?.location_based || 0),
    market: parseFloat(scope2Query.rows[0]?.market_based || 0)
  };

  // Get total emissions from emission_calculations table
  // Use market-based for Scope 2, regular co2e for others
  const emissionsQuery = await pool.query(
    `SELECT 
       SUM(
         CASE 
           WHEN ec.activity_type IN ('electricity', 'steam') THEN ec.market_based_co2e_mt
           ELSE ec.co2e_metric_tons
         END
       ) as total_emissions,
       SUM(ec.co2_kg / 1000) as total_co2,
       SUM(ec.ch4_g / 1000000) as total_ch4,
       SUM(ec.n2o_g / 1000000) as total_n2o,
       COUNT(DISTINCT ec.reporting_period_id) as period_count,
       COUNT(*) as calculation_count
     FROM emission_calculations ec
     WHERE ec.company_id = $1 ${periodFilter ? 'AND ec.reporting_period_id = $2' : ''}`,
    params
  );

  const emissions = emissionsQuery.rows[0];

  // Get scope breakdown (Using Case logic but now we have explicit S2)
  const scopeQuery = await pool.query(
    `SELECT 
       CASE 
         WHEN ec.activity_type IN ('stationary_combustion', 'mobile_sources', 'refrigeration_ac', 'refrigeration_ac_material_balance', 'refrigeration_ac_simplified_material_balance', 'refrigeration_ac_screening_method', 'fire_suppression', 'fire_suppression_material_balance', 'fire_suppression_simplified_material_balance', 'fire_suppression_screening_method', 'purchased_gases') THEN 'Scope 1'
         WHEN ec.activity_type IN ('electricity', 'steam') THEN 'Scope 2'
         WHEN ec.activity_type = 'offsets' THEN 'Offsets'
         ELSE 'Scope 3'
       END as scope,
       SUM(
         CASE 
           WHEN ec.activity_type IN ('electricity', 'steam') THEN ec.market_based_co2e_mt
           ELSE ec.co2e_metric_tons
         END
       ) as emissions
     FROM emission_calculations ec
     WHERE ec.company_id = $1 ${periodFilter ? 'AND ec.reporting_period_id = $2' : ''}
     GROUP BY scope`,
    params
  );

  const scopeBreakdown = scopeQuery.rows.reduce((acc, row) => {
    acc[row.scope] = parseFloat(row.emissions || 0);
    return acc;
  }, {});

  // Get activity type breakdown
  const activityQuery = await pool.query(
    `SELECT 
       ec.activity_type,
       SUM(ec.co2e_metric_tons) as emissions,
       COUNT(*) as activity_count
     FROM emission_calculations ec
     WHERE ec.company_id = $1 ${periodFilter ? 'AND ec.reporting_period_id = $2' : ''}
     GROUP BY ec.activity_type
     ORDER BY emissions DESC`,
    params
  );

  // Get trends (last 12 months) - join with reporting_periods to get dates
  const trendsQuery = await pool.query(
    `SELECT 
       DATE_TRUNC('month', rp.period_start_date) as month,
       SUM(ec.co2e_metric_tons) as emissions
     FROM emission_calculations ec
     JOIN reporting_periods rp ON ec.reporting_period_id = rp.id
     WHERE ec.company_id = $1 
       AND rp.period_start_date >= NOW() - INTERVAL '12 months'
     GROUP BY DATE_TRUNC('month', rp.period_start_date)
     ORDER BY month`,
    [companyId]
  );

  // Calculate traffic light ratings
  const scope1 = scopeBreakdown['Scope 1'] || 0;
  // Use Market Based as primary Scope 2 metric for total if available, else Location
  // Standard GHG protocol prefers Market based for goals? Or Dual.
  // We'll stick to the summed total_co2e_mt from DB which might default to Location or Market depending on logic.
  // Actually, 'emissions.total_emissions' sums co2e_metric_tons column.
  // activityController (Step 4458) sets total_co2e_mt = loc_co2e_mt as default legacy.
  const scope2 = scopeBreakdown['Scope 2'] || 0; // This is Location based usually
  const scope3 = scopeBreakdown['Scope 3'] || 0;
  const totalEmissions = parseFloat(emissions.total_emissions || 0);

  // Industry baseline assumptions (can be configured per industry)
  // TODO: Fetch from company settings or industry average table
  const industryBaselines = {
    scope1: 500, // MT CO2e baseline
    scope2: 300,
    scope3: 800
  };

  const calculateTrafficLight = (actual, baseline) => {
    if (actual <= baseline * 0.75) return 'green'; // Better than baseline
    if (actual <= baseline * 1.25) return 'yellow';
    return 'red';
  };

  // Recommendations Logic
  const recommendations = [];
  if (scope2Data.market === 0 && scope2 > 0) {
    recommendations.push({
      id: 'rec_s2_market',
      text: "Enter Market-Based factors for electricity to improve accuracy.",
      impact: 'Medium'
    });
  }
  if (scope2Data.market > scope2Data.location) {
    recommendations.push({
      id: 'rec_s2_green',
      text: "Your Market-Based emissions are higher than Location-Based. Consider purchasing Green Contracts.",
      impact: 'High'
    });
  }
  if (scope1 > scope2 && scope1 > scope3) {
    recommendations.push({
      id: 'rec_s1_focus',
      text: "Scope 1 is your largest source. Focus on fleet electrification or heating efficiency.",
      impact: 'High'
    });
  }
  if (activityQuery.rows.some(r => r.activity_type === 'business_travel_air' && parseFloat(r.emissions) > totalEmissions * 0.1)) {
    recommendations.push({
      id: 'rec_travel',
      text: "Air travel contributes significantly (>10%). Consider virtual meeting policies.",
      impact: 'Medium'
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({ id: 'rec_gen', text: "Complete your data entry to get tailored recommendations.", impact: 'Low' });
  }

  // Completion Status Logic
  const activityTypesPresent = new Set(activityQuery.rows.map(r => r.activity_type));
  const coreScopes = {
    s1: ['stationary_combustion', 'mobile_sources', 'refrigeration_ac'].some(t => activityTypesPresent.has(t) || activityTypesPresent.has(t+'_material_balance')),
    s2: ['electricity', 'steam'].some(t => activityTypesPresent.has(t)),
    s3: ['business_travel_air', 'waste', 'transportation_distribution'].some(t => activityTypesPresent.has(t))
  };
  const completionPercent = ((coreScopes.s1 ? 33 : 0) + (coreScopes.s2 ? 33 : 0) + (coreScopes.s3 ? 34 : 0));

  // Data Quality Counts
  const activityCount = parseInt(emissions.calculation_count || 0); // Total calculations
  // Simple heuristic: < 5 low, 5-15 med, > 15 high
  
  return {
    scope1,
    scope2, // Default (Location)
    scope2_location: scope2Data.location, // Explicit Location
    scope2_market: scope2Data.market,     // Explicit Market
    scope3,
    totalEmissions,
    traffic_light: calculateTrafficLight(totalEmissions, 
      industryBaselines.scope1 + industryBaselines.scope2 + industryBaselines.scope3),
    traffic_light_scope1: calculateTrafficLight(scope1, industryBaselines.scope1),
    traffic_light_scope2: calculateTrafficLight(scope2, industryBaselines.scope2),
    traffic_light_scope3: calculateTrafficLight(scope3, industryBaselines.scope3),
    offsets: scopeBreakdown['Offsets'] || 0,
    recommendations,
    completionStatus: {
      dataEntry: completionPercent,
      csrdCompliance: completionPercent > 60 ? 80 : 40, // Mocked based on entry
      reportGeneration: completionPercent > 90 ? 100 : 0
    },
    dataQuality: {
      activityCount: activityCount,
      status: activityCount > 10 ? 'High' : (activityCount > 0 ? 'Medium' : 'Low')
    },
    ghgComposition: {
      co2: parseFloat(emissions.total_co2 || 0),
      ch4: parseFloat(emissions.total_ch4 || 0),
      n2o: parseFloat(emissions.total_n2o || 0)
    },
    scopeBreakdown,
    activityBreakdown: activityQuery.rows.map(row => ({
      activityType: row.activity_type,
      emissions: parseFloat(row.emissions || 0),
      activityCount: parseInt(row.activity_count)
    })),
    periodCount: parseInt(emissions.period_count || 0),
    calculationCount: parseInt(emissions.calculation_count || 0),
    trends: trendsQuery.rows.map(row => ({
      month: row.month,
      emissions: parseFloat(row.emissions || 0)
    }))
  };
}

/**
 * Get emissions intensity metrics
 * @param {number} companyId - Company ID
 * @param {number} periodId - Reporting period ID
 * @param {object} metricsData - Revenue, employees, sqm, production units
 * @returns {Promise<object>} Intensity metrics
 */
export async function getEmissionsIntensity(companyId, periodId, metricsData) {
  const { revenue, employees, squareMeters, productionUnits } = metricsData;

  // Get total emissions for period from emission_calculations
  const emissionsQuery = await pool.query(
    `SELECT 
       SUM(ec.co2e_metric_tons) as total_emissions
     FROM emission_calculations ec
     WHERE ec.reporting_period_id = $1`,
    [periodId]
  );

  const totalEmissions = parseFloat(emissionsQuery.rows[0]?.total_emissions || 0);

  const intensity = {};

  if (revenue) {
    intensity.perRevenue = totalEmissions / revenue; // MT CO2e per $1M revenue
    intensity.revenueUnit = '$1M';
  }

  if (employees) {
    intensity.perEmployee = totalEmissions / employees; // MT CO2e per employee
  }

  if (squareMeters) {
    intensity.perSquareMeter = totalEmissions / squareMeters; // MT CO2e per sqm
  }

  if (productionUnits) {
    intensity.perProductionUnit = totalEmissions / productionUnits; // MT CO2e per unit
  }

  return {
    totalEmissions,
    intensity
  };
}

/**
 * Generate alerts based on emission thresholds
 * @param {number} companyId - Company ID
 * @param {object} thresholds - Alert thresholds
 * @returns {Promise<array>} Array of alerts
 */
export async function generateAlerts(companyId, thresholds = {}) {
  const {
    highEmissionThreshold = 1000, // MT CO2e
    monthlyIncreaseThreshold = 0.15, // 15%
    scope1Threshold = 500,
    scope2Threshold = 500
  } = thresholds;

  const alerts = [];

  // Get latest period
  const latestPeriod = await pool.query(
    `SELECT id, period_label FROM reporting_periods 
     WHERE company_id = $1 
     ORDER BY start_date DESC LIMIT 1`,
    [companyId]
  );

  if (latestPeriod.rows.length === 0) {
    return alerts;
  }

  const periodId = latestPeriod.rows[0].id;
  const periodName = latestPeriod.rows[0].period_label;

  // Check total emissions threshold
  const totalQuery = await pool.query(
    `SELECT SUM(ec.co2e_metric_tons) as total
     FROM emission_calculations ec WHERE ec.reporting_period_id = $1`,
    [periodId]
  );

  const totalEmissions = parseFloat(totalQuery.rows[0]?.total || 0);

  if (totalEmissions > highEmissionThreshold) {
    alerts.push({
      alertType: 'High Emissions Detected',
      severity: 'high',
      message: `Total emissions of ${totalEmissions.toFixed(2)} MT CO2e exceed threshold of ${highEmissionThreshold} MT CO2e`,
      periodName,
      value: totalEmissions,
      threshold: highEmissionThreshold
    });
  }

  // Check month-over-month increase
  const previousPeriod = await pool.query(
    `SELECT id FROM reporting_periods 
     WHERE company_id = $1 AND start_date < (
       SELECT start_date FROM reporting_periods WHERE id = $2
     )
     ORDER BY start_date DESC LIMIT 1`,
    [companyId, periodId]
  );

  if (previousPeriod.rows.length > 0) {
    const prevQuery = await pool.query(
      `SELECT SUM(ec.co2e_metric_tons) as total
       FROM emission_calculations ec WHERE ec.reporting_period_id = $1`,
      [previousPeriod.rows[0].id]
    );

    const prevEmissions = parseFloat(prevQuery.rows[0]?.total || 0);
    
    if (prevEmissions > 0) {
      const increase = (totalEmissions - prevEmissions) / prevEmissions;
      
      if (increase > monthlyIncreaseThreshold) {
        alerts.push({
          alertType: 'Significant Increase Detected',
          severity: 'medium',
          message: `Emissions increased by ${(increase * 100).toFixed(1)}% from previous period`,
          periodName,
          value: increase,
          threshold: monthlyIncreaseThreshold
        });
      }
    }
  }

  // Check scope-specific thresholds
  const scopeQuery = await pool.query(
    `SELECT 
       CASE 
         WHEN ec.activity_type IN (
           'stationary_combustion', 'mobile_sources', 
           'refrigeration_ac', 'refrigeration_ac_material_balance', 'refrigeration_ac_simplified_material_balance', 'refrigeration_ac_screening_method', 
           'fire_suppression', 'fire_suppression_material_balance', 'fire_suppression_simplified_material_balance', 'fire_suppression_screening_method', 
           'purchased_gases'
         ) THEN 'Scope 1'
         WHEN ec.activity_type IN ('electricity', 'steam') THEN 'Scope 2'
         ELSE 'Scope 3'
       END as scope,
       SUM(ec.co2e_metric_tons) as emissions
     FROM emission_calculations ec
     WHERE ec.reporting_period_id = $1
     GROUP BY scope`,
    [periodId]
  );

  scopeQuery.rows.forEach(row => {
    const emissions = parseFloat(row.emissions || 0);
    
    if (row.scope === 'Scope 1' && emissions > scope1Threshold) {
      alerts.push({
        alertType: `${row.scope} Threshold Exceeded`,
        severity: 'medium',
        message: `${row.scope} emissions of ${emissions.toFixed(2)} MT CO2e exceed threshold`,
        periodName,
        value: emissions,
        threshold: scope1Threshold
      });
    }
    
    if (row.scope === 'Scope 2' && emissions > scope2Threshold) {
      alerts.push({
        alertType: `${row.scope} Threshold Exceeded`,
        severity: 'medium',
        message: `${row.scope} emissions of ${emissions.toFixed(2)} MT CO2e exceed threshold`,
        periodName,
        value: emissions,
        threshold: scope2Threshold
      });
    }
  });

  return alerts;
}

/**
 * Get benchmark comparison
 * @param {number} companyId - Company ID
 * @param {string} industry - Industry sector
 * @param {number} periodId - Reporting period ID
 * @returns {Promise<object>} Benchmark data
 */
export async function getBenchmarkComparison(companyId, industry, periodId) {
  // Get company emissions
  const companyQuery = await pool.query(
    `SELECT SUM(ec.co2e_metric_tons) as total
     FROM emission_calculations ec WHERE ec.reporting_period_id = $1`,
    [periodId]
  );

  const companyEmissions = parseFloat(companyQuery.rows[0]?.total || 0);

  // Get industry average (from companies in same industry)
  const industryQuery = await pool.query(
    `SELECT 
       AVG(total_emissions) as avg_emissions,
       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_emissions) as median_emissions,
       PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY total_emissions) as percentile_25,
       PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY total_emissions) as percentile_75,
       COUNT(*) as company_count
     FROM (
       SELECT 
         c.id,
         SUM(ec.co2e_metric_tons) as total_emissions
       FROM companies c
       JOIN reporting_periods rp ON c.id = rp.company_id
       JOIN emission_calculations ec ON rp.id = ec.reporting_period_id
       WHERE c.industry = $1 AND c.id != $2
       GROUP BY c.id
     ) industry_data`,
    [industry, companyId]
  );

  const industryData = industryQuery.rows[0];

  const benchmarkData = {
    companyEmissions,
    industry,
    industryAverage: parseFloat(industryData.avg_emissions || 0),
    industryMedian: parseFloat(industryData.median_emissions || 0),
    percentile25: parseFloat(industryData.percentile_25 || 0),
    percentile75: parseFloat(industryData.percentile_75 || 0),
    companyCount: parseInt(industryData.company_count || 0)
  };

  // Calculate percentile ranking
  if (benchmarkData.industryMedian > 0) {
    if (companyEmissions < benchmarkData.percentile25) {
      benchmarkData.ranking = 'Top 25% (Low Emissions)';
    } else if (companyEmissions < benchmarkData.industryMedian) {
      benchmarkData.ranking = 'Below Average';
    } else if (companyEmissions < benchmarkData.percentile75) {
      benchmarkData.ranking = 'Above Average';
    } else {
      benchmarkData.ranking = 'Top 75% (High Emissions)';
    }

    benchmarkData.percentageDiff = ((companyEmissions - benchmarkData.industryAverage) / benchmarkData.industryAverage * 100).toFixed(1);
  }

  return benchmarkData;
}

/**
 * Get reduction targets and progress
 * @param {number} companyId - Company ID
 * @param {object} targetData - Target configuration
 * @returns {Promise<object>} Target progress
 */
export async function getTargetProgress(companyId, targetData) {
  const { baselineYear, targetYear, reductionPercent, baselinePeriodId } = targetData;

  // Get baseline emissions
  const baselineQuery = await pool.query(
    `SELECT SUM(ec.co2e_metric_tons) as total
     FROM emission_calculations ec WHERE ec.reporting_period_id = $1`,
    [baselinePeriodId]
  );

  const baselineEmissions = parseFloat(baselineQuery.rows[0]?.total || 0);
  const targetEmissions = baselineEmissions * (1 - reductionPercent / 100);

  // Get current year emissions
  const currentQuery = await pool.query(
    `SELECT 
       rp.id, rp.period_label,
       SUM(ec.co2e_metric_tons) as total
     FROM emission_calculations ec
     JOIN reporting_periods rp ON ec.reporting_period_id = rp.id
     WHERE rp.company_id = $1
     ORDER BY rp.period_start_date DESC LIMIT 1`,
    [companyId]
  );

  const currentEmissions = parseFloat(currentQuery.rows[0]?.total || 0);
  const reductionAchieved = baselineEmissions - currentEmissions;
  const reductionRequired = baselineEmissions - targetEmissions;
  const progressPercent = reductionRequired > 0 ? (reductionAchieved / reductionRequired * 100) : 0;

  return {
    baselineYear,
    baselineEmissions,
    targetYear,
    targetEmissions,
    reductionPercent,
    currentEmissions,
    reductionAchieved,
    reductionRequired,
    progressPercent,
    onTrack: progressPercent >= 50, // Simple heuristic
    yearsRemaining: targetYear - new Date().getFullYear()
  };
}

export default {
  getCompanyKPIs,
  getEmissionsIntensity,
  generateAlerts,
  getBenchmarkComparison,
  getTargetProgress
};
