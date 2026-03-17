-- Add missing columns to approval_workflows
ALTER TABLE approval_workflows ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE approval_workflows ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE approval_workflows ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES users(id);
ALTER TABLE approval_workflows ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;
