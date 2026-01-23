/**
 * ========================================================================
 * CSRD (Corporate Sustainability Reporting Directive) SERVICE
 * ========================================================================
 * 
 * Implements ESRS E1 (European Sustainability Reporting Standards - Climate)
 * requirements for CSRD compliance.
 * 
 * CSRD requires companies to report climate-related information following
 * ESRS E1 standards, which align with GHG Protocol Scope 1/2/3 but add
 * additional disclosure requirements.
 * 
 * ESRS E1 Key Requirements:
 * - E1-1: Transition plan for climate change mitigation
 * - E1-2: Policies related to climate change mitigation
 * - E1-3: Actions and resources for climate change mitigation
 * - E1-4: Targets for climate change mitigation
 * - E1-5: Energy consumption and mix
 * - E1-6: Gross Scope 1, 2, 3 and total GHG emissions
 * - E1-7: GHG removals and carbon credits
 * - E1-8: Internal carbon pricing
 * - E1-9: Anticipated financial effects from climate risks/opportunities
 * 
 * This service maps GHG Protocol calculations to CSRD requirements.
 */

import pool from '../utils/db.js';
import * as calculationEngine from './calculationEngine.js';

/**
 * CSRD to GHG Protocol Scope Mapping
 * CSRD uses same scope definitions as GHG Protocol
 */
const CSRD_SCOPE_MAPPING = {
  SCOPE_1: {
    description: 'Direct GHG emissions from sources owned or controlled by the company',
    categories: [
      'stationary_combustion',
      'mobile_sources',
      'refrigeration_ac',
      'fire_suppression',
      'purchased_gases'
    ]
  },
  SCOPE_2: {
    description: 'Indirect GHG emissions from consumption of purchased electricity, steam, heating and cooling',
    categories: [
      'electricity',
      'steam'
    ]
  },
  SCOPE_3: {
    description: 'All other indirect emissions in the value chain (upstream and downstream)',
    categories: [
      'business_travel_air',
      'business_travel_rail',
      'business_travel_road',
      'business_travel_hotel',
      'commuting',
      'transportation_distribution',
      'waste'
    ]
  }
};

/**
 * ESRS E1-6 Disclosure Requirements
 * Mandatory metrics for GHG emissions reporting
 */
const ESRS_E1_6_METRICS = {
  GROSS_SCOPE_1: 'Gross Scope 1 GHG emissions (tCO2e)',
  GROSS_SCOPE_2_LOCATION: 'Gross Scope 2 GHG emissions - Location-based (tCO2e)',
  GROSS_SCOPE_2_MARKET: 'Gross Scope 2 GHG emissions - Market-based (tCO2e)',
  GROSS_SCOPE_3: 'Gross Scope 3 GHG emissions (tCO2e)',
  TOTAL_GHG: 'Total GHG emissions (tCO2e)',
  BIOGENIC_CO2: 'Biogenic CO2 emissions (tCO2e) - separate disclosure',
  GHG_INTENSITY_REVENUE: 'GHG intensity per net revenue (tCO2e/€)',
  GHG_INTENSITY_EMPLOYEE: 'GHG intensity per employee (tCO2e/FTE)'
};

/**
 * Calculate CSRD-compliant GHG emissions for a reporting period
 * 
 * This function aggregates existing GHG Protocol calculations and formats
 * them according to ESRS E1-6 requirements.
 * 
 * @param {string} reportingPeriodId - UUID of reporting period
 * @param {Object} companyMetrics - Company-level metrics for intensity calculations
 * @param {number} companyMetrics.revenue - Annual revenue in EUR
 * @param {number} companyMetrics.employees - Number of full-time employees (FTE)
 * @returns {Promise<Object>} CSRD-formatted emission results
 */
