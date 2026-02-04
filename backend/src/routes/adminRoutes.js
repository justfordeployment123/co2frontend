// ========================================================================
// ADMIN ROUTES
// Platform administration endpoints
// ========================================================================

import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getPlatformMetrics,
  getAllCompanies,
  getAllUsers
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication
router.use(authMiddleware);

// Platform metrics
router.get('/metrics', getPlatformMetrics);

// Company management
router.get('/companies', getAllCompanies);

// User management
router.get('/users', getAllUsers);

export default router;
