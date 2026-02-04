/**
 * ========================================================================
 * REPORT HISTORY CONTROLLER
 * ========================================================================
 * 
 * Handles viewing and managing report generation history
 */

import pool from '../utils/db.js';
import * as trafficLightService from '../services/trafficLightService.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get report history for a company
 * GET /api/reports/history/:companyId
 */
export async function getReportHistory(req, res) {
  try {
    const { companyId } = req.params;
    
    // Verify user has access to this company
    const hasAccess = req.user.roles && req.user.roles.some(r => 
      r.company_id === companyId || r.companyId === companyId || r.role === 'internal_admin'
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const query = `
      SELECT DISTINCT ON (rh.id)
        rh.id,
        rh.reporting_period_id,
        rh.report_type,
        rh.generated_at,
        rh.status,
        rh.pdf_file_path as file_path,
        rh.pdf_file_size_bytes as file_size_bytes,
        rp.period_label,
        rp.period_start_date,
        rp.period_end_date,
        p.payment_status,
        (p.amount_cents / 100.0) as amount_paid,
        p.completed_at as paid_at
      FROM reports rh
      JOIN reporting_periods rp ON rh.reporting_period_id = rp.id
      LEFT JOIN payment_transactions p ON p.report_id = rh.id 
        AND p.payment_status IN ('succeeded', 'refunded')
      WHERE rp.company_id = $1
      ORDER BY rh.id, p.completed_at DESC NULLS LAST, rh.generated_at DESC
    `;

    const result = await pool.query(query, [companyId]);

    res.json({
      success: true,
      reports: result.rows
    });
  } catch (error) {
    console.error('[ReportHistoryController] Error fetching report history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch report history'
    });
  }
}

/**
 * Get report details by ID
 * GET /api/reports/:reportId
 */