export async function calculateCSRDEmissions(reportingPeriodId, companyMetrics = {}) {
  try {
    // Query all calculations for this reporting period grouped by scope
    const query = `
      SELECT 
        c.emission_scope,
        c.activity_category,
        SUM(c.co2e_total) as total_co2e,
        SUM(c.biogenic_co2) as total_biogenic_co2,
        COUNT(*) as activity_count
      FROM calculations c
      WHERE c.reporting_period_id = $1
      GROUP BY c.emission_scope, c.activity_category
      ORDER BY c.emission_scope, c.activity_category
    `;
    
    const result = await pool.query(query, [reportingPeriodId]);
    
    if (result.rows.length === 0) {
      throw new Error('No calculations found for this reporting period');
    }
    
    // Initialize scope totals
    let scope1Total = 0;
    let scope2Total = 0;
    let scope3Total = 0;
    let biogenicCO2Total = 0;
    
    // Categorize by scope
    const scopeBreakdown = {
      SCOPE_1: [],
      SCOPE_2: [],
      SCOPE_3: []
    };
    
    result.rows.forEach(row => {
      const scopeData = {
        category: row.activity_category,
        co2e_tonnes: parseFloat(row.total_co2e) || 0,
        biogenic_co2_tonnes: parseFloat(row.total_biogenic_co2) || 0,
        activity_count: parseInt(row.activity_count)
      };
      
      const scope = row.emission_scope;
      scopeBreakdown[scope]?.push(scopeData);
      
      // Add to totals
      const emissions = parseFloat(row.total_co2e) || 0;
      const biogenic = parseFloat(row.total_biogenic_co2) || 0;
      
      if (scope === 'SCOPE_1') {
        scope1Total += emissions;
      } else if (scope === 'SCOPE_2') {
        scope2Total += emissions;
      } else if (scope === 'SCOPE_3') {
        scope3Total += emissions;
      }
      
      biogenicCO2Total += biogenic;
    });
    
    const totalGHG = scope1Total + scope2Total + scope3Total;
    
    // Calculate intensity metrics (ESRS E1-6 requirement)
    const intensityMetrics = calculateIntensityMetrics(totalGHG, companyMetrics);
    
    // Format according to ESRS E1-6 structure
    const csrdReport = {
      reporting_standard: 'CSRD',
      esrs_standard: 'E1-6',
      disclosure_title: 'Gross Scopes 1, 2, 3 and Total GHG Emissions',
      reporting_period_id: reportingPeriodId,
      calculation_date: new Date().toISOString(),
      
      // ESRS E1-6 Mandatory Metrics
      emissions: {
        scope_1: {
          metric: ESRS_E1_6_METRICS.GROSS_SCOPE_1,
          value_tco2e: roundToDecimal(scope1Total, 2),
          description: CSRD_SCOPE_MAPPING.SCOPE_1.description,
          categories: scopeBreakdown.SCOPE_1
        },
        scope_2_location_based: {
          metric: ESRS_E1_6_METRICS.GROSS_SCOPE_2_LOCATION,
          value_tco2e: roundToDecimal(scope2Total, 2),
          description: 'Location-based method using grid average emission factors',
          categories: scopeBreakdown.SCOPE_2,
          note: 'Current implementation uses location-based factors only'
        },
        scope_2_market_based: {
          metric: ESRS_E1_6_METRICS.GROSS_SCOPE_2_MARKET,
          value_tco2e: roundToDecimal(scope2Total, 2),
          description: 'Market-based method using contractual instruments',
          note: 'Market-based factors not yet implemented - using location-based as proxy',
          implementation_status: 'pending'
        },
        scope_3: {
          metric: ESRS_E1_6_METRICS.GROSS_SCOPE_3,
          value_tco2e: roundToDecimal(scope3Total, 2),
          description: CSRD_SCOPE_MAPPING.SCOPE_3.description,
          categories: scopeBreakdown.SCOPE_3
        },
        total_ghg: {
          metric: ESRS_E1_6_METRICS.TOTAL_GHG,
          value_tco2e: roundToDecimal(totalGHG, 2),
          calculation: 'Scope 1 + Scope 2 (location-based) + Scope 3'
        },
        biogenic_co2: {
          metric: ESRS_E1_6_METRICS.BIOGENIC_CO2,
          value_tco2e: roundToDecimal(biogenicCO2Total, 2),
          note: 'Reported separately from total GHG emissions per ESRS E1-6'
        }
      },
      
      // Intensity Metrics (ESRS E1-6 requirement)
      intensity_metrics: intensityMetrics,
      
      // Scope Distribution (useful for analysis)
      distribution: {
        scope_1_percentage: totalGHG > 0 ? roundToDecimal((scope1Total / totalGHG) * 100, 1) : 0,
        scope_2_percentage: totalGHG > 0 ? roundToDecimal((scope2Total / totalGHG) * 100, 1) : 0,
        scope_3_percentage: totalGHG > 0 ? roundToDecimal((scope3Total / totalGHG) * 100, 1) : 0
      },
      
      // CSRD-specific metadata
      csrd_metadata: {
        esrs_standards_applied: ['E1-6'],
        calculation_methodology: 'GHG Protocol Corporate Standard',
        consolidation_approach: 'Operational control',
        base_year: null, // To be set by company
        target_year: null, // To be set by company
        verification_status: 'unverified',
        data_quality_notes: 'Calculated from activity data using EPA/EEA emission factors'
      }
    };
    
    return csrdReport;
    
  } catch (error) {
    console.error('[CSRD Service] Error calculating CSRD emissions:', error);
    throw error;
  }
}

