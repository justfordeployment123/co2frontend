/**
 * ========================================================================
 * CSRD CONTROLLER
 * ========================================================================
 * 
 * Handles CSRD (Corporate Sustainability Reporting Directive) specific
 * reporting endpoints for ESRS E1 compliance.
 */

import * as csrdService from '../services/csrdService.js';
import { queryOne } from '../utils/db.js';

/**
 * Get CSRD emissions report for a reporting period
 * GET /api/csrd/reporting-periods/:reportingPeriodId/emissions
 * 
 * Query params:
 *   - revenue: Annual revenue in EUR (for intensity calculation)
 *   - employees: Number of FTE employees (for intensity calculation)
 */
export async function getCSRDEmissions(req, res, next) {
  try {
    const { reportingPeriodId } = req.params;
    const { revenue, employees } = req.query;
    
    // Validate reporting period exists and user has access
    const period = await queryOne(
      `SELECT rp.*, c.id as company_id 
       FROM reporting_periods rp
       JOIN companies c ON rp.company_id = c.id
       WHERE rp.id = $1`,
      [reportingPeriodId]
    );
    
    if (!period) {
      return res.status(404).json({ error: 'Reporting period not found' });
    }
    
    // Build company metrics for intensity calculations
    const companyMetrics = {};
    if (revenue) {
      companyMetrics.revenue = parseFloat(revenue);
    }
    if (employees) {
      companyMetrics.employees = parseInt(employees);
    }
    
    // Calculate CSRD emissions
    const csrdReport = await csrdService.calculateCSRDEmissions(
      reportingPeriodId,
      companyMetrics
    );
    
    res.json({
      success: true,
      data: csrdReport
    });
    
  } catch (error) {
    console.error('[CSRD Controller] Error getting CSRD emissions:', error);
    next(error);
  }
}

/**
 * Get full CSRD disclosure report (formatted for export)
 * GET /api/csrd/reporting-periods/:reportingPeriodId/disclosure
 * 
 * Query params:
 *   - revenue: Annual revenue in EUR
 *   - employees: Number of FTE employees
 */
export async function getCSRDDisclosure(req, res, next) {
  try {
    const { reportingPeriodId } = req.params;
    const { revenue, employees } = req.query;
    
    // Validate reporting period exists
    const period = await queryOne(
      'SELECT * FROM reporting_periods WHERE id = $1',
      [reportingPeriodId]
    );
    
    if (!period) {
      return res.status(404).json({ error: 'Reporting period not found' });
    }
    
    // Build company metrics
    const companyMetrics = {};
    if (revenue) {
      companyMetrics.revenue = parseFloat(revenue);
    }
    if (employees) {
      companyMetrics.employees = parseInt(employees);
    }
    
    // Generate full disclosure report
    const disclosureReport = await csrdService.generateCSRDDisclosureReport(
      reportingPeriodId,
      companyMetrics
    );
    
    res.json({
      success: true,
      data: disclosureReport
    });
    
  } catch (error) {
    console.error('[CSRD Controller] Error generating CSRD disclosure:', error);
    next(error);
  }
}

/**
 * Validate CSRD compliance for a reporting period
 * GET /api/csrd/reporting-periods/:reportingPeriodId/validate
 */
export async function validateCSRDCompliance(req, res, next) {
  try {
    const { reportingPeriodId } = req.params;
    
    // Validate reporting period exists
    const period = await queryOne(
      'SELECT * FROM reporting_periods WHERE id = $1',
      [reportingPeriodId]
    );
    
    if (!period) {
      return res.status(404).json({ error: 'Reporting period not found' });
    }
    
    // Run compliance validation
    const validationResults = await csrdService.validateCSRDCompliance(reportingPeriodId);
    
    res.json({
      success: true,
      reporting_period_id: reportingPeriodId,
      validation: validationResults
    });
    
  } catch (error) {
    console.error('[CSRD Controller] Error validating CSRD compliance:', error);
    next(error);
  }
}

/**
 * Get CSRD requirements checklist
 * GET /api/csrd/requirements
 * 
 * Public endpoint - no authentication required
 * Returns information about ESRS E1 disclosure requirements
 */
export async function getCSRDRequirements(req, res, next) {
  try {
    const requirements = csrdService.getCSRDRequirements();
    
    res.json({
      success: true,
      data: requirements
    });
    
  } catch (error) {
    console.error('[CSRD Controller] Error getting CSRD requirements:', error);
    next(error);
  }
}

/**
 * Get CSRD vs GHG Protocol comparison
 * GET /api/csrd/standards/comparison
 * 
 * Public endpoint - explains differences between standards
 */
