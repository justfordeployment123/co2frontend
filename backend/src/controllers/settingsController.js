import pool from '../utils/db.js';
import bcrypt from 'bcrypt';
import { sendEmail } from '../services/emailService.js';

// Get current user's profile
export async function getSelfProfile(req, res) {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, language_preference AS language FROM users WHERE id = $1`,
      [userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Unable to retrieve profile. Please try again.' });
  }
}

// Update current user's profile
export async function updateSelfProfile(req, res) {
  try {
    const userId = req.user.userId;
    const { first_name, last_name, email, password, language } = req.body;
    let query = 'UPDATE users SET first_name = $1, last_name = $2, email = $3, language_preference = $4';
    let params = [first_name, last_name, email, language, userId];
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      query += ', password_hash = $5 WHERE id = $6 RETURNING id, email, first_name, last_name, language_preference AS language';
      params = [first_name, last_name, email, language, hash, userId];
    } else {
      query += ' WHERE id = $5 RETURNING id, email, first_name, last_name, language_preference AS language';
    }
    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Unable to update profile. Please try again.' });
  }
}

// List users in current user's company (admin only)
export async function getSelfCompanyUsers(req, res) {
  try {
    const companyId = req.user.companyId;
    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, cr.role FROM users u JOIN user_company_roles cr ON u.id = cr.user_id WHERE cr.company_id = $1`,
      [companyId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Unable to retrieve company users. Please try again.' });
  }
}


// Register user directly in current user's company (admin only)
export async function registerUserInSelfCompany(req, res) {
  try {
    const companyId = req.user.companyId;
    const { email, first_name, last_name, password, role } = req.body;
    if (!email || !role || !password) return res.status(400).json({ error: 'Email, password, and role required' });
    // Check if user exists
    const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userRes.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    const hash = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name',
      [email, hash, first_name || '', last_name || '']
    );
    const userId = newUser.rows[0].id;
    await pool.query('INSERT INTO user_company_roles (user_id, company_id, role) VALUES ($1, $2, $3)', [userId, companyId, role]);

    // Send registration email with credentials
    try {
      await sendEmail({
        to: email,
        subject: 'Your AURIXON Account Has Been Created',
        text: `Welcome to AURIXON!\n\nYour account has been registered by your company admin.\n\nLogin email: ${email}\nPassword: ${password}\n\nPlease log in and change your password after first login.`,
        html: `<p>Welcome to <b>AURIXON</b>!</p><p>Your account has been registered by your company admin.</p><ul><li><b>Login email:</b> ${email}</li><li><b>Password:</b> ${password}</li></ul><p>Please log in and change your password after first login.</p>`
      });
    } catch (emailErr) {
      console.error('[RegisterUser] Error sending registration email:', emailErr);
    }

    res.json({ success: true, user: newUser.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Unable to create user account. Please try again.' });
  }
}

// Update user info and role in current user's company (admin only)
export async function updateUserInSelfCompany(req, res) {
  try {
    const companyId = req.user.companyId;
    const { userId } = req.params;
    const { first_name, last_name, email, password, role } = req.body;
    // Update user info
    let query = 'UPDATE users SET first_name = $1, last_name = $2, email = $3';
    let params = [first_name, last_name, email, userId];
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      query += ', password_hash = $4 WHERE id = $5 RETURNING id, email, first_name, last_name';
      params = [first_name, last_name, email, hash, userId];
    } else {
      query += ' WHERE id = $4 RETURNING id, email, first_name, last_name';
    }
    const updatedUser = await pool.query(query, params);
    // Update role if provided
    if (role) {
      await pool.query('UPDATE user_company_roles SET role = $1 WHERE user_id = $2 AND company_id = $3', [role, userId, companyId]);
    }
    res.json({ success: true, user: updatedUser.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Unable to update user information. Please try again.' });
  }
}

// Update user role in current user's company (admin only)
export async function updateUserRoleInSelfCompany(req, res) {
  try {
    const companyId = req.user.companyId;
    const { userId } = req.params;
    const { role } = req.body;
    await pool.query('UPDATE user_company_roles SET role = $1 WHERE user_id = $2 AND company_id = $3', [role, userId, companyId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Unable to update user role. Please try again.' });
  }
}

// Remove user from current user's company (admin only)
export async function removeUserFromSelfCompany(req, res) {
  try {
    const companyId = req.user.companyId;
    const { userId } = req.params;
    await pool.query('DELETE FROM user_company_roles WHERE user_id = $1 AND company_id = $2', [userId, companyId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Unable to remove user. Please try again.' });
  }
}
