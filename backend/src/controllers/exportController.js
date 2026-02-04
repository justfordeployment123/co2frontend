/**
 * ========================================================================
 * EXPORT CONTROLLER
 * ========================================================================
 * 
 * HTTP handlers for report export endpoints
 */

import * as exportService from '../services/exportService.js';
import * as emailService from '../services/emailService.js';
import * as paymentService from '../services/paymentService.js';
import { sendReportEmail } from '../services/emailService.js';
import { queryOne } from '../utils/db.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create exports directory if it doesn't exist
const EXPORTS_DIR = path.join(__dirname, '../../exports');
if (!fs.existsSync(EXPORTS_DIR)) {
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

/**
 * Generate and download PDF report
 * GET /api/exports/pdf/:periodId
 */
export async function exportPDF(req, res) {
  try {
    const { periodId } = req.params;
    const { includeDetails, includeBreakdown, lang } = req.query;

    console.log(`[ExportController] Generating PDF for period ${periodId} in ${lang || 'en'}`);

    // Verify payment before generating report
    const paymentStatus = await paymentService.verifyPaymentStatus(periodId);
    if (!paymentStatus.paid) {
      return res.status(402).json({
        success: false,
        error: 'Payment required',
        message: 'Please complete payment before generating the report'
      });
    }

    const options = {
      includeDetails: includeDetails !== 'false',
      includeBreakdown: includeBreakdown !== 'false',
      language: lang || 'en',
      reportType: req.query.reportType || 'ghg'
    };

    // Ensure we handle the buffer directly (ArrayBuffer check if needed)
    const pdfBuffer = await exportService.generatePDFReport(periodId, options);

    if (!pdfBuffer) {
        throw new Error('PDF generation returned empty result');
    }

    // Save PDF to disk for history
    const filename = `report_${periodId}_${Date.now()}.pdf`;
    const filePath = path.join(EXPORTS_DIR, filename);
    fs.writeFileSync(filePath, pdfBuffer);

    // Record in report history (reports table)
    // First, get company_id and calculation_id
    const periodInfo = await queryOne(
      `SELECT rp.company_id, crs.id as calculation_id 
       FROM reporting_periods rp
       LEFT JOIN calculation_results_summary crs ON crs.reporting_period_id = rp.id
       WHERE rp.id = $1`,
      [periodId]
    );

    let reportId = null;
    if (periodInfo && periodInfo.calculation_id) {
       const reportResult = await queryOne(
        `INSERT INTO reports (company_id, reporting_period_id, calculation_id, generated_by, report_type, pdf_file_path, pdf_file_size_bytes, generated_at, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 'generated')
         ON CONFLICT (company_id, reporting_period_id) 
         DO UPDATE SET 
           pdf_file_path = EXCLUDED.pdf_file_path,
           pdf_file_size_bytes = EXCLUDED.pdf_file_size_bytes,
           generated_at = NOW(),
           generated_by = EXCLUDED.generated_by,
           status = 'generated'
         RETURNING id`,
        [periodInfo.company_id, periodId, periodInfo.calculation_id, req.user.userId, 'PDF', filePath, pdfBuffer.length]
      );
      reportId = reportResult?.id;
    } else {
      console.warn('[ExportController] Could not save report record: Missing calculation_id for period', periodId);
    }

    // Send email notification (async, don't block response)
    if (req.user && req.user.email) {
      queryOne(
        `SELECT rp.period_label, c.name as company_name 
         FROM reporting_periods rp 
         JOIN companies c ON rp.company_id = c.id 
         WHERE rp.id = $1`,
        [periodId]
      )
        .then((period) => {
          if (period) {
            sendReportEmail(
              req.user.email,
              period.period_label,
              null, // No file path since we're sending buffer
              'PDF'
            ).catch((err) => {
              console.error('[EXPORT] Failed to send report email:', err.message);
            });
          }
        })
        .catch((err) => {
          console.error('[EXPORT] Failed to fetch period info:', err.message);
        });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=emissions_report_${periodId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('[ExportController] Error generating PDF:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate PDF report'
    });
  }
}

/**
 * Generate and download CSV export
 * GET /api/exports/csv/:periodId
 */
export async function exportCSV(req, res) {
  try {
    const { periodId } = req.params;

    // Verify payment before generating export
    const paymentStatus = await paymentService.verifyPaymentStatus(periodId);
    if (!paymentStatus.paid) {
      return res.status(402).json({
        success: false,
        error: 'Payment required',
        message: 'Please complete payment before exporting data'
      });
    }

    const filename = `emissions_export_${periodId}_${Date.now()}.csv`;
    const filePath = path.join(EXPORTS_DIR, filename);

    await exportService.generateCSVExport(periodId, filePath);

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('[ExportController] Error sending CSV:', err);
      }
      // Clean up file after download
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 5000);
    });
  } catch (error) {
    console.error('[ExportController] Error generating CSV:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate CSV export'
    });
  }
}

