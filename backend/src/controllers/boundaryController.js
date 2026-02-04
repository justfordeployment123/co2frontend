// ========================================================================
// BOUNDARY QUESTIONS CONTROLLER
// Manages scope determination (Scope 1, 2, 3 boundary questions)
// Includes company-level boundary answers for organizational scope
// ========================================================================

import { v4 as uuidv4 } from 'uuid';
import pool, { queryOne, execute, queryAll } from '../utils/db.js';

/**
 * Get company boundary answers (organizational scope configuration)
 * GET /api/boundary/answers
 */
export async function getCompanyBoundaryAnswers(req, res, next) {
  try {
    const companyId = req.user.company_id;

    const answers = await queryAll(
      `SELECT cba.question_id, cba.answer_boolean, cba.notes, 
              rbq.question_text, rbq.activity_type_id, rbq.scope, rbq.is_required
       FROM company_boundary_answers cba
       JOIN reference_boundary_questions rbq ON rbq.id = cba.question_id
       WHERE cba.company_id = $1
       ORDER BY rbq.scope, rbq.id`,
      [companyId]
    );

    res.json(answers);
  } catch (error) {
    next(error);
  }
}

/**
 * Save/update company boundary answers
 * POST /api/boundary/answers
 * Body: { answers: [{ question_id, answer_boolean, notes }] }
 */
