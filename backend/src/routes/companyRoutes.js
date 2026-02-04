// ========================================================================
// COMPANY ROUTES
// /companies/:companyId, /companies/:companyId/users
// ========================================================================

import { Router } from 'express';
import {
  getCompany,
  updateCompany,
  inviteUserToCompany,
  listCompanyUsers,
  updateUserRole,
  removeUserFromCompany,
} from '../controllers/companyController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

/**
 * GET /companies/:companyId
 * Get company details
 * @requires auth + VIEWER role in company
 */
router.get('/:companyId', authMiddleware, requireRole(['viewer']), getCompany);

/**
 * PUT /companies/:companyId
 * Update company details
 * @requires auth + COMPANY_ADMIN role in company
 */
router.put('/:companyId', authMiddleware, requireRole(['company_admin']), updateCompany);

/**
 * GET /companies/:companyId/users
 * List all users in company
 * @requires auth + VIEWER role in company
 */
router.get('/:companyId/users', authMiddleware, requireRole(['viewer']), listCompanyUsers);

/**
 * POST /companies/:companyId/users
 * Invite user to company
 * @requires auth + COMPANY_ADMIN role in company
 * @body { email, role }
 */
router.post('/:companyId/users', authMiddleware, requireRole(['company_admin']), inviteUserToCompany);

/**
 * PUT /companies/:companyId/users/:userId
 * Update user role in company
 * @requires auth + COMPANY_ADMIN role in company
 * @body { role }
 */
router.put(
  '/:companyId/users/:userId',
  authMiddleware,
  requireRole(['company_admin']),
  updateUserRole
);

/**
 * DELETE /companies/:companyId/users/:userId
 * Remove user from company
 * @requires auth + COMPANY_ADMIN role in company
 */
router.delete(
  '/:companyId/users/:userId',
  authMiddleware,
  requireRole(['company_admin']),
  removeUserFromCompany
);

export default router;
