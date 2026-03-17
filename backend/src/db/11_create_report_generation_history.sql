-- 11_create_report_generation_history.sql
-- Migration to create the report_generation_history table for report tracking

CREATE TABLE IF NOT EXISTS report_generation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    generated_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    report_type VARCHAR(50) NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes INTEGER,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    download_count INTEGER DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'unpaid',
    certification_status VARCHAR(20) DEFAULT 'pending',
    recommendations TEXT,
    audit_trail JSONB,
    certification JSONB
);

CREATE INDEX IF NOT EXISTS idx_report_generation_history_reporting_period_id ON report_generation_history(reporting_period_id);
CREATE INDEX IF NOT EXISTS idx_report_generation_history_generated_by ON report_generation_history(generated_by);