/**
 * Calculate intensity metrics required by ESRS E1-6
 * 
 * @param {number} totalGHG - Total GHG emissions in tCO2e
 * @param {Object} companyMetrics - Company metrics
 * @param {number} [companyMetrics.revenue] - Annual revenue in EUR
 * @param {number} [companyMetrics.employees] - Number of FTE employees
 * @returns {Object} Intensity metrics
 */
function calculateIntensityMetrics(totalGHG, companyMetrics = {}) {
  const metrics = {};
  
  // GHG intensity per revenue (tCO2e/€)
  if (companyMetrics.revenue && companyMetrics.revenue > 0) {
    metrics.revenue_intensity = {
      metric: ESRS_E1_6_METRICS.GHG_INTENSITY_REVENUE,
      value: roundToDecimal(totalGHG / companyMetrics.revenue, 6),
      unit: 'tCO2e/EUR',
      description: 'Total GHG emissions divided by net revenue',
      revenue_eur: companyMetrics.revenue
    };
  } else {
    metrics.revenue_intensity = {
      metric: ESRS_E1_6_METRICS.GHG_INTENSITY_REVENUE,
      value: null,
      note: 'Revenue data not provided'
    };
  }
  
  // GHG intensity per employee (tCO2e/FTE)
  if (companyMetrics.employees && companyMetrics.employees > 0) {
    metrics.employee_intensity = {
      metric: ESRS_E1_6_METRICS.GHG_INTENSITY_EMPLOYEE,
      value: roundToDecimal(totalGHG / companyMetrics.employees, 3),
      unit: 'tCO2e/FTE',
      description: 'Total GHG emissions divided by number of full-time employees',
      employees_fte: companyMetrics.employees
    };
  } else {
    metrics.employee_intensity = {
      metric: ESRS_E1_6_METRICS.GHG_INTENSITY_EMPLOYEE,
      value: null,
      note: 'Employee data not provided'
    };
  }
  
  return metrics;
}

/**
 * Get CSRD reporting requirements checklist
 * 
 * Returns a checklist of ESRS E1 disclosure requirements to help companies
 * understand what they need to report for CSRD compliance.
 * 
 * @returns {Object} CSRD requirements checklist
 */
