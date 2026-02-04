import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getSelfProfile,
  updateSelfProfile,
  getSelfCompanyUsers,
  registerUserInSelfCompany,
  updateUserInSelfCompany,
  updateUserRoleInSelfCompany,
  removeUserFromSelfCompany
} from '../controllers/settingsController.js';

const router = express.Router();


router.use(authMiddleware);

// Profile
router.get('/profile', getSelfProfile);
router.put('/profile', updateSelfProfile);

// User management (company admin only)
router.get('/users', getSelfCompanyUsers);
router.post('/users', registerUserInSelfCompany); // Register new user
router.put('/users/:userId', updateUserInSelfCompany); // Update user info/role
router.put('/users/:userId/role', updateUserRoleInSelfCompany); // (legacy, for role only)
router.delete('/users/:userId', removeUserFromSelfCompany);

export default router;
