/**
 * ========================================================================
 * APPROVAL ROUTES
 * ========================================================================
 * 
 * API routes for approval workflow management
 */

import express from 'express';
import * as approvalController from '../controllers/approvalController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// All approval routes require authentication
router.use(authMiddleware);

/**
 * Submit a reporting period for approval
 * POST /api/approvals/submit
 * Body: { periodId, reviewerId }
 */
router.post('/submit', approvalController.submitForApproval);

/**
 * Approve a workflow
 * POST /api/approvals/:workflowId/approve
 * Body: { comments }
 */
router.post('/:workflowId/approve', approvalController.approveWorkflow);

/**
 * Reject a workflow
 * POST /api/approvals/:workflowId/reject
 * Body: { reason } (required)
 */
router.post('/:workflowId/reject', approvalController.rejectWorkflow);

/**
 * Add a comment to a workflow
 * POST /api/approvals/:workflowId/comment
 * Body: { commentText, commentType, isInternal }
 */
router.post('/:workflowId/comment', approvalController.addComment);

/**
 * Get workflow details
 * GET /api/approvals/:workflowId
 */
router.get('/:workflowId', approvalController.getWorkflowDetails);

/**
 * Get company workflows
 * GET /api/approvals/company/:companyId
 * Query params: status
 */
router.get('/company/:companyId', approvalController.getCompanyWorkflows);

/**
 * Get workflows assigned to user as reviewer
 * GET /api/approvals/my-reviews
 */
router.get('/my-reviews', approvalController.getMyReviews);

export default router;
