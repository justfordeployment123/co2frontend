/**
 * ========================================================================
 * APPROVAL WORKFLOW SERVICE
 * ========================================================================
 * 
 * Business logic for managing approval workflows for reporting periods
 */

import pool from '../utils/db.js';
import * as emailService from './emailService.js';

/**
 * Submit a reporting period for approval
 * @param {number} periodId - Reporting period ID
 * @param {number} submittedBy - User ID of submitter
 * @param {number} reviewerId - User ID of assigned reviewer (optional)
 * @returns {Promise<object>} Workflow record
 */
export async function submitForApproval(periodId, submittedBy, reviewerId = null) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check if period exists and get company info
    const periodQuery = await client.query(
      `SELECT rp.*, c.id as company_id, c.name as company_name 
       FROM reporting_periods rp 
       JOIN companies c ON rp.company_id = c.id 
       WHERE rp.id = $1`,
      [periodId]
    );

    if (periodQuery.rows.length === 0) {
      throw new Error('Reporting period not found');
    }

    const period = periodQuery.rows[0];

    // Check for existing active workflow
    const existingWorkflow = await client.query(
      `SELECT id FROM approval_workflows 
       WHERE reporting_period_id = $1 AND status IN ('pending', 'under_review')`,
      [periodId]
    );

    if (existingWorkflow.rows.length > 0) {
      throw new Error('Active approval workflow already exists for this period');
    }

    // Create workflow
    const workflowQuery = await client.query(
      `INSERT INTO approval_workflows 
       (reporting_period_id, company_id, submitted_by, current_reviewer_id, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [periodId, period.company_id, submittedBy, reviewerId]
    );

    const workflow = workflowQuery.rows[0];

    // Add to history
    await client.query(
      `INSERT INTO approval_history 
       (workflow_id, action, performed_by, new_status)
       VALUES ($1, 'submitted', $2, 'pending')`,
      [workflow.id, submittedBy]
    );

    // If reviewer assigned, send notification
    if (reviewerId) {
      const reviewerQuery = await client.query(
        'SELECT email, name FROM users WHERE id = $1',
        [reviewerId]
      );

      if (reviewerQuery.rows.length > 0) {
        const reviewer = reviewerQuery.rows[0];
        const submitterQuery = await client.query(
          'SELECT name FROM users WHERE id = $1',
          [submittedBy]
        );
        
        await emailService.sendApprovalNotification(
          reviewer.email,
          {
            periodName: period.period_label,
            companyName: period.company_name,
            submittedBy: submitterQuery.rows[0]?.name || 'Unknown'
          },
          'submitted'
        );

        // Create notification record
        await client.query(
          `INSERT INTO approval_notifications 
           (workflow_id, user_id, notification_type, message)
           VALUES ($1, $2, 'submitted', $3)`,
          [
            workflow.id, 
            reviewerId, 
            `New approval request for ${period.period_label}`
          ]
        );
      }
    }

    await client.query('COMMIT');
    return workflow;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Approve a workflow
 * @param {number} workflowId - Workflow ID
 * @param {number} approvedBy - User ID of approver
 * @param {string} comments - Optional approval comments
 * @returns {Promise<object>} Updated workflow
 */
export async function approveWorkflow(workflowId, approvedBy, comments = null) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Get workflow
    const workflowQuery = await client.query(
      `SELECT w.*, rp.period_label, c.name as company_name 
       FROM approval_workflows w
       JOIN reporting_periods rp ON w.reporting_period_id = rp.id
       JOIN companies c ON w.company_id = c.id
       WHERE w.id = $1`,
      [workflowId]
    );

    if (workflowQuery.rows.length === 0) {
      throw new Error('Workflow not found');
    }

    const workflow = workflowQuery.rows[0];

    if (workflow.status === 'approved') {
      throw new Error('Workflow already approved');
    }

    // Update workflow
    const updateQuery = await client.query(
      `UPDATE approval_workflows 
       SET status = 'approved', approved_by = $1, approved_at = NOW(), updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [approvedBy, workflowId]
    );

    // Add to history
    await client.query(
      `INSERT INTO approval_history 
       (workflow_id, action, performed_by, previous_status, new_status, notes)
       VALUES ($1, 'approved', $2, $3, 'approved', $4)`,
      [workflowId, approvedBy, workflow.status, comments]
    );

    // Add comment if provided
    if (comments) {
      await client.query(
        `INSERT INTO approval_comments 
         (workflow_id, user_id, comment_text, comment_type)
         VALUES ($1, $2, $3, 'feedback')`,
        [workflowId, approvedBy, comments]
      );
    }

    // Send notification to submitter
    const submitterQuery = await client.query(
      'SELECT email FROM users WHERE id = $1',
      [workflow.submitted_by]
    );

    if (submitterQuery.rows.length > 0) {
      const approverQuery = await client.query(
        'SELECT first_name, last_name FROM users WHERE id = $1',
        [approvedBy]
      );

      await emailService.sendApprovalNotification(
        submitterQuery.rows[0].email,
        {
          periodName: workflow.period_label,
          companyName: workflow.company_name,
          reviewerName: `${approverQuery.rows[0]?.first_name || ''} ${approverQuery.rows[0]?.last_name || ''}`.trim() || 'Unknown',
          comments
        },
        'approved'
      );

      // Create notification
      await client.query(
        `INSERT INTO approval_notifications 
         (workflow_id, user_id, notification_type, message)
         VALUES ($1, $2, 'approved', $3)`,
        [workflowId, workflow.submitted_by, `Your report for ${workflow.period_label} has been approved`]
      );
    }

    await client.query('COMMIT');
    return updateQuery.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Reject a workflow
 * @param {number} workflowId - Workflow ID
 * @param {number} rejectedBy - User ID of rejector
 * @param {string} reason - Rejection reason (required)
 * @returns {Promise<object>} Updated workflow
 */
