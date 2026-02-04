// ========================================================================
// ADMIN DASHBOARD CONTROLLER
// Provides platform-wide metrics for internal admins
// ========================================================================

import { queryOne, queryAll } from '../utils/db.js';

/**
 * Get platform-wide metrics
 * GET /api/admin/metrics
 */
export async function getPlatformMetrics(req, res, next) {
  try {
    // Only internal_admin can access
    if (req.user.role !== 'internal_admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // Get total companies
    const companiesResult = await queryOne(
      'SELECT COUNT(*) as total FROM companies WHERE deleted_at IS NULL'
    );
    const totalCompanies = parseInt(companiesResult.total);

    // Get total users
    const usersResult = await queryOne(
      'SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL'
    );
    const totalUsers = parseInt(usersResult.total);

    // Get total reporting periods
    const periodsResult = await queryOne(
      'SELECT COUNT(*) as total FROM reporting_periods'
    );
    const totalReportingPeriods = parseInt(periodsResult.total);

    // Get total reports generated
    const reportsResult = await queryOne(
      'SELECT COUNT(*) as total FROM reports WHERE status = $1',
      ['generated']
    );
    const totalReportsGenerated = parseInt(reportsResult.total);

    // Get total payments
    const paymentsResult = await queryOne(
      `SELECT 
        COUNT(*) as total_payments,
        SUM(amount_cents) as total_revenue_cents
       FROM payment_transactions 
       WHERE payment_status = 'succeeded'`
    );
    const totalPayments = parseInt(paymentsResult.total_payments || 0);
    const totalRevenue = parseFloat(paymentsResult.total_revenue_cents || 0) / 100;

    // Get companies by industry
    const industriesResult = await queryAll(
      `SELECT industry, COUNT(*) as count 
       FROM companies 
       WHERE deleted_at IS NULL AND industry IS NOT NULL
       GROUP BY industry 
       ORDER BY count DESC`
    );

    // Get reporting periods by standard
    const standardsResult = await queryAll(
      `SELECT reporting_standard, COUNT(*) as count 
       FROM reporting_periods 
       GROUP BY reporting_standard 
       ORDER BY count DESC`
    );

    // Get recent activity
    const recentCompanies = await queryAll(
      `SELECT id, name, created_at, industry
       FROM companies 
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC 
       LIMIT 10`
    );

    const recentReports = await queryAll(
      `SELECT r.id, r.created_at, c.name as company_name, rp.period_label
       FROM reports r
       JOIN reporting_periods rp ON r.reporting_period_id = rp.id
       JOIN companies c ON rp.company_id = c.id
       WHERE r.status = 'generated'
       ORDER BY r.created_at DESC
       LIMIT 10`
    );

    // Get monthly report generation trend (last 6 months)
    const monthlyTrend = await queryAll(
      `SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as reports_generated
       FROM reports
       WHERE created_at >= NOW() - INTERVAL '6 months'
       AND status = 'generated'
       GROUP BY month
       ORDER BY month ASC`
    );

    // Get activity data completeness
    const completenessResult = await queryOne(
      `SELECT 
        COUNT(DISTINCT reporting_period_id) as periods_with_activities
       FROM (
         SELECT reporting_period_id FROM stationary_combustion_activities
         UNION ALL
         SELECT reporting_period_id FROM mobile_sources_activities
         UNION ALL
         SELECT reporting_period_id FROM electricity_activities
       ) as all_activities`
    );

    res.json({
      summary: {
        totalCompanies,
        totalUsers,
        totalReportingPeriods,
        totalReportsGenerated,
        totalPayments,
        totalRevenue,
        avgRevenuePerCompany: totalCompanies > 0 ? (totalRevenue / totalCompanies).toFixed(2) : 0
      },
      breakdown: {
        industriesResult,
        standardsResult
      },
      recentActivity: {
        recentCompanies,
        recentReports
      },
      trends: {
        monthlyReportGeneration: monthlyTrend
      },
      completeness: {
        periodsWithActivities: parseInt(completenessResult.periods_with_activities || 0)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all companies (admin view)
 * GET /api/admin/companies
 */
export async function getAllCompanies(req, res, next) {
  try {
    if (req.user.role !== 'internal_admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { search, industry, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        c.id, c.name, c.industry, c.country_code, c.created_at,
        COUNT(DISTINCT rp.id) as reporting_periods_count,
        COUNT(DISTINCT r.id) as reports_count,
        COUNT(DISTINCT u.id) as users_count
      FROM companies c
      LEFT JOIN reporting_periods rp ON c.id = rp.company_id
      LEFT JOIN reports r ON rp.id = r.reporting_period_id
      LEFT JOIN user_company_roles ucr ON c.id = ucr.company_id
      LEFT JOIN users u ON ucr.user_id = u.id
      WHERE c.deleted_at IS NULL
    `;

    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND c.name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (industry) {
      query += ` AND c.industry = $${paramIndex}`;
      params.push(industry);
      paramIndex++;
    }

    query += `
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), parseInt(offset));

    const companies = await queryAll(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM companies 
      WHERE deleted_at IS NULL
      ${search ? `AND name ILIKE '%${search}%'` : ''}
      ${industry ? `AND industry = '${industry}'` : ''}
    `;
    const totalResult = await queryOne(countQuery);

    res.json({
      companies,
      pagination: {
        total: parseInt(totalResult.total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all users (admin view)
 * GET /api/admin/users
 */
export async function getAllUsers(req, res, next) {
  try {
    if (req.user.role !== 'internal_admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { search, role, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.created_at, u.last_login_at, u.is_active,
        ucr.role, c.name as company_name, c.id as company_id
      FROM users u
      LEFT JOIN user_company_roles ucr ON u.id = ucr.user_id
      LEFT JOIN companies c ON ucr.company_id = c.id
      WHERE u.deleted_at IS NULL
    `;

    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (u.email ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      query += ` AND ucr.role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    query += `
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), parseInt(offset));

    const users = await queryAll(query, params);

    const countQuery = `SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL`;
    const totalResult = await queryOne(countQuery);

    res.json({
      users,
      pagination: {
        total: parseInt(totalResult.total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getPlatformMetrics,
  getAllCompanies,
  getAllUsers
};
