-- ========================================================================
-- MIGRATION: 10_create_company_boundary_answers.sql
-- Creates the company_boundary_answers table for organizational boundary answers
-- ========================================================================

CREATE TABLE IF NOT EXISTS company_boundary_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES reference_boundary_questions(id) ON DELETE CASCADE,
    answer_boolean BOOLEAN NOT NULL,
    notes TEXT,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(company_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_company_boundary_answers_company_id ON company_boundary_answers(company_id);
CREATE INDEX IF NOT EXISTS idx_company_boundary_answers_question_id ON company_boundary_answers(question_id);

COMMENT ON TABLE company_boundary_answers IS 'Stores company-level answers to boundary questions (Yes/No)';
