/**
 * ========================================================================
 * TRANSLATION ROUTES
 * ========================================================================
 * 
 * i18n and localization endpoints
 */

import { Router } from 'express';
import * as translationController from '../controllers/translationController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/translations/languages
 * Get list of supported languages
 * Public endpoint (no authentication required)
 */
router.get('/languages', translationController.getSupportedLanguages);

/**
 * GET /api/translations/:language
 * Get all translations for a language
 * Public endpoint (no authentication required)
 * Query params: context (optional)
 */
router.get('/:language', translationController.getTranslations);

/**
 * GET /api/translations/:language/:key
 * Get specific translation by key
 * Public endpoint (no authentication required)
 */
router.get('/:language/:key', translationController.getTranslationByKey);

/**
 * GET /api/translations/locale/:companyId
 * Get company locale settings
 * Requires authentication
 */
router.get('/locale/:companyId', authMiddleware, translationController.getLocaleSettings);

/**
 * PUT /api/translations/locale/:companyId
 * Update company locale settings
 * Requires authentication + company_admin role
 */
router.put('/locale/:companyId', authMiddleware, translationController.updateLocaleSettings);

export default router;
