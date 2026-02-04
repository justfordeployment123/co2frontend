-- ========================================================================
-- MIGRATION: 07_a_create_reference_boundary_questions.sql
-- Create reference table for boundary questions and seed data
-- ========================================================================

CREATE TABLE IF NOT EXISTS reference_boundary_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL, -- 'stationary_combustion', 'mobile_sources', etc.
    question_text TEXT NOT NULL,
    scope VARCHAR(20) NOT NULL, -- 'SCOPE_1', 'SCOPE_2', 'SCOPE_3', 'OPTIONAL'
    is_required BOOLEAN DEFAULT true, -- false for scope 3 questions
    question_order INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed Data based on Excel "Boundary Questions" sheet (Exact 13 questions)
INSERT INTO reference_boundary_questions (category, question_text, scope, is_required, question_order) VALUES
-- Scope 1 & 2 (Required if Yes)
('stationary_combustion', 'Do you have facilities that burn fuels on-site (e.g., natural gas, propane, coal, fuel oil for heating, diesel fuel for backup generators, biomass fuels)?', 'SCOPE_1', true, 1),
('mobile_sources', 'Do any vehicles fall within your organizational boundary? This can include cars, trucks, propane forklifts, aircraft, boats. Only vehicles owned or leased by your organization should be included here.', 'SCOPE_1', true, 2),
('refrigeration_ac', 'Do your facilities use refrigeration or air conditioning equipment?', 'SCOPE_1', true, 3),
('fire_suppression', 'Do your facilities use chemical fire suppressants?', 'SCOPE_1', true, 4),
('purchased_gases', 'Do you purchase any industrial gases for use in your business? These gases may be purchased for use in manufacturing, testing, or laboratories.', 'SCOPE_1', true, 5),
('electricity', 'Does your inventory include facilities that use electricity?', 'SCOPE_2', true, 6),
('steam', 'Do you purchase steam for heating or cooling in your facilities?', 'SCOPE_2', true, 7),
('market_based', 'Do you purchase renewable energy certificates (RECs) or green power products? Do you purchase electricity through a power purchase agreement (PPA)? Do you have supplier-specific emission factors?', 'OPTIONAL', false, 8),
-- Scope 3 (Optional if Yes)
('business_travel', 'Do your employees travel for business using transportation other than owned or leased vehicles (e.g., commercial airline flights, rental cars, trains)?', 'SCOPE_3', false, 9),
('commuting', 'Do your employees commute to work in personal vehicles or use public transportation?', 'SCOPE_3', false, 10),
('transportation_distribution', 'Do you hire another company to transport products or other materials to or from your facilities?', 'SCOPE_3', false, 11),
('waste', 'Do you generate waste that is disposed of in a facility owned by another organization?', 'SCOPE_3', false, 12),
('offsets', 'Do you purchase greenhouse gas offsets?', 'OPTIONAL', false, 13);
