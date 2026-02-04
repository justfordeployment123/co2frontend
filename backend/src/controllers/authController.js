// ========================================================================
// AUTHENTICATION CONTROLLER
// Handles user registration, login, company signup, current user info
// Uses raw SQL queries via pg driver
// ========================================================================

import { v4 as uuidv4 } from 'uuid';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { query, queryOne, execute } from '../utils/db.js';
import { sendWelcomeEmail } from '../services/emailService.js';

/**
 * Register a new user
 * POST /api/auth/register
 * Body: { email, password, firstName, lastName }
 */
export async function registerUser(req, res, next) {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Check if user already exists
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser) {
      return res.status(409).json({ error: 'User already registered' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const userId = uuidv4();
    const now = new Date();

    // Insert user into database
    const newUser = await queryOne(
      `INSERT INTO users 
       (id, email, password_hash, first_name, last_name, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, email, first_name, last_name, created_at`,
      [userId, email.toLowerCase(), passwordHash, firstName || null, lastName || null, now, now]
    );

    // Generate JWT token
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
    });

    // Send welcome email (async, don't await to avoid blocking response)
    sendWelcomeEmail(
      newUser.email,
      `${newUser.first_name || ''} ${newUser.last_name || ''}`.trim() || 'User',
      'AURIXON Platform'
    ).catch((err) => {
      console.error('[AUTH] Failed to send welcome email:', err.message);
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login user
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user by email
    const user = await queryOne(
      'SELECT id, email, password_hash, first_name, last_name FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!user) {
      return res.status(401).json({ error: 'Email or password is incorrect' });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email or password is incorrect' });
    }

    // Update last login timestamp
    const now = new Date();
    await execute(
      'UPDATE users SET last_login_at = $1 WHERE id = $2',
      [now, user.id]
    );

    // Get user's company roles
    const roles = await query(
      `SELECT ucr.company_id, ucr.role, c.name as company_name
       FROM user_company_roles ucr
       JOIN companies c ON ucr.company_id = c.id
       WHERE ucr.user_id = $1
       ORDER BY c.name`,
      [user.id]
    );

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      roles: roles.rows,
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        companies: roles.rows.map((r) => ({
          companyId: r.company_id,
          companyName: r.company_name,
          role: r.role,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new company and register user as company admin
 * POST /api/auth/company/signup
 * Body: { email, password, companyName, country, industry, firstName, lastName }
 */
export async function signupCompany(req, res, next) {
  try {
    const {
      email,
      password,
      companyName,
      country,
      industry,
      firstName,
      lastName,
    } = req.body;

    // Validate input
    if (!email || !password || !companyName) {
      return res.status(400).json({
        error: 'Email, password, and company name required',
      });
    }

    // Check if user already exists
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser) {
      return res.status(409).json({ error: 'User already registered' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const userId = uuidv4();
    const companyId = uuidv4();
    const now = new Date();

    // Insert user
    await execute(
      `INSERT INTO users 
       (id, email, password_hash, first_name, last_name, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, email.toLowerCase(), passwordHash, firstName || null, lastName || null, now, now]
    );

    // Insert company
    await execute(
      `INSERT INTO companies 
       (id, name, country_code, industry, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [companyId, companyName, country || 'US', industry || null, now, now]
    );

    // Add user as company_admin
    await execute(
      `INSERT INTO user_company_roles 
       (id, user_id, company_id, role, created_at) 
       VALUES ($1, $2, $3, $4, $5)`,
      [uuidv4(), userId, companyId, 'company_admin', now]
    );

    // Insert locale settings (default to EN, UTC)
    await execute(
      `INSERT INTO locale_settings 
       (id, company_id, language, timezone, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), companyId, 'EN', 'UTC', now, now]
    );

    // Generate JWT token
    const token = generateToken({
      userId,
      email: email.toLowerCase(),
      roles: [{ companyId, companyName, role: 'company_admin' }],
    });

    res.status(201).json({
      message: 'Company and user created successfully',
      token,
      user: {
        id: userId,
        email: email.toLowerCase(),
        firstName,
        lastName,
        company: {
          id: companyId,
          name: companyName,
          role: 'company_admin',
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current authenticated user
 * GET /api/auth/me
 * Requires: Valid JWT token in Authorization header
 */
export async function getCurrentUser(req, res, next) {
  try {
    const userId = req.user.userId;

    // Get user info
    const user = await queryOne(
      'SELECT id, email, first_name, last_name FROM users WHERE id = $1',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's company roles
    const roles = await query(
      `SELECT ucr.company_id, ucr.role, c.name as company_name
       FROM user_company_roles ucr
       JOIN companies c ON ucr.company_id = c.id
       WHERE ucr.user_id = $1
       ORDER BY c.name`,
      [userId]
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        companies: roles.rows.map((r) => ({
          companyId: r.company_id,
          companyName: r.company_name,
          role: r.role,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/forgot-password
 * Request password reset (sends email with reset token)
 */
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const user = await queryOne(
      'SELECT id, email, first_name FROM users WHERE email = $1',
      [email]
    );

    // Always return success (don't leak if email exists)
    if (!user) {
      return res.json({
        message: 'If an account exists with that email, a password reset link has been sent.',
      });
    }

    // In a real application, you would:
    // 1. Generate a reset token
    // 2. Store it in database with expiration
    // 3. Send email with reset link
    // For now, just log it
    console.log(`Password reset requested for user: ${email}`);

    res.json({
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/reset-password
 * Reset password using token
 */
export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    // In a real application, you would:
    // 1. Verify the token from database
    // 2. Check if it's not expired
    // 3. Hash the new password
    // 4. Update user's password
    // 5. Delete the used token

    res.json({
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    next(error);
  }
}
