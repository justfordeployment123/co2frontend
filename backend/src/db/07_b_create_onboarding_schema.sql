-- ========================================================================
-- MIGRATION: 07_b_create_onboarding_schema.sql
-- Create tables for storing boundary answers and user onboarding status
-- ========================================================================

CREATE TABLE IF NOT EXISTS boundary_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    boundary_question_id UUID NOT NULL REFERENCES reference_boundary_questions(id) ON DELETE CASCADE,
    answer BOOLEAN NOT NULL,
    answered_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    UNIQUE(user_id, boundary_question_id)
);

CREATE INDEX IF NOT EXISTS idx_boundary_answers_user_id ON boundary_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_boundary_answers_company_id ON boundary_answers(company_id);

COMMENT ON TABLE boundary_answers IS 'Stores user answers to boundary questions (Yes/No)';

-- ========================================================================

CREATE TABLE IF NOT EXISTS onboarding_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    wizard_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    dashboard_configured BOOLEAN DEFAULT false,
    first_activity_added BOOLEAN DEFAULT false,
    first_report_generated BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_status_user_id ON onboarding_status(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_status_company_id ON onboarding_status(company_id);

COMMENT ON TABLE onboarding_status IS 'Tracks user onboarding progress';
