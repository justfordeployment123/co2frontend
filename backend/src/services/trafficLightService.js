/**
 * ========================================================================
 * TRAFFIC LIGHT SCORING SERVICE
 * ========================================================================
 * 
 * Implements Green/Yellow/Red scoring system for emission reports
 * Based on:
 * - Industry benchmarks
 * - Emission intensity metrics
 * - Year-over-year trends
 * - Scope distribution patterns
 */

import pool from '../utils/db.js';

/**
 * Industry benchmark data (MT CO2e per employee per year)
 * Source: EPA, DEFRA, European Commission SME data
 */
const INDUSTRY_BENCHMARKS = {
  'Manufacturing': { excellent: 5, good: 10, poor: 20 },
  'Retail': { excellent: 2, good: 5, poor: 10 },
  'Technology': { excellent: 1.5, good: 3, poor: 6 },
  'Hospitality': { excellent: 3, good: 6, poor: 12 },
  'Healthcare': { excellent: 4, good: 8, poor: 15 },
  'Education': { excellent: 2.5, good: 5, poor: 10 },
  'Transportation': { excellent: 8, good: 15, poor: 30 },
  'Construction': { excellent: 6, good: 12, poor: 25 },
  'Financial Services': { excellent: 1.5, good: 3, poor: 6 },
  'Professional Services': { excellent: 2, good: 4, poor: 8 },
  'Default': { excellent: 3, good: 6, poor: 12 }
};

/**
 * Intensity thresholds (kg CO2e per € revenue)
 */
const INTENSITY_THRESHOLDS = {
  excellent: 0.05,  // < 0.05 kg CO2e/€
  good: 0.15,       // 0.05 - 0.15 kg CO2e/€
  poor: 0.15        // > 0.15 kg CO2e/€
};

/**
 * Calculate traffic light score for a reporting period
 * @param {string} reportingPeriodId - Reporting period ID
 * @param {object} companyMetrics - Optional company metrics (revenue, employees)
 * @returns {Promise<object>} Traffic light scores and insights
 */