export function getCSRDRequirements() {
  return {
    standard: 'CSRD - ESRS E1 (Climate)',
    disclosure_requirements: {
      'E1-1': {
        title: 'Transition plan for climate change mitigation',
        status: 'not_implemented',
        description: 'Describe the plan to ensure business model and strategy are compatible with limiting global warming to 1.5°C',
        implementation_notes: 'Qualitative disclosure - to be added to reporting interface'
      },
      'E1-2': {
        title: 'Policies related to climate change mitigation and adaptation',
        status: 'not_implemented',
        description: 'Describe policies to manage material climate impacts, dependencies, risks and opportunities',
        implementation_notes: 'Qualitative disclosure - to be added to reporting interface'
      },
      'E1-3': {
        title: 'Actions and resources for climate change mitigation',
        status: 'not_implemented',
        description: 'Describe climate action plans and resources allocated',
        implementation_notes: 'Qualitative disclosure - to be added to reporting interface'
      },
      'E1-4': {
        title: 'Targets for climate change mitigation and adaptation',
        status: 'not_implemented',
        description: 'Describe GHG emission reduction targets and their alignment with Paris Agreement',
        implementation_notes: 'Quantitative targets - to be added to database schema'
      },
      'E1-5': {
        title: 'Energy consumption and mix',
        status: 'partially_implemented',
        description: 'Disclose total energy consumption and renewable energy percentage',
        implementation_notes: 'Can be derived from existing activity data - needs aggregation function'
      },
      'E1-6': {
        title: 'Gross Scopes 1, 2, 3 and Total GHG emissions',
        status: 'implemented',
        description: 'Report absolute GHG emissions by scope and intensity metrics',
        implementation_notes: 'Fully implemented via calculateCSRDEmissions() function'
      },
      'E1-7': {
        title: 'GHG removals and GHG mitigation projects',
        status: 'not_implemented',
        description: 'Disclose carbon removal activities and carbon credits',
        implementation_notes: 'Offsets table exists but needs CSRD-specific reporting'
      },
      'E1-8': {
        title: 'Internal carbon pricing',
        status: 'not_implemented',
        description: 'Explain if and how internal carbon pricing is used',
        implementation_notes: 'Qualitative disclosure - to be added'
      },
      'E1-9': {
        title: 'Anticipated financial effects from material climate risks',
        status: 'not_implemented',
        description: 'Disclose financial impacts from climate-related risks and opportunities',
        implementation_notes: 'Requires financial impact assessment module'
      }
    },
    current_implementation_status: 'E1-6 implemented (GHG emissions quantification)',
    next_priorities: [
      'E1-5: Energy consumption aggregation',
      'E1-4: Target setting and tracking',
      'E1-7: Carbon removal and credits reporting'
    ]
  };
}

/**
 * Generate CSRD disclosure report (formatted for export)
 * 
 * @param {string} reportingPeriodId - UUID of reporting period
 * @param {Object} companyMetrics - Company metrics
 * @returns {Promise<Object>} Formatted CSRD report for PDF/Excel export
 */
export async function generateCSRDDisclosureReport(reportingPeriodId, companyMetrics) {
  try {
    // Get CSRD emissions calculation
    const emissionsData = await calculateCSRDEmissions(reportingPeriodId, companyMetrics);
    
    // Get reporting period details
    const periodQuery = `
      SELECT 
        rp.*,
        c.name as company_name,
        c.industry,
        c.country_code
      FROM reporting_periods rp
      JOIN companies c ON rp.company_id = c.id
      WHERE rp.id = $1
    `;
    
    const periodResult = await pool.query(periodQuery, [reportingPeriodId]);
    
    if (periodResult.rows.length === 0) {
      throw new Error('Reporting period not found');
    }
    
    const period = periodResult.rows[0];
    
    // Format for disclosure report
    const report = {
      report_type: 'CSRD_ESRS_E1_DISCLOSURE',
      generated_at: new Date().toISOString(),
      company: {
        name: period.company_name,
        industry: period.industry,
        country: period.country_code
      },
      reporting_period: {
        label: period.period_label,
        start_date: period.period_start_date,
        end_date: period.period_end_date,
        reporting_standard: period.reporting_standard
      },
      esrs_e1_6_disclosure: emissionsData,
      compliance_notes: [
        'This report covers ESRS E1-6 (GHG Emissions) disclosure requirement',
        'Additional ESRS E1 disclosures (E1-1 through E1-9) required for full CSRD compliance',
        'Scope 2 market-based calculation pending implementation',
        'Third-party verification recommended for CSRD submission'
      ]
    };
    
    return report;
    
  } catch (error) {
    console.error('[CSRD Service] Error generating disclosure report:', error);
    throw error;
  }
}

