/**
 * ========================================================================
 * TRANSLATION SERVICE
 * ========================================================================
 * 
 * Handles i18n translation logic with caching and locale management
 */

import pool from '../utils/db.js';

// Translation cache - stores translations by language
const translationCache = new Map();

// Cache expiration time (1 hour)
const CACHE_TTL = 60 * 60 * 1000;

/**
 * Get all translations for a language
 * @param {string} language - Language code (e.g., 'EN', 'DE')
 * @param {string} context - Optional context filter (e.g., 'form', 'email')
 * @returns {Promise<object>} Translations object
 */
export async function getTranslations(language, context = null) {
  try {
    // Check cache first
    const cacheKey = `${language.toUpperCase()}${context ? `:${context}` : ''}`;
    if (translationCache.has(cacheKey)) {
      const cached = translationCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[TranslationService] Cache hit for ${cacheKey}`);
        return cached.data;
      } else {
        translationCache.delete(cacheKey);
      }
    }

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

    // Cache the result
    translationCache.set(cacheKey, {
      data: translations,
      timestamp: Date.now()
    });

    console.log(`[TranslationService] Loaded ${result.rows.length} translations for ${language}`);
    return translations;

  } catch (error) {
    console.error('[TranslationService] Error fetching translations:', error);
    throw new Error(`Failed to fetch translations for language ${language}`);
  }
}

/**
 * Get translation by key
 * @param {string} language - Language code
 * @param {string} key - Translation key
 * @returns {Promise<string>} Translation value
 */
export async function getTranslationByKey(language, key) {
  try {
    const result = await pool.query(
      'SELECT translation_value, context FROM translations WHERE language_code = $1 AND translation_key = $2',
      [language.toUpperCase(), key]
    );

    if (result.rows.length === 0) {
      console.warn(`[TranslationService] Translation not found: ${language}:${key}`);
      return key; // Return key as fallback
    }

    return result.rows[0].translation_value;

  } catch (error) {
    console.error('[TranslationService] Error fetching translation:', error);
    throw new Error(`Failed to fetch translation for key ${key}`);
  }
}

/**
 * Get supported languages list
 * @returns {Promise<array>} Array of language objects
 */
export async function getSupportedLanguages() {
  try {
    const result = await pool.query(
      'SELECT DISTINCT language_code FROM translations ORDER BY language_code'
    );

    const languages = result.rows.map(row => ({
      code: row.language_code,
      name: getLanguageName(row.language_code)
    }));

    console.log(`[TranslationService] Found ${languages.length} supported languages`);
    return languages;

  } catch (error) {
    console.error('[TranslationService] Error fetching supported languages:', error);
    throw new Error('Failed to fetch supported languages');
  }
}

/**
 * Get company locale settings
 * @param {string} companyId - Company ID
 * @returns {Promise<object>} Locale settings
 */
export async function getLocaleSettings(companyId) {
  try {
    const result = await pool.query(
      'SELECT * FROM locale_settings WHERE company_id = $1',
      [companyId]
    );

    if (result.rows.length === 0) {
      console.warn(`[TranslationService] No locale settings found for company ${companyId}`);
      return null;
    }

    return result.rows[0];

  } catch (error) {
    console.error('[TranslationService] Error fetching locale settings:', error);
    throw new Error('Failed to fetch locale settings');
  }
}

/**
 * Update company locale settings
 * @param {string} companyId - Company ID
 * @param {object} settings - Settings object
 * @returns {Promise<object>} Updated locale settings
 */
export async function updateLocaleSettings(companyId, settings) {
  try {
    const {
      language,
      timezone,
      number_format,
      date_format,
      currency
    } = settings;

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
      throw new Error(`Locale settings not found for company ${companyId}`);
    }

    console.log(`[TranslationService] Updated locale settings for company ${companyId}`);
    return result.rows[0];

  } catch (error) {
    console.error('[TranslationService] Error updating locale settings:', error);
    throw new Error('Failed to update locale settings');
  }
}

/**
 * Clear translation cache (useful for testing or cache refresh)
 */
export function clearCache() {
  translationCache.clear();
  console.log('[TranslationService] Translation cache cleared');
}

/**
 * Helper: Get language name from code
 * @param {string} code - Language code
 * @returns {string} Language name
 */
function getLanguageName(code) {
  const names = {
    'EN': 'English',
    'DE': 'Deutsch (German)',
    'FR': 'Français (French)',
    'ES': 'Español (Spanish)',
    'IT': 'Italiano (Italian)',
    'NL': 'Nederlands (Dutch)',
    'PL': 'Polski (Polish)',
    'PT': 'Português (Portuguese)',
    'SV': 'Svenska (Swedish)',
    'DA': 'Dansk (Danish)'
  };
  return names[code] || code;
}

export default {
  getTranslations,
  getTranslationByKey,
  getSupportedLanguages,
  getLocaleSettings,
  updateLocaleSettings,
  clearCache
};
