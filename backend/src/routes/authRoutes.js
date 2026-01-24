// ========================================================================
// AUTH ROUTES
// /auth/register, /auth/login, /auth/company/signup, /auth/me
// ========================================================================

import { Router } from 'express';
import {
  registerUser,
  loginUser,
  signupCompany,
  getCurrentUser,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * POST /auth/register
 * Register a new user
 * @body { email, password, firstName?, lastName? }
 */
router.post('/register', registerUser);

/**
 * POST /auth/login
 * Login user
 * @body { email, password }
 */
router.post('/login', loginUser);

/**
 * POST /auth/company/signup
 * Create company and assign user as COMPANY_ADMIN
 * @body { email, password, companyName, country, industry?, firstName?, lastName? }
 */
router.post('/company/signup', signupCompany);

/**
 * POST /auth/forgot-password
 * Request password reset
 * @body { email }
 */
router.post('/forgot-password', forgotPassword);

/**
 * POST /auth/reset-password
 * Reset password using token
 * @body { token, password }
 */
router.post('/reset-password', resetPassword);

/**
 * GET /auth/me
 * Get current user and their roles
 * @requires auth
 */
router.get('/me', authMiddleware, getCurrentUser);

export default router;
