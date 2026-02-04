/**
 * ========================================================================
 * USER ROUTES
 * ========================================================================
 * 
 * User profile and management endpoints
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
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
} from '../controllers/userController.js';

const router = express.Router();

// All user routes require authentication
router.use(authMiddleware);

/**
 * GET /api/users/:userId/profile
 * Get user profile
 */
router.get('/:userId/profile', getUserProfile);

/**
 * PUT /api/users/:userId/profile
 * Update user profile
 */
router.put('/:userId/profile', updateUserProfile);

/**
 * POST /api/users/:userId/change-password
 * Change user password
 */
router.post('/:userId/change-password', changePassword);

/**
 * GET /api/users/company/:companyId
 * Get all users in a company
 */
router.get('/company/:companyId', getCompanyUsers);

/**
 * POST /api/users/company/:companyId/invite
 * Invite a new user to the company
 */
router.post('/company/:companyId/invite', inviteUser);

/**
 * POST /api/users/company/:companyId/add
 * Add a new user to the company directly
 */
router.post('/company/:companyId/add', addUser);

/**
 * PUT /api/users/:userId/role
 * Update user role in a company
 */
router.put('/:userId/role', updateUserRole);

/**
 * PUT /api/users/:userId/deactivate
 * Deactivate a user
 */
router.put('/:userId/deactivate', deactivateUser);

/**
 * PUT /api/users/:userId/reactivate
 * Reactivate a user
 */
router.put('/:userId/reactivate', reactivateUser);

/**
 * DELETE /api/users/company/:companyId/:userId
 * Remove user from company
 */
router.delete('/company/:companyId/:userId', deleteUser);

export default router;
