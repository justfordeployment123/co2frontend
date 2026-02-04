/**
 * ========================================================================
 * EXPORT ROUTES
 * ========================================================================
 * 
 * API routes for report exports (PDF, CSV, Excel)
 */

import express from 'express';
import * as exportController from '../controllers/exportController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// All export routes require authentication
router.use(authMiddleware);

/**
 * Export report as PDF
 * GET /api/exports/pdf/:periodId
 * Query params: includeDetails, includeBreakdown
 */
router.get('/pdf/:periodId', exportController.exportPDF);

/**
 * Export report as CSV
 * GET /api/exports/csv/:periodId
 */
router.get('/csv/:periodId', exportController.exportCSV);

/**
 * Export report as Excel
 * GET /api/exports/excel/:periodId
 */
router.get('/excel/:periodId', exportController.exportExcel);

/**
 * Send report via email
 * POST /api/exports/email/:periodId
 * Body: { recipientEmail, format: 'pdf'|'csv'|'excel' }
 */
router.post('/email/:periodId', exportController.emailExport);

/**
 * Clean up old export files (admin only)
 * DELETE /api/exports/cleanup
 * Query params: maxAgeHours (default: 24)
 */
router.delete('/cleanup', exportController.cleanupExports);

export default router;