/**
 * Generate and download Excel export
 * GET /api/exports/excel/:periodId
 */
export async function exportExcel(req, res) {
  try {
    const { periodId } = req.params;

    // Verify payment before generating export
    const paymentStatus = await paymentService.verifyPaymentStatus(periodId);
    if (!paymentStatus.paid) {
      return res.status(402).json({
        success: false,
        error: 'Payment required',
        message: 'Please complete payment before exporting data'
      });
    }

    const filename = `emissions_report_${periodId}_${Date.now()}.xlsx`;
    const filePath = path.join(EXPORTS_DIR, filename);

    await exportService.generateExcelExport(periodId, filePath);

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('[ExportController] Error sending Excel:', err);
      }
      // Clean up file after download
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 5000);
    });
  } catch (error) {
    console.error('[ExportController] Error generating Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate Excel export'
    });
  }
}

/**
 * Generate report and send via email
 * POST /api/exports/email/:periodId
 * Body: { recipientEmail, format: 'pdf'|'csv'|'excel' }
 */
export async function emailExport(req, res) {
  try {
    const { periodId } = req.params;
    const { recipientEmail, format = 'pdf' } = req.body;

    // Verify payment before generating/sending report
    const paymentStatus = await paymentService.verifyPaymentStatus(periodId);
    if (!paymentStatus.paid) {
      return res.status(402).json({
        success: false,
        error: 'Payment required',
        message: 'Please complete payment before generating the report'
      });
    }

    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        error: 'recipientEmail is required'
      });
    }

    const filename = `emissions_report_${periodId}_${Date.now()}`;
    let filePath;

    // Generate file based on format
    switch (format.toLowerCase()) {
      case 'pdf':
        filePath = path.join(EXPORTS_DIR, `${filename}.pdf`);
        // Handle direct buffer
        const pdfBuffer = await exportService.generatePDFReport(periodId);
        fs.writeFileSync(filePath, pdfBuffer);
        break;
      
      case 'csv':
        filePath = path.join(EXPORTS_DIR, `${filename}.csv`);
        await exportService.generateCSVExport(periodId, filePath);
        break;
      
      case 'excel':
        filePath = path.join(EXPORTS_DIR, `${filename}.xlsx`);
        await exportService.generateExcelExport(periodId, filePath);
        break;
      
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid format. Must be pdf, csv, or excel'
        });
    }

    // Send email with attachment
    const periodName = `Period ${periodId}`; // TODO: Get actual period name
    await emailService.sendReportEmail(recipientEmail, periodName, filePath, format.toUpperCase());

    // Clean up file after email sent
    setTimeout(() => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }, 10000);

    res.json({
      success: true,
      message: `Report sent to ${recipientEmail}`
    });
  } catch (error) {
    console.error('[ExportController] Error emailing export:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send report via email'
    });
  }
}

/**
 * Clean up old export files
 * DELETE /api/exports/cleanup
 */
export async function cleanupExports(req, res) {
  try {
    const { maxAgeHours = 24 } = req.query;

    await exportService.cleanupOldExports(EXPORTS_DIR, parseInt(maxAgeHours));

    res.json({
      success: true,
      message: 'Old exports cleaned up successfully'
    });
  } catch (error) {
    console.error('[ExportController] Error cleaning up exports:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clean up exports'
    });
  }
}

export default {
  exportPDF,
  exportCSV,
  exportExcel,
  emailExport,
  cleanupExports
};
