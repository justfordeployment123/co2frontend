/**
 * ========================================================================
 * APPROVAL CONTROLLER
 * ========================================================================
 * 
 * HTTP handlers for approval workflow endpoints
 */

import * as approvalService from '../services/approvalService.js';
import pool from '../utils/db.js';

/**
 * Submit a reporting period for approval
 * POST /api/approvals/submit
 * Body: { periodId, reviewerId }
 */
export async function submitForApproval(req, res) {
  try {
    const { periodId, reviewerId } = req.body;
    const submittedBy = req.user?.userId || req.user?.id;

    if (!periodId) {
      return res.status(400).json({
        success: false,
        error: 'periodId is required'
      });
    }

    const workflow = await approvalService.submitForApproval(periodId, submittedBy, reviewerId);

    res.json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error('[ApprovalController] Error submitting for approval:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit for approval'
    });
  }
}

/**
 * Approve a workflow
 * POST /api/approvals/:workflowId/approve
 * Body: { comments }
 */
export async function approveWorkflow(req, res) {
  try {
    const { workflowId } = req.params;
    const { comments } = req.body;
    const approvedBy = req.user?.userId || req.user?.id;

    const workflow = await approvalService.approveWorkflow(workflowId, approvedBy, comments);

    res.json({
      success: true,
      workflow,
      message: 'Workflow approved successfully'
    });
  } catch (error) {
    console.error('[ApprovalController] Error approving workflow:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to approve workflow'
    });
  }
}

/**
 * Reject a workflow
 * POST /api/approvals/:workflowId/reject
 * Body: { reason } (required)
 */
export async function rejectWorkflow(req, res) {
  try {
    const { workflowId } = req.params;
    const { reason } = req.body;
    const rejectedBy = req.user?.userId || req.user?.id;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
    }

    const workflow = await approvalService.rejectWorkflow(workflowId, rejectedBy, reason);

    res.json({
      success: true,
      workflow,
      message: 'Workflow rejected with feedback'
    });
  } catch (error) {
    console.error('[ApprovalController] Error rejecting workflow:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reject workflow'
    });
  }
}

/**
 * Add a comment to a workflow
 * POST /api/approvals/:workflowId/comment
 * Body: { commentText, commentType, isInternal }
 */
export async function addComment(req, res) {
  try {
    const { workflowId } = req.params;
    const { commentText, commentType = 'general', isInternal = false } = req.body;
    const userId = req.user?.userId || req.user?.id;

    if (!commentText || commentText.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Comment text is required'
      });
    }

    const comment = await approvalService.addComment(workflowId, userId, commentText, commentType, isInternal);

    res.json({
      success: true,
      comment
    });
  } catch (error) {
    console.error('[ApprovalController] Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add comment'
    });
  }
}

/**
 * Get workflow details
 * GET /api/approvals/:workflowId
 */
export async function getWorkflowDetails(req, res) {
  try {
    const { workflowId } = req.params;

    const workflow = await approvalService.getWorkflowDetails(workflowId);

    res.json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error('[ApprovalController] Error getting workflow details:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get workflow details'
    });
  }
}

/**
 * Get company workflows
 * GET /api/approvals/company/:companyId
 * Query params: status
 */
export async function getCompanyWorkflows(req, res) {
  try {
    const { companyId } = req.params;
    const { status } = req.query;

    const workflows = await approvalService.getCompanyWorkflows(companyId, status);

    res.json({
      success: true,
      workflows,
      count: workflows.length
    });
  } catch (error) {
    console.error('[ApprovalController] Error getting company workflows:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get company workflows'
    });
  }
}

/**
 * Get workflows assigned to user as reviewer
 * GET /api/approvals/my-reviews
 */
export async function getMyReviews(req, res) {
  try {
    const userId = req.user?.userId || req.user?.id;

    const result = await pool.query(
      `SELECT w.*, rp.period_label, c.name as company_name,
        u.first_name || ' ' || u.last_name as submitted_by_name
       FROM approval_workflows w
       JOIN reporting_periods rp ON w.reporting_period_id = rp.id
       JOIN companies c ON w.company_id = c.id
       LEFT JOIN users u ON w.submitted_by = u.id
       WHERE w.current_reviewer_id = $1 AND w.status IN ('pending', 'under_review')
       ORDER BY w.submitted_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      workflows: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('[ApprovalController] Error getting my reviews:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get reviews'
    });
  }
}

export default {
  submitForApproval,
  approveWorkflow,
  rejectWorkflow,
  addComment,
  getWorkflowDetails,
  getCompanyWorkflows,
  getMyReviews
};
