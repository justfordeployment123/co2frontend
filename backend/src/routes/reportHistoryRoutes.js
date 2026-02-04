/**
 * ========================================================================
 * REPORT HISTORY ROUTES
 * ========================================================================
 * 
 * Endpoints for viewing and managing report generation history
 */

import { Router } from 'express';
import * as reportHistoryController from '../controllers/reportHistoryController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/reports/history/:companyId
 * Get all reports generated for a company
 */
router.get('/:companyId', authMiddleware, reportHistoryController.getReportHistory);

/**
 * GET /api/reports/download/:reportId
 * Download a specific report
 */
router.get('/download/:reportId', authMiddleware, reportHistoryController.downloadReport);

/**
 * GET /api/reports/history/details/:reportId
 * Get report details
 */
router.get('/details/:reportId', authMiddleware, reportHistoryController.getReportById);

/**
 * DELETE /api/reports/:reportId
 * Delete a report from history
 */
router.delete('/:reportId', authMiddleware, reportHistoryController.deleteReport);

export default router;
