-- 13_add_reporting_period_id_to_payments.sql
-- Migration to add reporting_period_id to payments table for report history queries

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS reporting_period_id UUID REFERENCES reporting_periods(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payments_reporting_period_id ON payments(reporting_period_id);