export async function calculateTrafficLightScore(reportingPeriodId, companyMetrics = {}) {
  try {
    // Get reporting period and company data
    const periodQuery = await pool.query(
      `SELECT rp.*, c.industry, c.name as company_name
       FROM reporting_periods rp
       JOIN companies c ON rp.company_id = c.id
       WHERE rp.id = $1`,
      [reportingPeriodId]
    );

    if (periodQuery.rows.length === 0) {
      throw new Error('Reporting period not found');
    }

    const period = periodQuery.rows[0];
    const industry = period.industry || 'Default';

    // Get total emissions and scope breakdown
    // Note: 'scope' is stored in calculation_metadata JSONB, not as a direct column
    const emissionsQuery = await pool.query(
      `SELECT 
         SUM(co2e_metric_tons) as total_emissions,
         activity_type,
         calculation_metadata->>'scope' as scope
       FROM emission_calculations
       WHERE reporting_period_id = $1
       GROUP BY activity_type, calculation_metadata->>'scope'`,
      [reportingPeriodId]
    );

    if (emissionsQuery.rows.length === 0) {
      return {
        overall: 'yellow',
        message: 'No calculation data available for scoring',
        scope1: 'yellow',
        scope2: 'yellow',
        scope3: 'yellow',
        recommendations: ['Complete activity data entry and calculate emissions']
      };
    }

    // Calculate scope totals
    const scopeTotals = {
      scope_1: 0,
      scope_2: 0,
      scope_3: 0
    };

    emissionsQuery.rows.forEach(row => {
      const emissions = parseFloat(row.total_emissions || 0);
      if (row.scope) {
        scopeTotals[row.scope] = (scopeTotals[row.scope] || 0) + emissions;
      }
    });

    const totalEmissions = Object.values(scopeTotals).reduce((sum, val) => sum + val, 0);

    // Calculate intensity scores
    const intensityScores = [];
    const recommendations = [];

    // 1. Per-employee intensity (if employees provided)
    if (companyMetrics.employees && companyMetrics.employees > 0) {
      const perEmployee = totalEmissions / companyMetrics.employees;
      const benchmark = INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS.Default;

      intensityScores.push({
        type: 'per_employee',
        value: perEmployee,
        score: getScoreFromBenchmark(perEmployee, benchmark),
        benchmark
      });

      if (perEmployee > benchmark.good) {
        recommendations.push(`High emissions per employee (${perEmployee.toFixed(2)} MT CO2e). Industry benchmark: ${benchmark.good} MT CO2e/employee`);
      }
    }

    // 2. Per-revenue intensity (if revenue provided)
    if (companyMetrics.revenue && companyMetrics.revenue > 0) {
      const perRevenue = (totalEmissions * 1000) / companyMetrics.revenue; // kg CO2e per €
      
      intensityScores.push({
        type: 'per_revenue',
        value: perRevenue,
        score: getScoreFromIntensity(perRevenue),
        thresholds: INTENSITY_THRESHOLDS
      });

      if (perRevenue > INTENSITY_THRESHOLDS.good) {
        recommendations.push(`High carbon intensity (${perRevenue.toFixed(3)} kg CO2e/€). Target: < ${INTENSITY_THRESHOLDS.good} kg CO2e/€`);
      }
    }

    // 3. Scope distribution analysis
    const scopeDistribution = {
      scope_1: (scopeTotals.scope_1 / totalEmissions) * 100,
      scope_2: (scopeTotals.scope_2 / totalEmissions) * 100,
      scope_3: (scopeTotals.scope_3 / totalEmissions) * 100
    };

    // Ideal distribution for most SMEs: Scope 1 (20-40%), Scope 2 (30-50%), Scope 3 (20-40%)
    let distributionScore = 'green';
    if (scopeDistribution.scope_1 > 60 || scopeDistribution.scope_2 > 70) {
      distributionScore = 'red';
      recommendations.push('High concentration in direct emissions. Consider renewable energy and efficiency improvements.');
    } else if (scopeDistribution.scope_1 > 50 || scopeDistribution.scope_2 > 60) {
      distributionScore = 'yellow';
      recommendations.push('Moderate concentration in direct emissions. Opportunities for clean energy transition.');
    }

    // 4. Year-over-year trend (if previous period exists)
    const previousPeriodQuery = await pool.query(
      `SELECT rp.id, 
         SUM((cr.result_data->>'total_co2e_mt')::numeric) as total_emissions
       FROM reporting_periods rp
       LEFT JOIN calculation_results cr ON cr.reporting_period_id = rp.id AND cr.is_latest = true
       WHERE rp.company_id = $1 AND rp.period_end_date < $2
       GROUP BY rp.id
       ORDER BY rp.period_end_date DESC
       LIMIT 1`,
      [period.company_id, period.period_start_date]
    );

    let trendScore = 'yellow';
    if (previousPeriodQuery.rows.length > 0) {
      const previousEmissions = parseFloat(previousPeriodQuery.rows[0].total_emissions || 0);
      const change = ((totalEmissions - previousEmissions) / previousEmissions) * 100;

      if (change < -5) {
        trendScore = 'green';
        recommendations.push(`Excellent progress! Emissions reduced by ${Math.abs(change).toFixed(1)}% compared to previous period.`);
      } else if (change < 5) {
        trendScore = 'yellow';
        recommendations.push(`Emissions relatively stable (${change >= 0 ? '+' : ''}${change.toFixed(1)}%). Continue improvement efforts.`);
      } else {
        trendScore = 'red';
        recommendations.push(`Emissions increased by ${change.toFixed(1)}%. Immediate action needed to reverse trend.`);
      }
    }

    // Calculate scope-level scores
    const scopeScores = {
      scope_1: calculateScopeScore(scopeTotals.scope_1, scopeDistribution.scope_1, industry, 'scope_1'),
      scope_2: calculateScopeScore(scopeTotals.scope_2, scopeDistribution.scope_2, industry, 'scope_2'),
      scope_3: calculateScopeScore(scopeTotals.scope_3, scopeDistribution.scope_3, industry, 'scope_3')
    };

    // Calculate overall score (weighted average)
    const overallScore = calculateOverallScore(
      intensityScores,
      distributionScore,
      trendScore,
      scopeScores
    );

    // Generate room for improvement insights
    const improvements = generateImprovements(
      scopeTotals,
      scopeDistribution,
      intensityScores,
      emissionsQuery.rows
    );

    return {
      overall: overallScore,
      scope1: scopeScores.scope_1,
      scope2: scopeScores.scope_2,
      scope3: scopeScores.scope_3,
      totalEmissions,
      scopeTotals,
      scopeDistribution,
      intensityMetrics: intensityScores,
      trendScore,
      distributionScore,
      recommendations,
      improvements,
      industry,
      calculatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('[TrafficLightService] Error calculating score:', error);
    throw error;
  }
}

/**
 * Get score from benchmark comparison
 */
function getScoreFromBenchmark(value, benchmark) {
  if (value <= benchmark.excellent) return 'green';
  if (value <= benchmark.good) return 'yellow';
  return 'red';
}

/**
 * Get score from intensity thresholds
 */
function getScoreFromIntensity(value) {
  if (value <= INTENSITY_THRESHOLDS.excellent) return 'green';
  if (value <= INTENSITY_THRESHOLDS.good) return 'yellow';
  return 'red';
}

/**
 * Calculate scope-specific score
 */
function calculateScopeScore(emissions, percentage, industry, scope) {
  // Simple heuristic based on percentage contribution
  if (scope === 'scope_1' || scope === 'scope_2') {
    if (percentage < 30) return 'green';
    if (percentage < 50) return 'yellow';
    return 'red';
  } else {
    // Scope 3 - higher is actually expected for many SMEs
    if (percentage < 40) return 'green';
    if (percentage < 60) return 'yellow';
    return 'red';
  }
}

/**
 * Calculate overall score from components
 */
function calculateOverallScore(intensityScores, distributionScore, trendScore, scopeScores) {
  const scores = [];

  // Add intensity scores
  intensityScores.forEach(metric => scores.push(metric.score));

  // Add other scores
  scores.push(distributionScore, trendScore);
  scores.push(scopeScores.scope_1, scopeScores.scope_2, scopeScores.scope_3);

  // Count occurrences
  const greenCount = scores.filter(s => s === 'green').length;
  const redCount = scores.filter(s => s === 'red').length;
  const yellowCount = scores.filter(s => s === 'yellow').length;

  // Weighted decision
  if (redCount > scores.length / 3) return 'red';
  if (greenCount > scores.length / 2) return 'green';
  return 'yellow';
}

/**
 * Generate improvement recommendations
 */
function generateImprovements(scopeTotals, scopeDistribution, intensityScores, activityData) {
  const improvements = [];

  // Analyze by scope
  if (scopeTotals.scope_1 > 10) {
    improvements.push({
      category: 'Scope 1: Direct Emissions',
      priority: 'high',
      actions: [
        'Switch to renewable natural gas or electrify heating systems',
        'Optimize combustion efficiency through equipment upgrades',
        'Consider fuel switching (coal → natural gas)',
        'Implement vehicle fleet electrification'
      ]
    });
  }

  if (scopeTotals.scope_2 > 15) {
    improvements.push({
      category: 'Scope 2: Energy Purchases',
      priority: 'high',
      actions: [
        'Purchase renewable energy certificates (RECs) or green tariffs',
        'Install on-site solar PV systems',
        'Improve energy efficiency (LED lighting, HVAC optimization)',
        'Implement ISO 50001 energy management system'
      ]
    });
  }

  if (scopeTotals.scope_3 > 20) {
    improvements.push({
      category: 'Scope 3: Value Chain',
      priority: 'medium',
      actions: [
        'Engage suppliers on emissions reduction targets',
        'Optimize business travel (virtual meetings, economy class)',
        'Implement sustainable procurement policies',
        'Reduce waste and increase recycling rates'
      ]
    });
  }

  return improvements;
}

export default {
  calculateTrafficLightScore
};