/**
 * Validate if reporting period meets CSRD minimum requirements
 * 
 * @param {string} reportingPeriodId - UUID of reporting period
 * @returns {Promise<Object>} Validation results
 */
export async function validateCSRDCompliance(reportingPeriodId) {
  try {
    const validationResults = {
      is_compliant: false,
      checks: [],
      warnings: [],
      errors: []
    };
    
    // Check 1: All three scopes calculated
    const scopeQuery = `
      SELECT DISTINCT emission_scope
      FROM calculations
      WHERE reporting_period_id = $1
    `;
    
    const scopeResult = await pool.query(scopeQuery, [reportingPeriodId]);
    const scopes = scopeResult.rows.map(r => r.emission_scope);
    
    ['SCOPE_1', 'SCOPE_2', 'SCOPE_3'].forEach(scope => {
      if (scopes.includes(scope)) {
        validationResults.checks.push({
          check: `${scope} calculated`,
          status: 'pass'
        });
      } else {
        validationResults.warnings.push({
          check: `${scope} missing`,
          message: `No activities recorded for ${scope}. If applicable, this scope must be reported.`
        });
      }
    });
    
    // Check 2: Biogenic CO2 separated
    const biogenicQuery = `
      SELECT SUM(biogenic_co2) as total_biogenic
      FROM calculations
      WHERE reporting_period_id = $1
    `;
    
    const biogenicResult = await pool.query(biogenicQuery, [reportingPeriodId]);
    const hasBiogenic = biogenicResult.rows[0]?.total_biogenic > 0;
    
    if (hasBiogenic) {
      validationResults.checks.push({
        check: 'Biogenic CO2 separated',
        status: 'pass',
        note: 'Biogenic emissions reported separately per ESRS E1-6'
      });
    }
    
    // Overall compliance (at minimum need Scope 1 or 2)
    validationResults.is_compliant = scopes.includes('SCOPE_1') || scopes.includes('SCOPE_2');
    
    if (!validationResults.is_compliant) {
      validationResults.errors.push({
        error: 'Insufficient data for CSRD reporting',
        message: 'At minimum, Scope 1 or Scope 2 emissions must be calculated'
      });
    }
    
    return validationResults;
    
  } catch (error) {
    console.error('[CSRD Service] Error validating compliance:', error);
    throw error;
  }
}

/**
 * Helper function to round numbers to specified decimal places
 */
