-- ========================================================================
-- MIGRATION: Complete Schema Sync (Idempotent)
-- Date: 2026-02-03
-- Description: Syncs database schema with activityController.js expectations
-- ========================================================================

-- 1. Update activity_category_type ENUM
-- Note: ADD VALUE IF NOT EXISTS is supported in PostgreSQL 12.1+
-- We run these individually as they cannot be in a transaction block
ALTER TYPE activity_category_type ADD VALUE IF NOT EXISTS 'refrigeration_ac_material_balance';
ALTER TYPE activity_category_type ADD VALUE IF NOT EXISTS 'refrigeration_ac_simplified_material_balance';
ALTER TYPE activity_category_type ADD VALUE IF NOT EXISTS 'refrigeration_ac_screening_method';
ALTER TYPE activity_category_type ADD VALUE IF NOT EXISTS 'fire_suppression_material_balance';
ALTER TYPE activity_category_type ADD VALUE IF NOT EXISTS 'fire_suppression_simplified_material_balance';
ALTER TYPE activity_category_type ADD VALUE IF NOT EXISTS 'fire_suppression_screening_method';
ALTER TYPE activity_category_type ADD VALUE IF NOT EXISTS 'business_travel_personal_car';
ALTER TYPE activity_category_type ADD VALUE IF NOT EXISTS 'business_travel_rail_bus';
ALTER TYPE activity_category_type ADD VALUE IF NOT EXISTS 'employee_commuting_personal_car';
ALTER TYPE activity_category_type ADD VALUE IF NOT EXISTS 'employee_commuting_public_transport';
ALTER TYPE activity_category_type ADD VALUE IF NOT EXISTS 'upstream_trans_dist_vehicle_miles';
ALTER TYPE activity_category_type ADD VALUE IF NOT EXISTS 'upstream_trans_dist_ton_miles';

-- 2. Create Unified Table: business_travel_activities
CREATE TABLE IF NOT EXISTS business_travel_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    source_id VARCHAR(100),
    source_description VARCHAR(255),
    travel_mode VARCHAR(50), 
    vehicle_type VARCHAR(100),
    miles_traveled NUMERIC(15,4),
    distance_km NUMERIC(15,4),
    units VARCHAR(20) DEFAULT 'miles',
    calculation_method VARCHAR(50),
    entered_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Create Unified Table: employee_commuting_activities
CREATE TABLE IF NOT EXISTS employee_commuting_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    source_id VARCHAR(100),
    source_description VARCHAR(255),
    vehicle_type VARCHAR(100),
    miles_traveled NUMERIC(15,4),
    distance_per_trip_km NUMERIC(15,4),
    commute_days_per_year INTEGER,
    num_commuters INTEGER DEFAULT 1,
    calculation_method VARCHAR(50),
    entered_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Ensure commuting_activities exists or is an alias (for legacy compat)
CREATE TABLE IF NOT EXISTS commuting_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    commute_mode VARCHAR(100),
    distance_per_trip_km NUMERIC(15,4),
    num_commuters INTEGER DEFAULT 1,
    entered_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. Update electricity_activities
ALTER TABLE electricity_activities 
ADD COLUMN IF NOT EXISTS source_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS source_description VARCHAR(255),
ADD COLUMN IF NOT EXISTS source_area_sqft NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS market_based_co2_factor NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS market_based_ch4_factor NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS market_based_n2o_factor NUMERIC(12,6);

-- 5. Update steam_activities
ALTER TABLE steam_activities
ADD COLUMN IF NOT EXISTS source_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS source_description VARCHAR(255),
ADD COLUMN IF NOT EXISTS source_area_sqft NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS boiler_efficiency NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS location_based_co2_factor NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS location_based_ch4_factor NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS location_based_n2o_factor NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS market_based_co2_factor NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS market_based_ch4_factor NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS market_based_n2o_factor NUMERIC(12,6);

-- 6. Update refrigeration_ac_activities
ALTER TABLE refrigeration_ac_activities
ADD COLUMN IF NOT EXISTS gwp NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS calculation_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS inventory_change NUMERIC(15,4),
ADD COLUMN IF NOT EXISTS transferred_amount NUMERIC(15,4),
ADD COLUMN IF NOT EXISTS capacity_change NUMERIC(15,4),
ADD COLUMN IF NOT EXISTS new_units_charge NUMERIC(15,4),
ADD COLUMN IF NOT EXISTS new_units_capacity NUMERIC(15,4),
ADD COLUMN IF NOT EXISTS existing_units_recharge NUMERIC(15,4),
ADD COLUMN IF NOT EXISTS disposed_units_capacity NUMERIC(15,4),
ADD COLUMN IF NOT EXISTS disposed_units_recovered NUMERIC(15,4),
ADD COLUMN IF NOT EXISTS operating_units_capacity NUMERIC(15,4),
ADD COLUMN IF NOT EXISTS equipment_type VARCHAR(100);

-- 7. Update fire_suppression_activities
ALTER TABLE fire_suppression_activities
ADD COLUMN IF NOT EXISTS gwp NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS calculation_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS inventory_change_lb NUMERIC(15,4),
ADD COLUMN IF NOT EXISTS transferred_amount_lb NUMERIC(15,4),
ADD COLUMN IF NOT EXISTS capacity_change_lb NUMERIC(15,4),
ADD COLUMN IF NOT EXISTS new_units_charge_lb NUMERIC(15,4),
ADD COLUMN IF NOT EXISTS new_units_capacity_lb NUMERIC(15,4),
ADD COLUMN IF NOT EXISTS existing_units_recharge_lb NUMERIC(15,4),
ADD COLUMN IF NOT EXISTS disposed_units_capacity_lb NUMERIC(15,4),
ADD COLUMN IF NOT EXISTS disposed_units_recovered_lb NUMERIC(15,4),
ADD COLUMN IF NOT EXISTS unit_capacity_lb NUMERIC(15,4);

-- 8. Update transportation_distribution_activities
ALTER TABLE transportation_distribution_activities
ADD COLUMN IF NOT EXISTS calculation_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS vehicle_miles NUMERIC(15,4),
ADD COLUMN IF NOT EXISTS short_ton_miles NUMERIC(15,4),
ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(100);

-- 9. Create waste_activities if missing
CREATE TABLE IF NOT EXISTS waste_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    waste_type VARCHAR(100) NOT NULL,
    disposal_method VARCHAR(100) NOT NULL,
    amount NUMERIC(15,4) NOT NULL,
    units VARCHAR(20),
    entered_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 10. Create offsets_activities if missing
CREATE TABLE IF NOT EXISTS offsets_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    offset_type VARCHAR(100),
    amount_mtco2e NUMERIC(15,4) NOT NULL,
    certification_standard VARCHAR(100),
    entered_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 11. Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_bt_activities_period ON business_travel_activities(reporting_period_id);
CREATE INDEX IF NOT EXISTS idx_ec_activities_period ON employee_commuting_activities(reporting_period_id);
CREATE INDEX IF NOT EXISTS idx_waste_activities_period ON waste_activities(reporting_period_id);
CREATE INDEX IF NOT EXISTS idx_offsets_activities_period ON offsets_activities(reporting_period_id);

-- ========================================================================
-- MIGRATION COMPLETE
-- ========================================================================
