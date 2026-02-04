import pool from '../utils/db.js';
import bcrypt from 'bcrypt';
import * as emailService from '../services/emailService.js';

/**
 * Get user profile
 * GET /api/users/:userId/profile
 */

export async function getUserProfile(req, res) {
  try {
    const { userId } = req.params;
    
    const query = `
      SELECT 
        id,
        email,
        first_name,
        last_name,
        language_preference,
        timezone,
        notifications,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('[UserController] Error getting profile:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get profile'
    });
  }
}

/**
 * Update user profile
 * PUT /api/users/:userId/profile
 */
export async function updateUserProfile(req, res) {
  try {
    const { userId } = req.params;
    const {
      first_name,
      last_name,
      language_preference
    } = req.body;
    
    // Validate inputs if necessary
    
    const query = `
      UPDATE users
      SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        language_preference = COALESCE($3, language_preference),
        updated_at = NOW()
      WHERE id = $4
      RETURNING 
        id,
        email,
        first_name,
        last_name,
        language_preference
    `;
    
    const result = await pool.query(query, [
      first_name,
      last_name,
      language_preference,
      userId
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('[UserController] Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update profile'
    });
  }
}

/**
 * Change password
 * POST /api/users/:userId/change-password
 */
export async function changePassword(req, res) {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters'
      });
    }
    
    // Get current password hash
    const userQuery = `
      SELECT password_hash
      FROM users
      WHERE id = $1
    `;
    
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Verify current password
    const isValid = await bcrypt.compare(
      currentPassword,
      userResult.rows[0].password_hash
    );
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password
    const updateQuery = `
      UPDATE users
      SET 
        password_hash = $1,
        updated_at = NOW()
      WHERE id = $2
    `;
    
    await pool.query(updateQuery, [newPasswordHash, userId]);
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('[UserController] Error changing password:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to change password'
    });
  }
}

/**
 * Get company users (for User Management page)
 * GET /api/users/company/:companyId
 */
export async function getCompanyUsers(req, res) {
  try {
    const { companyId } = req.params;
    
    const query = `
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.language_preference,
        u.created_at,
        u.updated_at,
        u.is_active,
        cr.role,
        cr.created_at as role_assigned_at
      FROM users u
      JOIN user_company_roles cr ON u.id = cr.user_id
      WHERE cr.company_id = $1
      ORDER BY u.created_at DESC
    `;
    
    const result = await pool.query(query, [companyId]);
    
    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('[UserController] Error getting company users:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get company users'
    });
  }
}

/**
 * Invite user to company
 * POST /api/users/company/:companyId/invite
 */
export async function inviteUser(req, res) {
  try {
    const { companyId } = req.params;
    const { email, role, firstName, lastName } = req.body;
    
    if (!email || !role) {
      return res.status(400).json({
        success: false,
        error: 'Email and role are required'
      });
    }
    
    // Check if user already exists
    const existingUserQuery = `
      SELECT id FROM users WHERE email = $1
    `;
    
    const existingUser = await pool.query(existingUserQuery, [email]);
    
    let userId;
    
    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      
      // Check if user already has a role in this company
      const existingRoleQuery = `
        SELECT id FROM user_company_roles 
        WHERE user_id = $1 AND company_id = $2
      `;
      
      const existingRole = await pool.query(existingRoleQuery, [userId, companyId]);
      
      if (existingRole.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'User already has a role in this company'
        });
      }
    } else {
      // Create new user with temporary password
      const tempPassword = Math.random().toString(36).slice(-10);
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      
      const createUserQuery = `
        INSERT INTO users (email, password_hash, first_name, last_name)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      
      const newUser = await pool.query(createUserQuery, [
        email,
        passwordHash,
        firstName || '',
        lastName || ''
      ]);
      
      userId = newUser.rows[0].id;
      
      // TODO: Send invitation email with temporary password or reset link
      console.log(`[UserController] New user created: ${email} with temp password: ${tempPassword}`);
    }
    
    // Assign role to company
    const assignRoleQuery = `
      INSERT INTO user_company_roles (user_id, company_id, role)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    
    await pool.query(assignRoleQuery, [userId, companyId, role]);
    
    res.json({
      success: true,
      message: 'User invited successfully',
      userId
    });
  } catch (error) {
    console.error('[UserController] Error inviting user:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to send invitation. Please try again.'
    });
  }
}

/**
 * Add a new user directly (Admin function)
 * POST /api/users/company/:companyId/add
 */
export async function addUser(req, res) {
  try {
    const { companyId } = req.params;
    const { email, password, firstName, lastName, role } = req.body;
    
    if (!email || !password || !role || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUserQuery = 'SELECT id FROM users WHERE email = $1';
    const existingUser = await pool.query(existingUserQuery, [email]);

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create new user
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const createUserQuery = `
        INSERT INTO users (email, password_hash, first_name, last_name)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      
      const newUser = await client.query(createUserQuery, [
        email,
        passwordHash,
        firstName,
        lastName
      ]);
      
      const userId = newUser.rows[0].id;
      
      // Assign role to company
      const assignRoleQuery = `
        INSERT INTO user_company_roles (user_id, company_id, role)
        VALUES ($1, $2, $3)
      `;
      
      await client.query(assignRoleQuery, [userId, companyId, role]);

      await client.query('COMMIT');
      
      // Fetch company name for email
      const companyRes = await client.query('SELECT name FROM companies WHERE id = $1', [companyId]);
      const companyName = companyRes.rows[0]?.name || 'Your Company';

      // Send email
      try {
        await emailService.sendWelcomeEmail(email, firstName, companyName, password);
        console.log(`[UserController] User added and email sent: ${email}`);
      } catch (emailErr) {
        console.warn('Failed to send welcome email:', emailErr);
      }

      res.status(201).json({
        success: true,
        message: 'User added successfully',
        userId
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[UserController] Error adding user:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to create user account. Please try again.'
    });
  }
}