function roundToDecimal(value, decimals) {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * ========================================================================
 * ESRS E1-5: ENERGY CONSUMPTION AND MIX
 * ========================================================================
 */

/**
 * Calculate energy consumption disclosure (ESRS E1-5)
 * Aggregates energy from all activity sources
 * 
 * @param {string} reportingPeriodId - UUID of reporting period
 * @returns {Promise<Object>} Energy consumption breakdown
 */
export async function calculateEnergyConsumption(reportingPeriodId) {
  try {
    // Query for stationary combustion (convert fuel to energy)
    const stationaryQuery = `
      SELECT 
        fuel_type,
        SUM(quantity) as total_quantity,
        unit,
        SUM(energy_content_mj) as total_energy_mj
      FROM stationary_combustion_activities
      WHERE reporting_period_id = $1
      GROUP BY fuel_type, unit
    `;
    
    // Query for electricity consumption
    const electricityQuery = `
      SELECT 
        SUM(kwh_consumed) as total_kwh,
        SUM(renewable_kwh) as renewable_kwh
      FROM electricity_activities
      WHERE reporting_period_id = $1
    `;
    
    // Query for steam/heating
    const steamQuery = `
      SELECT 
        SUM(quantity_mmbtu) as total_mmbtu
      FROM steam_activities
      WHERE reporting_period_id = $1
    `;
    
    const [stationaryResult, electricityResult, steamResult] = await Promise.all([
      pool.query(stationaryQuery, [reportingPeriodId]),
      pool.query(electricityQuery, [reportingPeriodId]),
      pool.query(steamQuery, [reportingPeriodId])
    ]);
    
    // Calculate totals
    const electricityKwh = parseFloat(electricityResult.rows[0]?.total_kwh) || 0;
    const renewableKwh = parseFloat(electricityResult.rows[0]?.renewable_kwh) || 0;
    const steamMmbtu = parseFloat(steamResult.rows[0]?.total_mmbtu) || 0;
    
    // Convert to common unit (MWh)
    const electricityMwh = electricityKwh / 1000;
    const renewableMwh = renewableKwh / 1000;
    const steamMwh = steamMmbtu * 0.293071; // 1 MMBtu = 0.293071 MWh
    
    // Calculate fuel energy from stationary combustion
    let fuelMwh = 0;
    let renewableFuelMwh = 0;
    
    stationaryResult.rows.forEach(row => {
      const energyMj = parseFloat(row.total_energy_mj) || 0;
      const energyMwh = energyMj / 3600; // 1 MWh = 3600 MJ
      
      // Check if fuel is renewable (biomass)
      const renewableFuels = ['Wood Pellets', 'Wood Logs', 'Wood Chips', 'Biodiesel', 'Biogas'];
      if (renewableFuels.includes(row.fuel_type)) {
        renewableFuelMwh += energyMwh;
      }
      
      fuelMwh += energyMwh;
    });
    
    const totalEnergyMwh = electricityMwh + fuelMwh + steamMwh;
    const totalRenewableMwh = renewableMwh + renewableFuelMwh;
    const renewablePercentage = totalEnergyMwh > 0 ? (totalRenewableMwh / totalEnergyMwh) * 100 : 0;
    
    return {
      esrs_standard: 'E1-5',
      disclosure_title: 'Energy Consumption and Mix',
      reporting_period_id: reportingPeriodId,
      total_energy_consumption: {
        value_mwh: roundToDecimal(totalEnergyMwh, 2),
        value_gj: roundToDecimal(totalEnergyMwh * 3.6, 2), // 1 MWh = 3.6 GJ
        breakdown: {
          electricity_mwh: roundToDecimal(electricityMwh, 2),
          fuel_mwh: roundToDecimal(fuelMwh, 2),
          steam_heating_mwh: roundToDecimal(steamMwh, 2)
        }
      },
      renewable_energy: {
        total_renewable_mwh: roundToDecimal(totalRenewableMwh, 2),
        renewable_percentage: roundToDecimal(renewablePercentage, 1),
        breakdown: {
          renewable_electricity_mwh: roundToDecimal(renewableMwh, 2),
          renewable_fuel_mwh: roundToDecimal(renewableFuelMwh, 2)
        }
      },
      non_renewable_energy: {
        total_non_renewable_mwh: roundToDecimal(totalEnergyMwh - totalRenewableMwh, 2),
        percentage: roundToDecimal(100 - renewablePercentage, 1)
      },
      energy_intensity: {
        note: 'Calculate per revenue or per employee using company metrics'
      }
    };
    
  } catch (error) {
    console.error('[CSRD Service] Error calculating energy consumption:', error);
    throw error;
  }
}

/**
 * ========================================================================
 * ESRS E1-4: TARGETS FOR CLIMATE CHANGE MITIGATION
 * ========================================================================
 */

/**
 * Get GHG reduction targets and track progress (ESRS E1-4)
 * 
 * @param {string} companyId - UUID of company
 * @returns {Promise<Object>} Targets and progress
 */
export async function getClimateTargets(companyId) {
  try {
    // Query company targets from database
    const query = `
      SELECT 
        id,
        company_id,
        target_type,
        scope_coverage,
        base_year,
        base_year_emissions_tco2e,
        target_year,
        target_reduction_percentage,
        target_absolute_tco2e,
        science_based,
        paris_aligned,
        status,
        progress_percentage,
        last_measured_year,
        last_measured_emissions_tco2e,
        created_at,
        updated_at
      FROM climate_targets
      WHERE company_id = $1
        AND status = 'active'
      ORDER BY target_year ASC
    `;
    
    const result = await pool.query(query, [companyId]);
    
    const targets = result.rows.map(row => {
      const baseYear = parseInt(row.base_year);
      const targetYear = parseInt(row.target_year);
      const lastMeasuredYear = parseInt(row.last_measured_year);
      
      // Calculate expected progress
      const totalYears = targetYear - baseYear;
      const yearsElapsed = lastMeasuredYear - baseYear;
      const expectedProgress = (yearsElapsed / totalYears) * 100;
      
      // Calculate actual progress
      const baseEmissions = parseFloat(row.base_year_emissions_tco2e);
      const currentEmissions = parseFloat(row.last_measured_emissions_tco2e);
      const targetEmissions = parseFloat(row.target_absolute_tco2e);
      
      const emissionsReduced = baseEmissions - currentEmissions;
      const totalReductionNeeded = baseEmissions - targetEmissions;
      const actualProgress = totalReductionNeeded > 0 ? (emissionsReduced / totalReductionNeeded) * 100 : 0;
      
      return {
        target_id: row.id,
        target_type: row.target_type,
        scope_coverage: row.scope_coverage,
        base_year: baseYear,
        base_year_emissions: baseEmissions,
        target_year: targetYear,
        target_reduction_percentage: parseFloat(row.target_reduction_percentage),
        target_absolute_emissions: targetEmissions,
        science_based_target: row.science_based,
        paris_agreement_aligned: row.paris_aligned,
        progress: {
          last_measured_year: lastMeasuredYear,
          last_measured_emissions: currentEmissions,
          emissions_reduced: roundToDecimal(emissionsReduced, 2),
          percentage_complete: roundToDecimal(actualProgress, 1),
          expected_percentage: roundToDecimal(expectedProgress, 1),
          on_track: actualProgress >= expectedProgress,
          years_remaining: targetYear - lastMeasuredYear
        },
        status: row.status
      };
    });
    
    return {
      esrs_standard: 'E1-4',
      disclosure_title: 'Targets Related to Climate Change Mitigation and Adaptation',
      company_id: companyId,
      targets: targets,
      target_count: targets.length,
      science_based_targets: targets.filter(t => t.science_based_target).length,
      paris_aligned_targets: targets.filter(t => t.paris_agreement_aligned).length
    };
    
  } catch (error) {
    // If climate_targets table doesn't exist yet, return empty structure
    if (error.code === '42P01') {
      return {
        esrs_standard: 'E1-4',
        disclosure_title: 'Targets Related to Climate Change Mitigation and Adaptation',
        company_id: companyId,
        targets: [],
        note: 'Target tracking not yet configured. Climate targets table will be created in future update.'
      };
    }
    console.error('[CSRD Service] Error getting climate targets:', error);
    throw error;
  }
}

/**
 * ========================================================================
 * ESRS E1-7: GHG REMOVALS AND CARBON CREDITS
 * ========================================================================
 */

/**
 * Get GHG removals and carbon credit information (ESRS E1-7)
 * 
 * @param {string} reportingPeriodId - UUID of reporting period
 * @returns {Promise<Object>} Carbon removal and credit data
 */
export async function getGHGRemovals(reportingPeriodId) {
  try {
    // Query carbon offsets/credits from database
    const query = `
      SELECT 
        o.id,
        o.reporting_period_id,
        o.offset_type,
        o.project_name,
        o.project_location,
        o.offset_amount_tco2e,
        o.vintage_year,
        o.certification_standard,
        o.verified_by,
        o.purchase_date,
        o.cost_per_tco2e,
        o.total_cost,
        o.retirement_date,
        o.retirement_status,
        o.notes
      FROM offsets o
      WHERE o.reporting_period_id = $1
      ORDER BY o.purchase_date DESC
    `;
    
    const result = await pool.query(query, [reportingPeriodId]);
    
    // Categorize by type
    const removals = [];
    const avoidedEmissions = [];
    
    result.rows.forEach(row => {
      const offsetData = {
        offset_id: row.id,
        project_name: row.project_name,
        project_location: row.project_location,
        offset_amount_tco2e: parseFloat(row.offset_amount_tco2e),
        vintage_year: parseInt(row.vintage_year),
        certification_standard: row.certification_standard,
        verified_by: row.verified_by,
        purchase_date: row.purchase_date,
        cost_per_tco2e: parseFloat(row.cost_per_tco2e),
        total_cost: parseFloat(row.total_cost),
        retirement_status: row.retirement_status,
        quality_criteria: {
          certified: row.certification_standard !== null,
          verified: row.verified_by !== null,
          retired: row.retirement_status === 'retired',
          additionality: 'To be assessed',
          permanence: 'To be assessed'
        }
      };
      
      // Categorize based on offset type
      const removalTypes = ['Reforestation', 'Afforestation', 'Direct Air Capture', 'Carbon Sequestration'];
      if (removalTypes.includes(row.offset_type)) {
        removals.push(offsetData);
      } else {
        avoidedEmissions.push(offsetData);
      }
    });
    
    const totalRemovals = removals.reduce((sum, r) => sum + r.offset_amount_tco2e, 0);
    const totalAvoided = avoidedEmissions.reduce((sum, a) => sum + a.offset_amount_tco2e, 0);
    
    return {
      esrs_standard: 'E1-7',
      disclosure_title: 'GHG Removals and GHG Mitigation Projects Financed Through Carbon Credits',
      reporting_period_id: reportingPeriodId,
      ghg_removals: {
        total_removals_tco2e: roundToDecimal(totalRemovals, 2),
        removal_projects: removals,
        note: 'Carbon removals actively remove CO2 from atmosphere'
      },
      avoided_emissions: {
        total_avoided_tco2e: roundToDecimal(totalAvoided, 2),
        avoidance_projects: avoidedEmissions,
        note: 'Avoided emissions prevent emissions that would otherwise occur'
      },
      carbon_credits: {
        total_credits_purchased: removals.length + avoidedEmissions.length,
        total_tco2e_offset: roundToDecimal(totalRemovals + totalAvoided, 2),
        retired_credits: [...removals, ...avoidedEmissions].filter(c => c.retirement_status === 'retired').length,
        certification_standards: [...new Set(result.rows.map(r => r.certification_standard).filter(Boolean))]
      },
      quality_assessment: {
        all_certified: result.rows.every(r => r.certification_standard !== null),
        all_verified: result.rows.every(r => r.verified_by !== null),
        all_retired: result.rows.every(r => r.retirement_status === 'retired'),
        recommendations: [
          'Ensure all credits meet ICVCM Core Carbon Principles',
          'Verify additionality of projects',
          'Assess permanence risk',
          'Retire credits to prevent double counting'
        ]
      }
    };
    
  } catch (error) {
    // If offsets table doesn't exist or no offsets, return empty structure
    if (error.code === '42P01' || error.message.includes('does not exist')) {
      return {
        esrs_standard: 'E1-7',
        disclosure_title: 'GHG Removals and GHG Mitigation Projects Financed Through Carbon Credits',
        reporting_period_id: reportingPeriodId,
        ghg_removals: {
          total_removals_tco2e: 0,
          removal_projects: []
        },
        avoided_emissions: {
          total_avoided_tco2e: 0,
          avoidance_projects: []
        },
        note: 'No carbon credits or removals recorded for this period'
      };
    }
    console.error('[CSRD Service] Error getting GHG removals:', error);
    throw error;
  }
}

export default {
  calculateCSRDEmissions,
  generateCSRDDisclosureReport,
  validateCSRDCompliance,
  getCSRDRequirements,
  calculateEnergyConsumption,
  getClimateTargets,
  getGHGRemovals
};
