// ========================================================================
// COMPANY CONTROLLER
// CRUD operations for companies and user management
// Uses raw SQL queries via pg driver
// ========================================================================

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, execute } from '../utils/db.js';


/**
 * Get company details
 * GET /api/companies/:companyId
 * Requires: VIEWER+ role
 */
export async function getCompany(req, res, next) {
  try {
    const { companyId } = req.params;

    // Get company info
    const company = await queryOne(
      'SELECT id, name, country_code, industry, created_at FROM companies WHERE id = $1',
      [companyId]
    );

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get company users
    const users = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, ucr.role, ucr.created_at
       FROM user_company_roles ucr
       JOIN users u ON ucr.user_id = u.id
       WHERE ucr.company_id = $1
       ORDER BY u.email`,
      [companyId]
    );

    res.json({
      company: {
        ...company,
        users: users.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update company details
 * PUT /api/companies/:companyId
 * Requires: COMPANY_ADMIN role
 */
export async function updateCompany(req, res, next) {
  try {
    const { companyId } = req.params;
    const { name, country_code, industry } = req.body;
    const now = new Date();

    // Build dynamic UPDATE query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }
    if (country_code !== undefined) {
      updates.push(`country_code = $${paramIndex}`);
      values.push(country_code);
      paramIndex++;
    }
    if (industry !== undefined) {
      updates.push(`industry = $${paramIndex}`);
      values.push(industry);
      paramIndex++;
    }

    // Always update timestamp
    updates.push(`updated_at = $${paramIndex}`);
    values.push(now);
    paramIndex++;

    // Add company ID as final parameter
    values.push(companyId);

    const updatedCompany = await queryOne(
      `UPDATE companies SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (!updatedCompany) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({
      message: 'Company updated successfully',
      company: updatedCompany,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Invite user to company
 * POST /api/companies/:companyId/users
 * Body: { email, role }
 * Requires: COMPANY_ADMIN role
 */
export async function inviteUserToCompany(req, res, next) {
  try {
    const { companyId } = req.params;
    let { email, role } = req.body;
    const invitedByUserId = req.user.userId;

    // Validate input
    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role required' });
    }

    // Normalize role to lowercase to match DB enum
    role = role.toLowerCase();
    
    const validRoles = ['company_admin', 'editor', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: `Role must be one of: ${validRoles.join(', ')}`,
      });
    }

    // Find user by email
    const user = await queryOne(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!user) {
      return res.status(404).json({ error: `User with email ${email} not found` });
    }

    // Check if user already has role in company
    const existingRole = await queryOne(
      'SELECT id FROM user_company_roles WHERE user_id = $1 AND company_id = $2',
      [user.id, companyId]
    );

    if (existingRole) {
      return res.status(409).json({ error: 'User already has a role in this company' });
    }

    // Assign role
    const now = new Date();
    const newRole = await queryOne(
      `INSERT INTO user_company_roles 
       (id, user_id, company_id, role, created_at) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, user_id, company_id, role`,
      [uuidv4(), user.id, companyId, role, now]
    );

    res.status(201).json({
      message: 'User invited successfully',
      role: newRole,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List all users in a company
 * GET /api/companies/:companyId/users
 * Requires: VIEWER+ role
 */
export async function listCompanyUsers(req, res, next) {
  try {
    const { companyId } = req.params;

    const users = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, ucr.role, ucr.created_at as invited_at
       FROM user_company_roles ucr
       JOIN users u ON ucr.user_id = u.id
       WHERE ucr.company_id = $1
       ORDER BY u.email`,
      [companyId]
    );

    res.json({
      users: users.rows.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.first_name,
        lastName: u.last_name,
        role: u.role,
        invitedAt: u.invited_at,
      })),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user role in company
 * PUT /api/companies/:companyId/users/:userId
 * Body: { role }
 * Requires: COMPANY_ADMIN role
 */
export async function updateUserRole(req, res, next) {
  try {
    const { companyId, userId } = req.params;
    let { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    role = role.toLowerCase();
    const validRoles = ['company_admin', 'editor', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: `Role must be one of: ${validRoles.join(', ')}`,
      });
    }

    const updatedRole = await queryOne(
      `UPDATE user_company_roles SET role = $1
       WHERE user_id = $2 AND company_id = $3 
       RETURNING id, user_id, company_id, role`,
      [role, userId, companyId]
    );

    if (!updatedRole) {
      return res.status(404).json({ error: 'User role not found' });
    }

    res.json({
      message: 'User role updated successfully',
      role: updatedRole,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove user from company
 * DELETE /api/companies/:companyId/users/:userId
 * Requires: COMPANY_ADMIN role
 */
export async function removeUserFromCompany(req, res, next) {
  try {
    const { companyId, userId } = req.params;

    // Check if user is the last COMPANY_ADMIN
    const adminCount = await queryOne(
      'SELECT COUNT(*) as count FROM user_company_roles WHERE company_id = $1 AND role = $2',
      [companyId, 'COMPANY_ADMIN']
    );

    const userRole = await queryOne(
      'SELECT role FROM user_company_roles WHERE user_id = $1 AND company_id = $2',
      [userId, companyId]
    );

    if (!userRole) {
      return res.status(404).json({ error: 'User role not found' });
    }

    if (adminCount.count === 1 && userRole.role === 'COMPANY_ADMIN') {
      return res.status(400).json({
        error: 'Cannot remove the last Company Admin from the company',
      });
    }

    // Delete the role
    await execute(
      'DELETE FROM user_company_roles WHERE user_id = $1 AND company_id = $2',
      [userId, companyId]
    );

    res.json({ message: 'User removed from company' });
  } catch (error) {
    next(error);
  }
}
