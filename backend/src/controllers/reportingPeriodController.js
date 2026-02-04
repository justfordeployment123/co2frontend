// ========================================================================
// REPORTING PERIODS CONTROLLER
// Manages reporting periods (annual, fiscal year, or custom)
// ========================================================================

import { v4 as uuidv4 } from 'uuid';
import { queryOne, queryAll, execute } from '../utils/db.js';

/**
 * Create reporting period
 * POST /api/companies/:companyId/reporting-periods
 */
export async function createReportingPeriod(req, res, next) {
  try {
    const { companyId } = req.params;
    const { label, startDate, endDate, type, reportingStandard } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate required',
      });
    }

    // Validate reporting standard
    const validStandards = ['CSRD', 'GHG_PROTOCOL', 'ISO_14064'];
    const standard = reportingStandard || 'CSRD';
    if (!validStandards.includes(standard)) {
      return res.status(400).json({
        error: `Invalid reporting standard. Must be one of: ${validStandards.join(', ')}`,
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        error: 'startDate must be before endDate',
      });
    }

    const id = uuidv4();
    const now = new Date();

    const result = await queryOne(
      `INSERT INTO reporting_periods 
       (id, company_id, period_label, period_start_date, period_end_date, period_type, reporting_standard, status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [id, companyId, label || null, start, end, type || null, standard, 'draft', now, now]
    );

    res.status(201).json({
      message: 'Reporting period created',
      reportingPeriod: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get reporting period
 * GET /api/companies/:companyId/reporting-periods/:periodId
 */
export async function getReportingPeriod(req, res, next) {
  try {
    const { companyId, periodId } = req.params;

    const period = await queryOne(
      'SELECT * FROM reporting_periods WHERE id = $1 AND company_id = $2',
      [periodId, companyId]
    );

    if (!period) {
      return res.status(404).json({ error: 'Reporting period not found' });
    }

    res.json({ reportingPeriod: period });
  } catch (error) {
    next(error);
  }
}

/**
 * List reporting periods
 * GET /api/companies/:companyId/reporting-periods
 */
export async function listReportingPeriods(req, res, next) {
  try {
    const { companyId } = req.params;
    const { status } = req.query;

    let query = 'SELECT * FROM reporting_periods WHERE company_id = $1';
    const values = [companyId];

    if (status) {
      query += ' AND status = $2';
      values.push(status);
    }

    query += ' ORDER BY period_start_date DESC';

    const periods = await queryAll(query, values);

    res.json({
      count: periods.length,
      reportingPeriods: periods,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update reporting period
 * PUT /api/companies/:companyId/reporting-periods/:periodId
 */
export async function updateReportingPeriod(req, res, next) {
  try {
    const { companyId, periodId } = req.params;
    const { label, startDate, endDate, type, status } = req.body;

    const updates = [];
    const values = [companyId, periodId];
    let paramIndex = 3;

    if (label) {
      updates.push(`period_label = $${paramIndex}`);
      values.push(label);
      paramIndex++;
    }

    if (startDate) {
      updates.push(`period_start_date = $${paramIndex}`);
      values.push(new Date(startDate));
      paramIndex++;
    }

    if (endDate) {
      updates.push(`period_end_date = $${paramIndex}`);
      values.push(new Date(endDate));
      paramIndex++;
    }

    if (type) {
      updates.push(`period_type = $${paramIndex}`);
      values.push(type);
      paramIndex++;
    }

    if (status) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    updates.push(`updated_at = $${paramIndex}`);
    values.push(new Date());

    const result = await queryOne(
      `UPDATE reporting_periods SET ${updates.join(', ')} WHERE id = $2 AND company_id = $1 RETURNING *`,
      values
    );

    if (!result) {
      return res.status(404).json({ error: 'Reporting period not found' });
    }

    res.json({
      message: 'Reporting period updated',
      reportingPeriod: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete reporting period
 * DELETE /api/companies/:companyId/reporting-periods/:periodId
 */
export async function deleteReportingPeriod(req, res, next) {
  try {
    const { companyId, periodId } = req.params;

    await execute(
      'DELETE FROM reporting_periods WHERE id = $1 AND company_id = $2',
      [periodId, companyId]
    );

    res.json({ message: 'Reporting period deleted' });
  } catch (error) {
    next(error);
  }
}