export async function getReportById(req, res) {
  try {
    const { reportId } = req.params;
    const companyId = req.user.company_id;

    // Verify user has access to this report
    const reportQuery = await pool.query(
      `SELECT 
         rh.*,
         rp.period_label,
         rp.period_start_date,
         rp.period_end_date,
         crs.scope1_total_net_co2e,
         crs.scope2_market_based_total_net_co2e,
         crs.scope3_total_net_co2e,
         crs.total_scope1_and_scope2_market_based_net_co2e
       FROM reports rh
       JOIN reporting_periods rp ON rh.reporting_period_id = rp.id
       LEFT JOIN calculation_results_summary crs ON rh.reporting_period_id = crs.reporting_period_id
       WHERE rh.id = $1`,
      [reportId]
    );

    if (reportQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    const report = reportQuery.rows[0];

    const hasAccess = req.user.roles && req.user.roles.some(r => 
      r.company_id === report.company_id || r.companyId === report.company_id || r.role === 'internal_admin'
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Determine if we have valid data in DB
    // Check if relevant columns are populated and non-zero (optional check)
    // If not, calculate live.
    // If DB `report_data` is present, it's prioritized.
    // If DB `crs` columns present, they are used.
    
    let responseData = { ...report };
    let calculatedData = null;
    
    const hasDBData = report.report_data || 
                      (report.scope1_total_net_co2e !== null && parseFloat(report.scope1_total_net_co2e) >= 0) ||
                      (report.traffic_light_overall);

    // If missing data, calculate strictly for "View" purposes
    if (!hasDBData) {
       try {
         calculatedData = await trafficLightService.calculateTrafficLightScore(report.reporting_period_id);
       } catch (err) {
         console.warn('[ReportHistory] Failed to on-demand calculate:', err);
       }
    }

    // Construct response
    if (calculatedData) {
       // Use live calculated data
       responseData = {
         ...report,
         traffic_light: calculatedData.overall || 'gray',
         recommendations: calculatedData.recommendations || [],
         kpis: {
           total_emissions: (calculatedData.totalEmissions || 0) * 1000, // MT to kg usually
           scope_breakdown: {
             'Scope 1': (calculatedData.scopeTotals?.scope_1 || 0) * 1000,
             'Scope 2': (calculatedData.scopeTotals?.scope_2 || 0) * 1000,
             'Scope 3': (calculatedData.scopeTotals?.scope_3 || 0) * 1000
           }
         },
         // Include raw calculated data if needed
         ...calculatedData
       };
    } else {
       // Use DB stored data (existing logic)
       responseData = {
        ...report,
        traffic_light: report.traffic_light_overall || 'gray',
        recommendations: report.improvement_notes ? [report.improvement_notes] : [],
        kpis: report.report_data?.kpis || {
          total_emissions: ((parseFloat(report.scope1_total_net_co2e) || 0) + 
                           (parseFloat(report.scope2_market_based_total_net_co2e) || 0) + 
                           (parseFloat(report.scope3_total_net_co2e) || 0)) * 1000,
          scope_breakdown: {
            'Scope 1': (parseFloat(report.scope1_total_net_co2e) || 0) * 1000,
            'Scope 2': (parseFloat(report.scope2_market_based_total_net_co2e) || 0) * 1000,
            'Scope 3': (parseFloat(report.scope3_total_net_co2e) || 0) * 1000
          }
        }
      };
      // Merge report_data if available
      if (report.report_data) {
          Object.assign(responseData, report.report_data);
      }
    }

    res.json({
      success: true,
      report: responseData
    });
  } catch (error) {
    console.error('[ReportHistoryController] Error fetching report details:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch report details'
    });
  }
}

/**
 * Download a specific report
 * GET /api/reports/download/:reportId
 */
export async function downloadReport(req, res) {
  try {
    const { reportId } = req.params;
    const companyId = req.user.company_id;

    // Verify user has access to this report
    const reportQuery = await pool.query(
      `SELECT rh.*, rp.company_id
       FROM reports rh
       JOIN reporting_periods rp ON rh.reporting_period_id = rp.id
       WHERE rh.id = $1`,
      [reportId]
    );

    if (reportQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    const report = reportQuery.rows[0];

    if (report.company_id !== companyId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Check if PDF file exists on disk
    if (report.pdf_file_path && fs.existsSync(report.pdf_file_path)) {
      // Serve from disk
      if (report.report_type === 'PDF') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=report_${reportId}.pdf`);
        return res.sendFile(report.pdf_file_path);
      } else if (report.report_type === 'CSV') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=report_${reportId}.csv`);
        return res.sendFile(report.file_path);
      }
    }

    // Fallback: Regenerate report on-the-fly if file not found
    const exportService = await import('../services/exportService.js');
    
    if (report.report_type === 'PDF') {
      const pdfBuffer = await exportService.generatePDFReport(report.reporting_period_id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=report_${reportId}.pdf`);
      return res.send(pdfBuffer);
    } else if (report.report_type === 'CSV') {
      return res.status(501).json({
        success: false,
        error: 'CSV regeneration not yet implemented'
      });
    }

  } catch (error) {
    console.error('[ReportHistoryController] Error downloading report:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to download report'
    });
  }
}

/**
 * Delete a report from history
 * DELETE /api/reports/:reportId
 */
export async function deleteReport(req, res) {
  try {
    const { reportId } = req.params;
    const companyId = req.user.company_id;

    // Verify user has access to this report
    const reportQuery = await pool.query(
      `SELECT rh.*, rp.company_id
       FROM reports rh
       JOIN reporting_periods rp ON rh.reporting_period_id = rp.id
       WHERE rh.id = $1`,
      [reportId]
    );

    if (reportQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    const report = reportQuery.rows[0];

    if (report.company_id !== companyId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Soft delete by marking as deleted
    await pool.query(
      `DELETE FROM reports WHERE id = $1`,
      [reportId]
    );

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('[ReportHistoryController] Error deleting report:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete report'
    });
  }
}

export default {
  getReportHistory,
  getReportById,
  downloadReport,
  deleteReport
};