export async function saveCompanyBoundaryAnswers(req, res, next) {
  try {
    const companyId = req.user.company_id;
    const { answers } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers must be an array' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get question categories for mapping
      const questionsResult = await client.query(
        'SELECT id, category FROM reference_boundary_questions'
      );
      const questionMap = {};
      questionsResult.rows.forEach(q => {
        questionMap[q.id] = q.category;
      });

      const categoryAnswers = {};

      for (const answer of answers) {
        const { question_id, answer_boolean, notes } = answer;

        // Check if question is required (Scope 1 & 2 must always be enabled)
        const question = await queryOne(
          'SELECT is_required FROM reference_boundary_questions WHERE id = $1',
          [question_id]
        );

        if (question?.is_required && !answer_boolean) {
          return res.status(400).json({ error: `Question ${question_id} is required and cannot be disabled` });
        }

        // Upsert answer to company_boundary_answers
        await client.query(
          `INSERT INTO company_boundary_answers (company_id, question_id, answer_boolean, notes)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (company_id, question_id) 
           DO UPDATE SET answer_boolean = EXCLUDED.answer_boolean, 
                         notes = EXCLUDED.notes, 
                         updated_at = CURRENT_TIMESTAMP`,
          [companyId, question_id, answer_boolean, notes || null]
        );

        // Map to category for boundary_questions table
        const category = questionMap[question_id];
        if (category) {
          categoryAnswers[category] = answer_boolean;
        }
      }

      // Sync to boundary_questions table for the latest reporting period
      const periodResult = await client.query(
        `SELECT id FROM reporting_periods 
         WHERE company_id = $1 
         ORDER BY created_at DESC LIMIT 1`,
        [companyId]
      );

      if (periodResult.rows.length > 0) {
        const periodId = periodResult.rows[0].id;

        // Check if boundary_questions record exists
        const existingBQ = await client.query(
          'SELECT id FROM boundary_questions WHERE reporting_period_id = $1',
          [periodId]
        );

        if (existingBQ.rows.length === 0) {
          // Create new boundary_questions record
          await client.query(
            `INSERT INTO boundary_questions (
              reporting_period_id,
              has_stationary_combustion, has_mobile_sources, has_refrigeration_ac,
              has_fire_suppression, has_purchased_gases, has_electricity, has_steam,
              has_market_based_factors, has_business_travel, has_commuting,
              has_transportation_distribution, has_waste, has_offsets
            ) VALUES ($1, false, false, false, false, false, false, false, false, false, false, false, false, false)`,
            [periodId]
          );
        }

        // Update boundary_questions with the new answers
        const updateParts = [];
        const updateValues = [];
        let pIdx = 1;

        for (const [category, value] of Object.entries(categoryAnswers)) {
          let colName;
          if (category === 'market_based') {
            colName = 'has_market_based_factors';
          } else {
            colName = `has_${category}`;
          }
          
          updateParts.push(`${colName} = $${pIdx}`);
          updateValues.push(value);
          pIdx++;
        }

        if (updateParts.length > 0) {
          updateValues.push(periodId);
          await client.query(
            `UPDATE boundary_questions 
             SET ${updateParts.join(', ')}, updated_at = NOW()
             WHERE reporting_period_id = $${pIdx}`,
            updateValues
          );
        }
      }

      await client.query('COMMIT');
      res.json({ success: true, message: 'Boundary answers saved successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[saveCompanyBoundaryAnswers] Error:', error);
    next(error);
  }
}

/**
 * Create or get boundary questions for a reporting period
 * POST /api/reporting-periods/:periodId/boundary-questions
 */
export async function createOrUpdateBoundaryQuestions(req, res, next) {
// ... existing code ...
}

// ... existing code ...


/**
 * Helper function to normalize database field names to API format
 * Removes 'has_' prefix for API response
 */
function normalizeDbFieldsForResponse(dbObject) {
  const apiObject = {};
  for (const [key, value] of Object.entries(dbObject)) {
    if (key.startsWith('has_')) {
      // Remove 'has_' prefix for API response
      const apiKey = key.replace(/^has_/, '');
      apiObject[apiKey] = value;
    } else {
      apiObject[key] = value;
    }
  }
  return apiObject;
}

/**
 * Get boundary questions for a reporting period
 * GET /api/reporting-periods/:periodId/boundary-questions
 */
export async function getBoundaryQuestions(req, res, next) {
  try {
    const { periodId } = req.params;
    const companyId = req.params.companyId;

    // Verify reporting period belongs to company
    const period = await queryOne(
      'SELECT id FROM reporting_periods WHERE id = $1 AND company_id = $2',
      [periodId, companyId]
    );

    if (!period) {
      return res.status(404).json({ error: 'Reporting period not found' });
    }

    const questions = await queryOne(
      'SELECT * FROM boundary_questions WHERE reporting_period_id = $1',
      [periodId]
    );

    if (!questions) {
      return res.status(404).json({ error: 'Boundary questions not found' });
    }

    // Convert back to API format (remove 'has_' prefix)
    const apiFormat = normalizeDbFieldsForResponse(questions);

    res.json({ boundaryQuestions: apiFormat });
  } catch (error) {
    next(error);
  }
}

/**
 * Get boundary questions summary (which scopes are enabled)
 * GET /api/reporting-periods/:periodId/boundary-summary
 */
export async function getBoundarySummary(req, res, next) {
  try {
    const { periodId } = req.params;
    const companyId = req.params.companyId;

    const questions = await queryOne(
      'SELECT * FROM boundary_questions WHERE reporting_period_id = $1',
      [periodId]
    );

    if (!questions) {
      return res.status(404).json({ error: 'Boundary questions not found' });
    }

    // Build summary of enabled modules
    const scopeSummary = {
      scope1: {
        enabled:
          questions.has_stationary_combustion ||
          questions.has_mobile_sources ||
          questions.has_refrigeration_ac ||
          questions.has_fire_suppression ||
          questions.has_purchased_gases,
        modules: {
          stationary_combustion: questions.has_stationary_combustion,
          mobile_sources: questions.has_mobile_sources,
          refrigeration_ac: questions.has_refrigeration_ac,
          fire_suppression: questions.has_fire_suppression,
          purchased_gases: questions.has_purchased_gases,
        },
      },
      scope2: {
        enabled: questions.has_electricity || questions.has_steam,
        modules: {
          electricity: questions.has_electricity,
          steam: questions.has_steam,
          market_based_factors: questions.has_market_based_factors,
        },
      },
      scope3: {
        enabled:
          questions.has_business_travel ||
          questions.has_commuting ||
          questions.has_transportation_distribution ||
          questions.has_waste,
        modules: {
          business_travel: questions.has_business_travel,
          commuting: questions.has_commuting,
          transportation_distribution: questions.has_transportation_distribution,
          waste: questions.has_waste,
        },
      },
      offsets: questions.has_offsets,
    };

    res.json({
      reportingPeriodId: periodId,
      summary: scopeSummary,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get enabled activity types based on boundary answers
 * GET /api/companies/:companyId/enabled-activity-types
 */
export async function getEnabledActivityTypes(req, res, next) {
  try {
    const companyId = req.params.companyId || req.user.company_id;

    const period = await queryOne(
      `SELECT id FROM reporting_periods 
       WHERE company_id = $1 
       ORDER BY created_at DESC LIMIT 1`,
      [companyId]
    );

    if (!period) {
      // No period yet, return all activity types (for initial setup)
      return res.json({ enabledActivityTypes: [] });
    }

    const questions = await queryOne(
      'SELECT * FROM boundary_questions WHERE reporting_period_id = $1',
      [period.id]
    );

    if (!questions) {
      return res.json({ enabledActivityTypes: [] });
    }

    // Map boundary questions to activity types
    const activityTypeMapping = {
      // Scope 1
      stationary_combustion: questions.has_stationary_combustion,
      mobile_sources: questions.has_mobile_sources,
      refrigeration_ac_material_balance: questions.has_refrigeration_ac,
      refrigeration_ac_simplified_material_balance: questions.has_refrigeration_ac,
      refrigeration_ac_screening_method: questions.has_refrigeration_ac,
      fire_suppression_material_balance: questions.has_fire_suppression,
      fire_suppression_simplified_material_balance: questions.has_fire_suppression,
      fire_suppression_screening_method: questions.has_fire_suppression,
      purchased_gases: questions.has_purchased_gases,
      
      // Scope 2
      electricity: questions.has_electricity,
      steam: questions.has_steam,
      
      // Scope 3
      business_travel_personal_car: questions.has_business_travel,
      business_travel_rail_bus: questions.has_business_travel,
      business_travel_air: questions.has_business_travel,
      employee_commuting_personal_car: questions.has_commuting,
      employee_commuting_public_transport: questions.has_commuting,
      upstream_trans_dist_vehicle_miles: questions.has_transportation_distribution,
      upstream_trans_dist_ton_miles: questions.has_transportation_distribution,
      waste: questions.has_waste,
      
      // Offsets
      offsets: questions.has_offsets,
    };

    // Filter to only enabled types
    const enabledTypes = Object.entries(activityTypeMapping)
      .filter(([_, enabled]) => enabled)
      .map(([type, _]) => type);

    res.json({ 
      enabledActivityTypes: enabledTypes,
      periodId: period.id
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all boundary questions for onboarding wizard
 * GET /api/boundaries/questions
 */
export async function getAllBoundaryQuestions(req, res, next) {
  try {
    const questions = await queryAll(
      `SELECT id, category, question_text, scope, question_order
       FROM reference_boundary_questions
       ORDER BY question_order ASC`
    );

    res.json({
      success: true,
      questions: questions
    });
  } catch (error) {
    console.error('Error fetching boundary questions:', error);
    next(error);
  }
}

/**
 * Submit user's boundary question answers
 * POST /api/boundaries/answers
 */
export async function submitBoundaryAnswers(req, res, next) {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { companyId, answers } = req.body; // companyId might be needed if user has multiple companies, usually user.companyId

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'Answers must be an array'
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Insert/update each answer in the AUDIT/Normalized table
      // We need to fetch the category map to update the denormalized table later
      const questionMap = {};
      const questionsResult = await client.query('SELECT id, category FROM reference_boundary_questions');
      questionsResult.rows.forEach(q => {
        questionMap[q.id] = q.category;
      });

      const denormalizedUpdates = {};

      for (const answer of answers) {
        const { boundary_question_id, answer: answerValue } = answer;

        if (boundary_question_id === undefined || answerValue === undefined) {
          return res.status(400).json({ error: 'Invalid answer format: missing boundary_question_id or answer' });
        }

        // Upsert (insert or update)
        await client.query(
          `INSERT INTO boundary_answers 
           (user_id, company_id, boundary_question_id, answer, answered_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (user_id, boundary_question_id) 
           DO UPDATE SET answer = $4, updated_at = NOW()`,
          [userId, companyId, boundary_question_id, answerValue]
        );

        // Map to denormalized category
        const category = questionMap[boundary_question_id];
        if (category) {
            denormalizedUpdates[category] = answerValue;
        }
      }

      // 2. Update the denormalized 'boundary_questions' table for the current Reporting Period
      // Use provided periodId or find the active/latest reporting period for this company
      let periodId = req.body.periodId;
      
      if (!periodId) {
        const periodResult = await client.query(
          `SELECT id, status FROM reporting_periods 
           WHERE company_id = $1 
           ORDER BY created_at DESC LIMIT 1`,
          [companyId]
        );
        periodId = periodResult.rows[0]?.id;
      }
      
      if (periodId) {
          // Check if boundary_questions record exists
          const existingBQ = await client.query(
            'SELECT id FROM boundary_questions WHERE reporting_period_id = $1',
            [periodId]
          );

          if (existingBQ.rows.length === 0) {
            // Create new boundary_questions record
            await client.query(
              `INSERT INTO boundary_questions (
                reporting_period_id,
                has_stationary_combustion, has_mobile_sources, has_refrigeration_ac,
                has_fire_suppression, has_purchased_gases, has_electricity, has_steam,
                has_market_based_factors, has_business_travel, has_commuting,
                has_transportation_distribution, has_waste, has_offsets
              ) VALUES ($1, false, false, false, false, false, false, false, false, false, false, false, false, false)`,
              [periodId]
            );
          }

          // Construct dynamic update query
          const updateParts = [];
          const updateValues = [];
          let pIdx = 1;

          const marketBasedCol = 'has_market_based_factors';
          let marketBasedSet = false;

          for (const [cat, val] of Object.entries(denormalizedUpdates)) {
              // Map category to column name
              let colName;
              if (cat === 'market_based') {
                  colName = marketBasedCol;
                  marketBasedSet = true;
              } else {
                  colName = `has_${cat}`;
              }
              
              updateParts.push(`${colName} = $${pIdx}`);
              updateValues.push(val);
              pIdx++;
          }
           
          // Also set market based if electricity is present (default logic), but only if not already set by explicit answer
          if(denormalizedUpdates['electricity'] && !marketBasedSet) {
             updateParts.push(`${marketBasedCol} = $${pIdx}`);
             updateValues.push(true);
             pIdx++;
          }

          if (updateParts.length > 0) {
              updateValues.push(periodId);
              await client.query(
                  `UPDATE boundary_questions 
                   SET ${updateParts.join(', ')}, updated_at = NOW()
                   WHERE reporting_period_id = $${pIdx}`,
                  updateValues
              );
          }
      }

      // 3. Update onboarding status
      await client.query(
        `INSERT INTO onboarding_status 
         (user_id, company_id, wizard_completed, completed_at)
         VALUES ($1, $2, true, NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET wizard_completed = true, completed_at = NOW(), updated_at = NOW()`,
        [userId, companyId]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Boundary answers saved successfully'
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error submitting boundary answers:', error);
    next(error);
  }
}

/**
 * Get user's boundary answers
 * GET /api/boundaries/answers/:userId
 */
export async function getUserBoundaryAnswers(req, res, next) {
  try {
    const userId = req.params.userId || req.user?.userId || req.user?.id;

    const answers = await queryAll(
      `SELECT ba.boundary_question_id, ba.answer, bq.question_text, bq.scope, bq.category
       FROM boundary_answers ba
       JOIN reference_boundary_questions bq ON ba.boundary_question_id = bq.id
       WHERE ba.user_id = $1
       ORDER BY bq.question_order ASC`,
      [userId]
    );

    res.json({
      success: true,
      answers: answers
    });
  } catch (error) {
    console.error('Error fetching user boundary answers:', error);
    next(error);
  }
}

/**
 * Check onboarding completion status
 * GET /api/boundaries/onboarding-status
 */
export async function checkOnboardingStatus(req, res, next) {
  try {
    const userId = req.user?.userId || req.user?.id;
    console.log('[Boundary] checkOnboardingStatus called for userId:', userId);

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const status = await queryOne(
      `SELECT wizard_completed, completed_at, dashboard_configured, 
              first_activity_added, first_report_generated
       FROM onboarding_status
       WHERE user_id = $1`,
      [userId]
    ) || {
      wizard_completed: false,
      completed_at: null,
      dashboard_configured: false,
      first_activity_added: false,
      first_report_generated: false
    };

    console.log('[Boundary] Onboarding status found:', status);

    res.json({
      success: true,
      wizard_completed: status.wizard_completed || false,
      completed_at: status.completed_at || null,
      dashboard_configured: status.dashboard_configured || false,
      first_activity_added: status.first_activity_added || false,
      first_report_generated: status.first_report_generated || false
    });
  } catch (error) {
    console.error('[Boundary] Error checking onboarding status:', error);
    // Return incomplete status on error (ensures redirect to setup)
    res.json({
      success: false,
      wizard_completed: false,
      completed_at: null,
      dashboard_configured: false,
      first_activity_added: false,
      first_report_generated: false
    });
  }
}