export async function getStandardsComparison(req, res, next) {
  try {
    const comparison = {
      title: 'CSRD vs GHG Protocol Comparison',
      summary: 'CSRD builds upon GHG Protocol but adds additional disclosure requirements',
      standards: {
        ghg_protocol: {
          name: 'GHG Protocol Corporate Standard',
          scope: 'Voluntary framework for measuring and reporting GHG emissions',
          geographic_focus: 'Global',
          key_features: [
            'Scope 1, 2, 3 classification',
            'Operational or financial control boundary',
            'Focus on emission quantification',
            'Flexible reporting'
          ],
          use_cases: [
            'Voluntary carbon disclosure (CDP)',
            'Science-based targets',
            'Carbon footprint certification',
            'Sustainability reporting (voluntary)'
          ]
        },
        csrd: {
          name: 'Corporate Sustainability Reporting Directive (CSRD) with ESRS E1',
          scope: 'Mandatory EU regulation for sustainability reporting',
          geographic_focus: 'European Union',
          applicability: [
            'All large EU companies (>250 employees or >€50M revenue)',
            'Listed SMEs (simplified requirements)',
            'Non-EU companies with significant EU operations (>€150M EU revenue)'
          ],
          key_features: [
            'Uses GHG Protocol methodology for emission calculations',
            'Requires both location-based AND market-based Scope 2',
            'Mandatory disclosure of all 3 scopes',
            'Requires transition plan and targets',
            'Third-party assurance required',
            'Double materiality assessment',
            'Forward-looking information required'
          ],
          esrs_e1_disclosures: [
            'E1-1: Transition plan',
            'E1-2: Policies',
            'E1-3: Actions and resources',
            'E1-4: Targets',
            'E1-5: Energy consumption',
            'E1-6: GHG emissions (Scopes 1, 2, 3)',
            'E1-7: GHG removals and credits',
            'E1-8: Internal carbon pricing',
            'E1-9: Financial effects from climate risks'
          ],
          timeline: {
            '2024': 'Large companies already subject to NFRD',
            '2025': 'All large companies and listed SMEs',
            '2026': 'Listed SMEs (with opt-out until 2028)',
            '2028': 'Non-EU companies with significant EU operations'
          }
        }
      },
      key_differences: [
        {
          aspect: 'Scope 2 Calculation',
          ghg_protocol: 'Location-based or market-based (choose one)',
          csrd: 'Both location-based AND market-based required'
        },
        {
          aspect: 'Scope 3 Reporting',
          ghg_protocol: 'Optional but encouraged',
          csrd: 'Mandatory for all material categories'
        },
        {
          aspect: 'Forward-looking Targets',
          ghg_protocol: 'Optional',
          csrd: 'Mandatory (E1-4 disclosure)'
        },
        {
          aspect: 'Assurance',
          ghg_protocol: 'Optional',
          csrd: 'Mandatory third-party limited assurance (progressing to reasonable assurance)'
        },
        {
          aspect: 'Biogenic CO2',
          ghg_protocol: 'Report separately',
          csrd: 'Report separately (aligned)'
        }
      ],
      implementation_note: 'AURIXON uses GHG Protocol methodology for emission calculations, ensuring compatibility with both standards. CSRD reporting adds structured disclosure templates and additional qualitative requirements.',
      current_system_support: {
        ghg_protocol: 'Fully supported',
        csrd_esrs_e1_6: 'Fully supported (GHG emissions quantification)',
        csrd_other_disclosures: 'Partial (E1-1 through E1-9 require additional modules)'
      }
    };
    
    res.json({
      success: true,
      data: comparison
    });
    
  } catch (error) {
    console.error('[CSRD Controller] Error getting standards comparison:', error);
    next(error);
  }
}

/**
 * Get ESRS E1-5 energy consumption disclosure
 * GET /api/csrd/reporting-periods/:reportingPeriodId/energy
 */
export async function getEnergyConsumption(req, res, next) {
  try {
    const { reportingPeriodId } = req.params;
    
    const period = await queryOne(
      'SELECT * FROM reporting_periods WHERE id = $1',
      [reportingPeriodId]
    );
    
    if (!period) {
      return res.status(404).json({ error: 'Reporting period not found' });
    }
    
    const energyData = await csrdService.calculateEnergyConsumption(reportingPeriodId);
    
    res.json({
      success: true,
      data: energyData
    });
    
  } catch (error) {
    console.error('[CSRD Controller] Error getting energy consumption:', error);
    next(error);
  }
}

/**
 * Get ESRS E1-4 climate targets
 * GET /api/csrd/companies/:companyId/targets
 */
export async function getClimateTargets(req, res, next) {
  try {
    const { companyId } = req.params;
    
    const targetsData = await csrdService.getClimateTargets(companyId);
    
    res.json({
      success: true,
      data: targetsData
    });
    
  } catch (error) {
    console.error('[CSRD Controller] Error getting climate targets:', error);
    next(error);
  }
}

/**
 * Get ESRS E1-7 GHG removals and carbon credits
 * GET /api/csrd/reporting-periods/:reportingPeriodId/removals
 */
export async function getGHGRemovals(req, res, next) {
  try {
    const { reportingPeriodId } = req.params;
    
    const period = await queryOne(
      'SELECT * FROM reporting_periods WHERE id = $1',
      [reportingPeriodId]
    );
    
    if (!period) {
      return res.status(404).json({ error: 'Reporting period not found' });
    }
    
    const removalsData = await csrdService.getGHGRemovals(reportingPeriodId);
    
    res.json({
      success: true,
      data: removalsData
    });
    
  } catch (error) {
    console.error('[CSRD Controller] Error getting GHG removals:', error);
    next(error);
  }
}

export default {
  getCSRDEmissions,
  getCSRDDisclosure,
  validateCSRDCompliance,
  getCSRDRequirements,
  getStandardsComparison,
  getEnergyConsumption,
  getClimateTargets,
  getGHGRemovals
};