export async function rejectWorkflow(workflowId, rejectedBy, reason) {
  if (!reason || reason.trim() === '') {
    throw new Error('Rejection reason is required');
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Get workflow
    const workflowQuery = await client.query(
      `SELECT w.*, rp.period_label, c.name as company_name 
       FROM approval_workflows w
       JOIN reporting_periods rp ON w.reporting_period_id = rp.id
       JOIN companies c ON w.company_id = c.id
       WHERE w.id = $1`,
      [workflowId]
    );

    if (workflowQuery.rows.length === 0) {
      throw new Error('Workflow not found');
    }

    const workflow = workflowQuery.rows[0];

    // Update workflow
    const updateQuery = await client.query(
      `UPDATE approval_workflows 
       SET status = 'rejected', rejected_by = $1, rejected_at = NOW(), 
           rejection_reason = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [rejectedBy, reason, workflowId]
    );

    // Add to history
    await client.query(
      `INSERT INTO approval_history 
       (workflow_id, action, performed_by, previous_status, new_status, notes)
       VALUES ($1, 'rejected', $2, $3, 'rejected', $4)`,
      [workflowId, rejectedBy, workflow.status, reason]
    );

    // Add rejection comment
    await client.query(
      `INSERT INTO approval_comments 
       (workflow_id, user_id, comment_text, comment_type)
       VALUES ($1, $2, $3, 'concern')`,
      [workflowId, rejectedBy, reason]
    );

    // Send notification to submitter
    const submitterQuery = await client.query(
      'SELECT email FROM users WHERE id = $1',
      [workflow.submitted_by]
    );

    if (submitterQuery.rows.length > 0) {
      const rejecterQuery = await client.query(
        'SELECT first_name, last_name FROM users WHERE id = $1',
        [rejectedBy]
      );

      await emailService.sendApprovalNotification(
        submitterQuery.rows[0].email,
        {
          periodName: workflow.period_label,
          companyName: workflow.company_name,
          reviewerName: `${rejecterQuery.rows[0]?.first_name || ''} ${rejecterQuery.rows[0]?.last_name || ''}`.trim() || 'Unknown',
          comments: reason
        },
        'rejected'
      );

      // Create notification
      await client.query(
        `INSERT INTO approval_notifications 
         (workflow_id, user_id, notification_type, message)
         VALUES ($1, $2, 'rejected', $3)`,
        [workflowId, workflow.submitted_by, `Changes requested for ${workflow.period_label}`]
      );
    }

    await client.query('COMMIT');
    return updateQuery.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Add a comment to a workflow
 * @param {number} workflowId - Workflow ID
 * @param {number} userId - User ID
 * @param {string} commentText - Comment text
 * @param {string} commentType - Comment type (general, question, concern, feedback)
 * @param {boolean} isInternal - Whether comment is internal
 * @returns {Promise<object>} Comment record
 */
export async function addComment(workflowId, userId, commentText, commentType = 'general', isInternal = false) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Add comment
    const commentQuery = await client.query(
      `INSERT INTO approval_comments 
       (workflow_id, user_id, comment_text, comment_type, is_internal)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [workflowId, userId, commentText, commentType, isInternal]
    );

    // Add to history
    await client.query(
      `INSERT INTO approval_history 
       (workflow_id, action, performed_by, notes)
       VALUES ($1, 'commented', $2, $3)`,
      [workflowId, userId, commentText]
    );

    // Get workflow for notifications
    const workflowQuery = await client.query(
      `SELECT w.*, rp.period_label, c.name as company_name 
       FROM approval_workflows w
       JOIN reporting_periods rp ON w.reporting_period_id = rp.id
       JOIN companies c ON w.company_id = c.id
       WHERE w.id = $1`,
      [workflowId]
    );

    if (workflowQuery.rows.length > 0) {
      const workflow = workflowQuery.rows[0];
      
      // Notify relevant parties (submitter and reviewer)
      const notifyUserIds = [workflow.submitted_by];
      if (workflow.current_reviewer_id && workflow.current_reviewer_id !== userId) {
        notifyUserIds.push(workflow.current_reviewer_id);
      }

      const commenterQuery = await client.query(
        'SELECT first_name, last_name FROM users WHERE id = $1',
        [userId]
      );

      for (const notifyUserId of notifyUserIds) {
        if (notifyUserId !== userId) { // Don't notify the commenter
          const userQuery = await client.query(
            'SELECT email FROM users WHERE id = $1',
            [notifyUserId]
          );

          if (userQuery.rows.length > 0) {
            await emailService.sendApprovalNotification(
              userQuery.rows[0].email,
              {
                periodName: workflow.period_label,
                companyName: workflow.company_name,
                reviewerName: `${commenterQuery.rows[0]?.first_name || ''} ${commenterQuery.rows[0]?.last_name || ''}`.trim() || 'Unknown',
                comments: commentText
              },
              'commented'
            );

            // Create notification
            await client.query(
              `INSERT INTO approval_notifications 
               (workflow_id, user_id, notification_type, message)
               VALUES ($1, $2, 'comment_added', $3)`,
              [workflowId, notifyUserId, `New comment on ${workflow.period_label}`]
            );
          }
        }
      }
    }

    await client.query('COMMIT');
    return commentQuery.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get workflow by ID with full details
 * @param {number} workflowId - Workflow ID
 * @returns {Promise<object>} Workflow with comments and history
 */
export async function getWorkflowDetails(workflowId) {
  const workflowQuery = await pool.query(
    `SELECT w.*, 
      rp.period_label, rp.period_start_date, rp.period_end_date,
      c.name as company_name,
      u1.email as submitted_by_email, (u1.first_name || ' ' || u1.last_name) as submitted_by_name,
      u2.email as reviewer_email, (u2.first_name || ' ' || u2.last_name) as reviewer_name,
      u3.email as approved_by_email, (u3.first_name || ' ' || u3.last_name) as approved_by_name,
      u4.email as rejected_by_email, (u4.first_name || ' ' || u4.last_name) as rejected_by_name
     FROM approval_workflows w
     JOIN reporting_periods rp ON w.reporting_period_id = rp.id
     JOIN companies c ON w.company_id = c.id
     LEFT JOIN users u1 ON w.submitted_by = u1.id
     LEFT JOIN users u2 ON w.current_reviewer_id = u2.id
     LEFT JOIN users u3 ON w.approved_by = u3.id
     LEFT JOIN users u4 ON w.rejected_by = u4.id
     WHERE w.id = $1`,
    [workflowId]
  );

  if (workflowQuery.rows.length === 0) {
    throw new Error('Workflow not found');
  }

  const workflow = workflowQuery.rows[0];

  // Get comments
  const commentsQuery = await pool.query(
    `SELECT c.*, u.email, (u.first_name || ' ' || u.last_name) as user_name
     FROM approval_comments c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.workflow_id = $1
     ORDER BY c.created_at DESC`,
    [workflowId]
  );

  // Get history
  const historyQuery = await pool.query(
    `SELECT h.*, u.email, (u.first_name || ' ' || u.last_name) as user_name
     FROM approval_history h
     LEFT JOIN users u ON h.performed_by = u.id
     WHERE h.workflow_id = $1
     ORDER BY h.created_at DESC`,
    [workflowId]
  );

  return {
    ...workflow,
    comments: commentsQuery.rows,
    history: historyQuery.rows
  };
}

/**
 * Get all workflows for a company
 * @param {number} companyId - Company ID
 * @param {string} status - Filter by status (optional)
 * @returns {Promise<array>} Array of workflows
 */
export async function getCompanyWorkflows(companyId, status = null) {
  let query = `
    SELECT w.*, rp.period_label, 
      (u1.first_name || ' ' || u1.last_name) as submitted_by_name,
      (u2.first_name || ' ' || u2.last_name) as reviewer_name
    FROM approval_workflows w
    JOIN reporting_periods rp ON w.reporting_period_id = rp.id
    LEFT JOIN users u1 ON w.submitted_by = u1.id
    LEFT JOIN users u2 ON w.current_reviewer_id = u2.id
    WHERE w.company_id = $1
  `;

  const params = [companyId];

  if (status) {
    query += ` AND w.status = $2`;
    params.push(status);
  }

  query += ` ORDER BY w.submitted_at DESC`;

  const result = await pool.query(query, params);
  return result.rows;
}

export default {
  submitForApproval,
  approveWorkflow,
  rejectWorkflow,
  addComment,
  getWorkflowDetails,
  getCompanyWorkflows
};