/**
 * Update user role
 * PUT /api/users/:userId/role
 */
export async function updateUserRole(req, res) {
  try {
    const { userId } = req.params;
    const { companyId, role } = req.body;
    
    if (!companyId || !role) {
      return res.status(400).json({
        success: false,
        error: 'Company ID and role are required'
      });
    }
    
    const query = `
      UPDATE user_company_roles
      SET 
        role = $1
      WHERE user_id = $2 AND company_id = $3
      RETURNING id
    `;
    
    const result = await pool.query(query, [role, userId, companyId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User role not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('[UserController] Error updating user role:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update user role'
    });
  }
}

/**
 * Deactivate user
 * PUT /api/users/:userId/deactivate
 */
export async function deactivateUser(req, res) {
  try {
    const { userId } = req.params;
    
    const query = `
      UPDATE users
      SET 
        is_active = false,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `;
    
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('[UserController] Error deactivating user:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to deactivate user'
    });
  }
}

/**
 * Reactivate user
 * PUT /api/users/:userId/reactivate
 */
export async function reactivateUser(req, res) {
  try {
    const { userId } = req.params;
    
    const query = `
      UPDATE users
      SET 
        is_active = true,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `;
    
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User reactivated successfully'
    });
  } catch (error) {
    console.error('[UserController] Error reactivating user:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reactivate user'
    });
  }
}

export default {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getCompanyUsers,
  inviteUser,
  addUser,
  updateUserRole,
  deactivateUser,
  reactivateUser,
  deleteUser
};

/**
 * Remove user from company
 * DELETE /api/users/company/:companyId/:userId
 */
export async function deleteUser(req, res) {
  try {
    const { companyId, userId } = req.params;
    
    // Check if user exists in company
    const checkQuery = `
      SELECT id FROM user_company_roles 
      WHERE user_id = $1 AND company_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [userId, companyId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found in this company'
      });
    }

    // Delete user role
    const deleteQuery = `
      DELETE FROM user_company_roles 
      WHERE user_id = $1 AND company_id = $2
    `;
    await pool.query(deleteQuery, [userId, companyId]);
    
    res.json({
      success: true,
      message: 'User removed from company successfully'
    });
  } catch (error) {
    console.error('[UserController] Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete user'
    });
  }
}
