/**
 * ========================================================================
 * TRANSLATION CONTROLLER
 * ========================================================================
 * 
 * HTTP handlers for i18n translation endpoints
 */

import pool from '../utils/db.js';

/**
 * Get all translations for a language
 * GET /api/translations/:language
 */
export async function getTranslations(req, res) {
  try {
    const { language } = req.params;
    const { context } = req.query; // Optional filter by context

    let query = 'SELECT translation_key, translation_value, context FROM translations WHERE language_code = $1';
    const params = [language.toUpperCase()];

    if (context) {
      query += ' AND context = $2';
      params.push(context);
    }

    query += ' ORDER BY translation_key';

    const result = await pool.query(query, params);

    // Transform to key-value object
    const translations = result.rows.reduce((acc, row) => {
      acc[row.translation_key] = row.translation_value;
      return acc;
    }, {});

    res.json({
      success: true,
      language: language.toUpperCase(),
      count: result.rows.length,
      translations
    });

  } catch (error) {
    console.error('[TranslationController] Error fetching translations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch translations'
    });
  }
}

/**
 * Get translation by key
 * GET /api/translations/:language/:key
 */
export async function getTranslationByKey(req, res) {
  try {
    const { language, key } = req.params;

    const result = await pool.query(
      'SELECT translation_value, context FROM translations WHERE language_code = $1 AND translation_key = $2',
      [language.toUpperCase(), key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Translation not found'
      });
    }

    res.json({
      success: true,
      key,
      language: language.toUpperCase(),
      value: result.rows[0].translation_value,
      context: result.rows[0].context
    });

  } catch (error) {
    console.error('[TranslationController] Error fetching translation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch translation'
    });
  }
}

/**
 * Get supported languages
 * GET /api/translations/languages
 */
export async function getSupportedLanguages(req, res) {
  try {
    const result = await pool.query(
      'SELECT DISTINCT language_code FROM translations ORDER BY language_code'
    );

    const languages = result.rows.map(row => ({
      code: row.language_code,
      name: getLanguageName(row.language_code)
    }));

    res.json({
      success: true,
      languages,
      count: languages.length
    });

  } catch (error) {
    console.error('[TranslationController] Error fetching languages:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch supported languages'
    });
  }
}

/**
 * Get company locale settings
 * GET /api/translations/locale/:companyId
 */
export async function getLocaleSettings(req, res) {
  try {
    const { companyId } = req.params;

    // Verify user has access to this company
    if (req.user.company_id !== companyId && req.user.role !== 'internal_admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const result = await pool.query(
      'SELECT * FROM locale_settings WHERE company_id = $1',
      [companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Locale settings not found'
      });
    }

    res.json({
      success: true,
      locale: result.rows[0]
    });

  } catch (error) {
    console.error('[TranslationController] Error fetching locale settings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch locale settings'
    });
  }
}

/**
 * Update company locale settings
 * PUT /api/translations/locale/:companyId
 */
export async function updateLocaleSettings(req, res) {
  try {
    const { companyId } = req.params;
    const { language, timezone, number_format, date_format, currency } = req.body;

    // Verify user has access (company_admin or internal_admin)
    if (req.user.company_id !== companyId && req.user.role !== 'internal_admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (req.user.role !== 'company_admin' && req.user.role !== 'internal_admin') {
      return res.status(403).json({
        success: false,
        error: 'Only company admins can update locale settings'
      });
    }

    const result = await pool.query(
      `UPDATE locale_settings 
       SET language = COALESCE($1, language),
           timezone = COALESCE($2, timezone),
           number_format = COALESCE($3, number_format),
           date_format = COALESCE($4, date_format),
           currency = COALESCE($5, currency),
           updated_at = NOW()
       WHERE company_id = $6
       RETURNING *`,
      [language, timezone, number_format, date_format, currency, companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Locale settings not found'
      });
    }

    res.json({
      success: true,
      locale: result.rows[0]
    });

  } catch (error) {
    console.error('[TranslationController] Error updating locale settings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update locale settings'
    });
  }
}

/**
 * Helper: Get language name from code
 */
function getLanguageName(code) {
  const names = {
    'EN': 'English',
    'DE': 'Deutsch (German)'
  };
  return names[code] || code;
}

export default {
  getTranslations,
  getTranslationByKey,
  getSupportedLanguages,
  getLocaleSettings,
  updateLocaleSettings
};
