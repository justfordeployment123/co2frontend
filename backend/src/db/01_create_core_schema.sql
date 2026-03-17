-- ========================================================================
-- AURIXON DATABASE SCHEMA
-- Project: European ESG/Carbon Footprint Calculator SaaS
-- Date: 2026-01-19
-- ========================================================================

-- ========================================================================
-- EXTENSIONS
-- ========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================================
-- ENUMS / CUSTOM TYPES
-- ========================================================================

CREATE TYPE user_role_type AS ENUM ('company_admin', 'editor', 'viewer', 'internal_admin');
CREATE TYPE reporting_standard_type AS ENUM ('CSRD', 'GHG_PROTOCOL', 'ISO_14064');
CREATE TYPE emission_scope_type AS ENUM ('SCOPE_1', 'SCOPE_2', 'SCOPE_3');

-- UPDATED: Split business_travel into 4 specific types
CREATE TYPE activity_category_type AS ENUM (
    'stationary_combustion',
    'mobile_sources',
    'refrigeration_ac',
    'fire_suppression',
    'purchased_gases',
    'electricity',
    'steam',
    'business_travel_air',
    'business_travel_rail',
    'business_travel_road',
    'business_travel_hotel',
    'commuting',
    'transportation_distribution',
    'waste',
    'offsets'
);

CREATE TYPE ghg_type AS ENUM ('CO2', 'CH4', 'N2O', 'SF6', 'HFC', 'PFC', 'NF3');
CREATE TYPE payment_status_type AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
CREATE TYPE report_status_type AS ENUM ('draft', 'generated', 'submitted', 'archived');
CREATE TYPE traffic_light_type AS ENUM ('green', 'yellow', 'red');
CREATE TYPE calculation_status_type AS ENUM ('draft', 'complete', 'recalculating');

-- ========================================================================
-- 1. AUTHENTICATION & USERS
-- ========================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    language_preference CHAR(2) DEFAULT 'EN',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

COMMENT ON TABLE users IS 'User accounts for authentication and profile management';

-- ========================================================================
-- 2. COMPANIES (Multi-Tenant)
-- ========================================================================

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    country_code CHAR(2) NOT NULL,
    industry VARCHAR(100),
    reporting_period_start DATE,
    reporting_period_end DATE,
    billing_email VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    subscription_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_companies_country_code ON companies(country_code);
CREATE INDEX idx_companies_stripe_customer_id ON companies(stripe_customer_id);

COMMENT ON TABLE companies IS 'SME tenant accounts (multi-tenant isolation)';

-- ========================================================================
-- 3. USER ↔ COMPANY ROLES (RBAC)
-- ========================================================================

CREATE TABLE user_company_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role user_role_type NOT NULL,
    invited_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

CREATE INDEX idx_user_company_roles_user_id ON user_company_roles(user_id);
CREATE INDEX idx_user_company_roles_company_id ON user_company_roles(company_id);

COMMENT ON TABLE user_company_roles IS 'Maps users to companies with role-based access control';

-- ========================================================================
-- 4. REPORTING PERIODS
-- ========================================================================

CREATE TABLE reporting_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    period_label VARCHAR(100),
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    period_type VARCHAR(20),
    reporting_standard reporting_standard_type NOT NULL DEFAULT 'CSRD',
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, period_start_date, period_end_date)
);

CREATE INDEX idx_reporting_periods_company_id ON reporting_periods(company_id);
CREATE INDEX idx_reporting_periods_status ON reporting_periods(status);

COMMENT ON TABLE reporting_periods IS 'Reporting periods per company (annual, fiscal year, or custom)';

-- ========================================================================
-- 5. BOUNDARY QUESTIONS (Scope Determination)
-- ========================================================================

CREATE TABLE boundary_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporting_period_id UUID NOT NULL UNIQUE REFERENCES reporting_periods(id) ON DELETE CASCADE,
    has_stationary_combustion BOOLEAN DEFAULT false,
    has_mobile_sources BOOLEAN DEFAULT false,
    has_refrigeration_ac BOOLEAN DEFAULT false,
    has_fire_suppression BOOLEAN DEFAULT false,
    has_purchased_gases BOOLEAN DEFAULT false,
    has_electricity BOOLEAN DEFAULT false,
    has_steam BOOLEAN DEFAULT false,
    has_market_based_factors BOOLEAN DEFAULT false,
    has_business_travel BOOLEAN DEFAULT false,
    has_commuting BOOLEAN DEFAULT false,
    has_transportation_distribution BOOLEAN DEFAULT false,
    has_waste BOOLEAN DEFAULT false,
    has_offsets BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_boundary_questions_reporting_period_id ON boundary_questions(reporting_period_id);

COMMENT ON TABLE boundary_questions IS 'Yes/No answers that determine which emission sources are active';

-- ========================================================================
-- 6. REFERENCE TABLES (Dropdown Data)
-- ========================================================================

CREATE TABLE fuel_types_reference (
    id SERIAL PRIMARY KEY,
    fuel_name VARCHAR(100) UNIQUE NOT NULL,
    fuel_state VARCHAR(20) NOT NULL,
    applicable_to VARCHAR(50)[],
    valid_units VARCHAR(20)[],
    display_order INTEGER
);

CREATE TABLE vehicle_types_reference (
    id SERIAL PRIMARY KEY,
    vehicle_type VARCHAR(100) UNIQUE NOT NULL,
    on_road_or_non_road VARCHAR(20),
    display_order INTEGER
);

CREATE TABLE refrigerant_types_reference (
    id SERIAL PRIMARY KEY,
    refrigerant_name VARCHAR(100) UNIQUE NOT NULL,
    gwp_value DECIMAL(10,2),
    chemical_formula VARCHAR(50)
);

CREATE TABLE waste_types_reference (
    id SERIAL PRIMARY KEY,
    waste_type VARCHAR(100) UNIQUE NOT NULL,
    waste_category VARCHAR(100),
    display_order INTEGER
);

CREATE TABLE disposal_methods_reference (
    id SERIAL PRIMARY KEY,
    disposal_method VARCHAR(100) UNIQUE NOT NULL,
    applicable_waste_types VARCHAR(100)[],
    display_order INTEGER
);

COMMENT ON TABLE fuel_types_reference IS 'Dropdown options for fuel types';
COMMENT ON TABLE vehicle_types_reference IS 'Dropdown options for vehicle types';
COMMENT ON TABLE refrigerant_types_reference IS 'Dropdown options for refrigerants/AC fluids';
COMMENT ON TABLE waste_types_reference IS 'Dropdown options for waste types';
COMMENT ON TABLE disposal_methods_reference IS 'Dropdown options for disposal methods';

-- ========================================================================
-- 7. ACTIVITY ENTRIES (User Input Layer)
-- ========================================================================

CREATE TABLE stationary_combustion_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    source_id VARCHAR(100),
    source_description VARCHAR(255),
    source_area_sqft DECIMAL(12,2),
    fuel_combusted VARCHAR(100) NOT NULL,
    fuel_state VARCHAR(20),
    quantity_combusted DECIMAL(18,4) NOT NULL,
    units VARCHAR(20) NOT NULL,
    entered_by UUID REFERENCES users(id),
    data_source VARCHAR(20) DEFAULT 'MANUAL',
    external_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT check_quantity_non_negative CHECK (quantity_combusted >= 0)
);

CREATE INDEX idx_stationary_combustion_company_id ON stationary_combustion_activities(company_id);
CREATE INDEX idx_stationary_combustion_reporting_period_id ON stationary_combustion_activities(reporting_period_id);

COMMENT ON TABLE stationary_combustion_activities IS 'Scope 1: On-site fuel combustion';

-- ========================================================================

CREATE TABLE mobile_sources_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    source_id VARCHAR(100),
    source_description VARCHAR(255),
    on_road_or_non_road VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(100) NOT NULL,
    vehicle_year INTEGER,
    calculation_method VARCHAR(20) NOT NULL CHECK (calculation_method IN ('FUEL_BASED', 'DISTANCE_BASED')),
    fuel_type VARCHAR(100), -- Explicit fuel type (e.g. Motor Gasoline) derived from vehicle type
    fuel_usage DECIMAL(18,4),
    units VARCHAR(20),
    miles_traveled DECIMAL(18,4),
    entered_by UUID REFERENCES users(id),
    data_source VARCHAR(20) DEFAULT 'MANUAL',
    external_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT check_fuel_non_negative CHECK (fuel_usage >= 0 OR fuel_usage IS NULL),
    CONSTRAINT check_miles_non_negative CHECK (miles_traveled >= 0 OR miles_traveled IS NULL)
);

CREATE INDEX idx_mobile_sources_company_id ON mobile_sources_activities(company_id);

COMMENT ON TABLE mobile_sources_activities IS 'Scope 1: Company vehicles (FUEL_BASED or DISTANCE_BASED calculation)';

-- ========================================================================

CREATE TABLE refrigeration_ac_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    equipment_description VARCHAR(255),
    refrigerant_type VARCHAR(100) NOT NULL,
    amount_released DECIMAL(18,4) NOT NULL,
    amount_units VARCHAR(20),
    entered_by UUID REFERENCES users(id),
    data_source VARCHAR(20) DEFAULT 'MANUAL',
    external_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT check_amount_non_negative CHECK (amount_released >= 0)
);

CREATE INDEX idx_refrigeration_ac_company_id ON refrigeration_ac_activities(company_id);

COMMENT ON TABLE refrigeration_ac_activities IS 'Scope 1: Refrigerant leakage';

-- ========================================================================

CREATE TABLE fire_suppression_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    facility_description VARCHAR(255),
    equipment_type VARCHAR(50),
    suppressant_type VARCHAR(100) NOT NULL,
    amount_used DECIMAL(18,4) NOT NULL,
    amount_units VARCHAR(20),
    entered_by UUID REFERENCES users(id),
    data_source VARCHAR(20) DEFAULT 'MANUAL',
    external_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT check_amount_non_negative CHECK (amount_used >= 0)
);

CREATE INDEX idx_fire_suppression_company_id ON fire_suppression_activities(company_id);

COMMENT ON TABLE fire_suppression_activities IS 'Scope 1: Fire suppression agent usage';

-- ========================================================================

CREATE TABLE purchased_gases_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    gas_type VARCHAR(100) NOT NULL,
    amount_purchased DECIMAL(18,4) NOT NULL,
    amount_units VARCHAR(20),
    purpose VARCHAR(255),
    entered_by UUID REFERENCES users(id),
    data_source VARCHAR(20) DEFAULT 'MANUAL',
    external_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT check_amount_non_negative CHECK (amount_purchased >= 0)
);

CREATE INDEX idx_purchased_gases_company_id ON purchased_gases_activities(company_id);

COMMENT ON TABLE purchased_gases_activities IS 'Scope 1: Industrial gases';

-- ========================================================================

CREATE TABLE electricity_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    facility_name VARCHAR(255),
    facility_location VARCHAR(100),
    kwh_purchased DECIMAL(18,4) NOT NULL,
    calculation_method VARCHAR(20) NOT NULL CHECK (calculation_method IN ('LOCATION_BASED', 'MARKET_BASED')),
    supplier_emission_factor DECIMAL(10,6),
    entered_by UUID REFERENCES users(id),
    data_source VARCHAR(20) DEFAULT 'MANUAL',
    external_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT check_kwh_non_negative CHECK (kwh_purchased >= 0)
);

CREATE INDEX idx_electricity_company_id ON electricity_activities(company_id);
CREATE INDEX idx_electricity_calculation_method ON electricity_activities(calculation_method);

COMMENT ON TABLE electricity_activities IS 'Scope 2: Electricity (location-based or market-based)';

-- ========================================================================

CREATE TABLE steam_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    facility_name VARCHAR(255),
    facility_location VARCHAR(100),
    amount_purchased DECIMAL(18,4) NOT NULL,
    amount_units VARCHAR(20),
    supplier_name VARCHAR(255),
    supplier_emission_factor DECIMAL(10,6),
    entered_by UUID REFERENCES users(id),
    data_source VARCHAR(20) DEFAULT 'MANUAL',
    external_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT check_amount_non_negative CHECK (amount_purchased >= 0)
);

CREATE INDEX idx_steam_company_id ON steam_activities(company_id);

COMMENT ON TABLE steam_activities IS 'Scope 2: Purchased steam/heat';

-- ========================================================================
-- Business Travel
-- ========================================================================

CREATE TABLE business_travel_air (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    trip_id VARCHAR(100),
    departure_city VARCHAR(100),
    arrival_city VARCHAR(100),
    flight_type VARCHAR(50) NOT NULL,
    cabin_class VARCHAR(50) NOT NULL,
    distance_km DECIMAL(18,4) NOT NULL,
    num_flights INTEGER DEFAULT 1,
    travel_purpose TEXT,
    entered_by UUID REFERENCES users(id),
    data_source VARCHAR(20) DEFAULT 'MANUAL',
    external_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT check_distance_non_negative CHECK (distance_km >= 0)
);

CREATE INDEX idx_business_travel_air_company_id ON business_travel_air(company_id);

COMMENT ON TABLE business_travel_air IS 'Scope 3: Air travel (cabin class affects per-seat allocation)';

-- ========================================================================

CREATE TABLE business_travel_rail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    trip_id VARCHAR(100),
    route VARCHAR(100),
    rail_type VARCHAR(50) NOT NULL,
    distance_km DECIMAL(18,4) NOT NULL,
    num_trips INTEGER DEFAULT 1,
    travel_purpose TEXT,
    entered_by UUID REFERENCES users(id),
    data_source VARCHAR(20) DEFAULT 'MANUAL',
    external_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT check_distance_non_negative CHECK (distance_km >= 0)
);

CREATE INDEX idx_business_travel_rail_company_id ON business_travel_rail(company_id);

COMMENT ON TABLE business_travel_rail IS 'Scope 3: Rail travel';

-- ========================================================================

CREATE TABLE business_travel_road (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    trip_id VARCHAR(100),
    transport_type VARCHAR(50) NOT NULL,
    vehicle_size VARCHAR(50) NOT NULL,
    fuel_type VARCHAR(50),
    distance_km DECIMAL(18,4) NOT NULL,
    num_trips INTEGER DEFAULT 1,
    route_purpose TEXT,
    entered_by UUID REFERENCES users(id),
    data_source VARCHAR(20) DEFAULT 'MANUAL',
    external_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT check_distance_non_negative CHECK (distance_km >= 0)
);

CREATE INDEX idx_business_travel_road_company_id ON business_travel_road(company_id);

COMMENT ON TABLE business_travel_road IS 'Scope 3: Road travel (rental cars, taxis)';

-- ========================================================================

CREATE TABLE business_travel_hotel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    hotel_name VARCHAR(255),
    city_country VARCHAR(100),
    hotel_category VARCHAR(50),
    num_nights INTEGER NOT NULL,
    num_rooms INTEGER DEFAULT 1,
    trip_purpose TEXT,
    entered_by UUID REFERENCES users(id),
    data_source VARCHAR(20) DEFAULT 'MANUAL',
    external_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT check_nights_positive CHECK (num_nights > 0)
);

CREATE INDEX idx_business_travel_hotel_company_id ON business_travel_hotel(company_id);

COMMENT ON TABLE business_travel_hotel IS 'Scope 3: Hotel accommodation';

-- ========================================================================

CREATE TABLE commuting_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    commute_mode VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(100),
    distance_per_trip_km DECIMAL(18,4),
    commute_days_per_year INTEGER,
    num_commuters INTEGER DEFAULT 1,
    entered_by UUID REFERENCES users(id),
    data_source VARCHAR(20) DEFAULT 'MANUAL',
    external_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT check_distance_non_negative CHECK (distance_per_trip_km >= 0 OR distance_per_trip_km IS NULL),
    CONSTRAINT check_commuters_positive CHECK (num_commuters > 0)
);

CREATE INDEX idx_commuting_company_id ON commuting_activities(company_id);

COMMENT ON TABLE commuting_activities IS 'Scope 3: Employee commuting';

-- ========================================================================

CREATE TABLE transportation_distribution_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    shipment_description VARCHAR(255),
    transport_mode VARCHAR(100),
    distance_km DECIMAL(18,4),
    weight_tons DECIMAL(18,4),
    entered_by UUID REFERENCES users(id),
    data_source VARCHAR(20) DEFAULT 'MANUAL',
    external_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT check_distance_non_negative CHECK (distance_km >= 0 OR distance_km IS NULL),
    CONSTRAINT check_weight_non_negative CHECK (weight_tons >= 0 OR weight_tons IS NULL)
);

CREATE INDEX idx_transportation_distribution_company_id ON transportation_distribution_activities(company_id);

COMMENT ON TABLE transportation_distribution_activities IS 'Scope 3: Upstream transportation and distribution';

-- ========================================================================

CREATE TABLE waste_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    waste_type VARCHAR(100) NOT NULL,
    waste_category VARCHAR(100),
    disposal_method VARCHAR(100) NOT NULL,
    amount DECIMAL(18,4) NOT NULL,
    amount_units VARCHAR(20),
    entered_by UUID REFERENCES users(id),
    data_source VARCHAR(20) DEFAULT 'MANUAL',
    external_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT check_amount_non_negative CHECK (amount >= 0)
);

CREATE INDEX idx_waste_company_id ON waste_activities(company_id);

COMMENT ON TABLE waste_activities IS 'Scope 3: Waste disposal';

-- ========================================================================

CREATE TABLE offsets_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    offset_description VARCHAR(255),
    offset_type VARCHAR(100),
    amount_mtco2e DECIMAL(18,4) NOT NULL,
    certification_standard VARCHAR(100),
    retirement_date DATE,
    entered_by UUID REFERENCES users(id),
    data_source VARCHAR(20) DEFAULT 'MANUAL',
    external_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT check_amount_non_negative CHECK (amount_mtco2e >= 0)
);

CREATE INDEX idx_offsets_company_id ON offsets_activities(company_id);

COMMENT ON TABLE offsets_activities IS 'Carbon offsets applied';

-- ========================================================================
-- 8. EMISSION FACTOR LIBRARY
-- ========================================================================

CREATE TABLE emission_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_type VARCHAR(50) NOT NULL,
    fuel_or_source VARCHAR(100) NOT NULL,
    calculation_unit VARCHAR(20) NOT NULL,
    region_code CHAR(2),
    vehicle_year INTEGER,
    fuel_state VARCHAR(20),
    co2_kg_per_unit DECIMAL(12,6) NOT NULL,
    ch4_g_per_unit DECIMAL(12,6) DEFAULT 0,
    n2o_g_per_unit DECIMAL(12,6) DEFAULT 0,
    co2e_kg_per_unit DECIMAL(12,6) NOT NULL,
    source VARCHAR(100),
    source_url TEXT,
    effective_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(activity_type, fuel_or_source, calculation_unit, region_code, vehicle_year, fuel_state)
);

CREATE INDEX idx_emission_factors_lookup ON emission_factors(activity_type, fuel_or_source, calculation_unit, is_active);
CREATE INDEX idx_emission_factors_region ON emission_factors(region_code);

COMMENT ON TABLE emission_factors IS 'Simplified emission factor library (EEA/EMEP, EPA)';

-- ========================================================================

-- FIX: Added UNIQUE constraint for is_current (critical fix)
CREATE TABLE emission_factor_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emission_factor_id UUID NOT NULL REFERENCES emission_factors(id) ON DELETE CASCADE,
    version_number VARCHAR(10) NOT NULL,
    effective_date DATE NOT NULL,
    end_date DATE,
    co2_kg_per_unit DECIMAL(12,6) NOT NULL,
    ch4_g_per_unit DECIMAL(12,6) DEFAULT 0,
    n2o_g_per_unit DECIMAL(12,6) DEFAULT 0,
    co2e_kg_per_unit DECIMAL(12,6) NOT NULL,
    change_reason TEXT,
    source_url TEXT,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(emission_factor_id, version_number)
);

CREATE UNIQUE INDEX idx_emission_factor_versions_current ON emission_factor_versions(emission_factor_id) WHERE is_current = true;
CREATE INDEX idx_emission_factor_versions_emission_factor_id ON emission_factor_versions(emission_factor_id);
CREATE INDEX idx_emission_factor_versions_is_current ON emission_factor_versions(is_current);

COMMENT ON TABLE emission_factor_versions IS 'Historical versioning with unique is_current constraint';

-- ========================================================================

CREATE TABLE unit_conversions (
    id SERIAL PRIMARY KEY,
    from_unit VARCHAR(50) NOT NULL,
    to_unit VARCHAR(50) NOT NULL,
    conversion_factor DECIMAL(18,6) NOT NULL,
    fuel_type VARCHAR(100),
    UNIQUE(from_unit, to_unit, fuel_type)
);

COMMENT ON TABLE unit_conversions IS 'Unit conversion factors';

-- ========================================================================

CREATE TABLE heat_content_factors (
    id SERIAL PRIMARY KEY,
    fuel_type VARCHAR(100) UNIQUE NOT NULL,
    heat_content DECIMAL(10,6) NOT NULL,
    unit VARCHAR(50),
    source TEXT
);

COMMENT ON TABLE heat_content_factors IS 'Heat content for fuel types';

-- ========================================================================

CREATE TABLE gwp_conversion_factors (
    id SERIAL PRIMARY KEY,
    ghg_type ghg_type NOT NULL UNIQUE,
    gwp_value DECIMAL(8,2) NOT NULL,
    assessment_year INTEGER,
    source VARCHAR(100),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE gwp_conversion_factors IS 'Global Warming Potential (GWP) conversion factors';

-- ========================================================================
-- 9. CALCULATIONS (Core Results)
-- ========================================================================

CREATE TABLE emission_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_type activity_category_type NOT NULL,
    activity_id UUID NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    emission_factor_id UUID REFERENCES emission_factors(id),
    emission_factor_version_id UUID REFERENCES emission_factor_versions(id),
    co2_kg DECIMAL(18,4) DEFAULT 0,
    ch4_g DECIMAL(18,4) DEFAULT 0,
    n2o_g DECIMAL(18,4) DEFAULT 0,
    co2e_metric_tons DECIMAL(18,4) NOT NULL,
    calculation_metadata JSONB DEFAULT '{}'::jsonb,
    calculated_by VARCHAR(50) DEFAULT 'SYSTEM',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT check_emissions_non_negative CHECK (
        co2_kg >= 0 AND ch4_g >= 0 AND n2o_g >= 0 AND co2e_metric_tons >= 0
    )
);

CREATE INDEX idx_emission_calculations_company_id ON emission_calculations(company_id);
CREATE INDEX idx_emission_calculations_reporting_period_id ON emission_calculations(reporting_period_id);
CREATE INDEX idx_emission_calculations_activity_type ON emission_calculations(activity_type);

COMMENT ON TABLE emission_calculations IS 'Calculated emissions (calculation_metadata stores: formula, inputs, results)';

-- ========================================================================

CREATE TABLE calculation_results_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    scope1_stationary_combustion_co2e DECIMAL(18,4) DEFAULT 0,
    scope1_mobile_sources_co2e DECIMAL(18,4) DEFAULT 0,
    scope1_refrigeration_ac_co2e DECIMAL(18,4) DEFAULT 0,
    scope1_fire_suppression_co2e DECIMAL(18,4) DEFAULT 0,
    scope1_purchased_gases_co2e DECIMAL(18,4) DEFAULT 0,
    scope1_total_gross_co2e DECIMAL(18,4) DEFAULT 0,
    scope1_offsets_co2e DECIMAL(18,4) DEFAULT 0,
    scope1_total_net_co2e DECIMAL(18,4) DEFAULT 0,
    scope2_location_based_electricity_co2e DECIMAL(18,4) DEFAULT 0,
    scope2_location_based_steam_co2e DECIMAL(18,4) DEFAULT 0,
    scope2_location_based_total_gross_co2e DECIMAL(18,4) DEFAULT 0,
    scope2_location_based_offsets_co2e DECIMAL(18,4) DEFAULT 0,
    scope2_location_based_total_net_co2e DECIMAL(18,4) DEFAULT 0,
    scope2_market_based_electricity_co2e DECIMAL(18,4) DEFAULT 0,
    scope2_market_based_steam_co2e DECIMAL(18,4) DEFAULT 0,
    scope2_market_based_total_gross_co2e DECIMAL(18,4) DEFAULT 0,
    scope2_market_based_offsets_co2e DECIMAL(18,4) DEFAULT 0,
    scope2_market_based_total_net_co2e DECIMAL(18,4) DEFAULT 0,
    scope3_business_travel_air_co2e DECIMAL(18,4) DEFAULT 0,
    scope3_business_travel_rail_co2e DECIMAL(18,4) DEFAULT 0,
    scope3_business_travel_road_co2e DECIMAL(18,4) DEFAULT 0,
    scope3_business_travel_hotel_co2e DECIMAL(18,4) DEFAULT 0,
    scope3_commuting_co2e DECIMAL(18,4) DEFAULT 0,
    scope3_transportation_distribution_co2e DECIMAL(18,4) DEFAULT 0,
    scope3_waste_co2e DECIMAL(18,4) DEFAULT 0,
    scope3_total_gross_co2e DECIMAL(18,4) DEFAULT 0,
    scope3_offsets_co2e DECIMAL(18,4) DEFAULT 0,
    scope3_total_net_co2e DECIMAL(18,4) DEFAULT 0,
    total_scope1_and_scope2_location_based_gross_co2e DECIMAL(18,4) DEFAULT 0,
    total_scope1_and_scope2_location_based_net_co2e DECIMAL(18,4) DEFAULT 0,
    total_scope1_and_scope2_market_based_gross_co2e DECIMAL(18,4) DEFAULT 0,
    total_scope1_and_scope2_market_based_net_co2e DECIMAL(18,4) DEFAULT 0,
    calculation_status calculation_status_type DEFAULT 'draft',
    last_calculated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, reporting_period_id)
);

CREATE INDEX idx_calculation_results_summary_company_id ON calculation_results_summary(company_id);

COMMENT ON TABLE calculation_results_summary IS 'Single source of truth for all emission totals';

-- ========================================================================
-- 10. AUDIT & COMPLIANCE
-- ========================================================================

CREATE TABLE calculation_audit_log (
    id BIGSERIAL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id),
    activity_type activity_category_type NOT NULL,
    activity_id UUID NOT NULL,
    reporting_period_id UUID REFERENCES reporting_periods(id),
    old_emission_value DECIMAL(18,4),
    new_emission_value DECIMAL(18,4) NOT NULL,
    emission_factor_version_id UUID REFERENCES emission_factor_versions(id),
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    change_reason TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calculation_audit_log_company_id ON calculation_audit_log(company_id);
CREATE INDEX idx_calculation_audit_log_activity_id ON calculation_audit_log(activity_id);
CREATE INDEX idx_calculation_audit_log_changed_at ON calculation_audit_log(changed_at);

COMMENT ON TABLE calculation_audit_log IS 'Immutable APPEND-ONLY audit log (CSRD compliance)';

-- ========================================================================

CREATE TABLE user_activity_audit (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    action_details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_activity_audit_user_id ON user_activity_audit(user_id);
CREATE INDEX idx_user_activity_audit_company_id ON user_activity_audit(company_id);
CREATE INDEX idx_user_activity_audit_action ON user_activity_audit(action);

COMMENT ON TABLE user_activity_audit IS 'Security audit trail';

-- ========================================================================

CREATE TABLE deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    request_type VARCHAR(50) NOT NULL,
    request_status VARCHAR(20) DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    completed_at TIMESTAMP,
    approval_reason TEXT,
    completion_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deletion_requests_user_id ON deletion_requests(user_id);
CREATE INDEX idx_deletion_requests_company_id ON deletion_requests(company_id);

COMMENT ON TABLE deletion_requests IS 'GDPR right-to-be-forgotten tracking';

-- ========================================================================
-- 10.5. APPROVAL WORKFLOW
-- ========================================================================

CREATE TABLE approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporting_period_id UUID NOT NULL UNIQUE REFERENCES reporting_periods(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES users(id),
    current_reviewer_id UUID REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMP,
    review_comments TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approval_workflows_company_id ON approval_workflows(company_id);
CREATE INDEX idx_approval_workflows_status ON approval_workflows(status);
CREATE INDEX idx_approval_workflows_current_reviewer_id ON approval_workflows(current_reviewer_id);

COMMENT ON TABLE approval_workflows IS 'Approval workflow for reporting periods (multi-step process)';

-- ========================================================================

CREATE TABLE approval_history (
    id BIGSERIAL PRIMARY KEY,
    workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('submitted', 'assigned', 'approved', 'rejected', 'commented')),
    performed_by UUID NOT NULL REFERENCES users(id),
    new_status VARCHAR(20),
    action_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approval_history_workflow_id ON approval_history(workflow_id);
CREATE INDEX idx_approval_history_action_timestamp ON approval_history(action_timestamp);

COMMENT ON TABLE approval_history IS 'Audit trail for approval workflow actions';

-- ========================================================================

CREATE TABLE approval_comments (
    id BIGSERIAL PRIMARY KEY,
    workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    comment_text TEXT NOT NULL,
    comment_type VARCHAR(20) DEFAULT 'general' CHECK (comment_type IN ('general', 'clarification', 'feedback', 'decision')),
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approval_comments_workflow_id ON approval_comments(workflow_id);
CREATE INDEX idx_approval_comments_created_at ON approval_comments(created_at);

COMMENT ON TABLE approval_comments IS 'Comments on approval workflows';

-- ========================================================================

CREATE TABLE approval_notifications (
    id BIGSERIAL PRIMARY KEY,
    workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    notification_type VARCHAR(50) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approval_notifications_user_id ON approval_notifications(user_id);
CREATE INDEX idx_approval_notifications_is_read ON approval_notifications(is_read);

COMMENT ON TABLE approval_notifications IS 'Notifications for workflow events';

-- ========================================================================
-- 11. REPORTS & EXPORTS
-- ========================================================================

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    calculation_id UUID NOT NULL REFERENCES calculation_results_summary(id) ON DELETE CASCADE,
    report_type VARCHAR(20) DEFAULT 'FULL',
    language VARCHAR(2) DEFAULT 'EN',
    generated_by UUID REFERENCES users(id),
    generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    pdf_file_path TEXT,
    pdf_file_size_bytes INTEGER,
    traffic_light_overall traffic_light_type,
    traffic_light_scope1 traffic_light_type,
    traffic_light_scope2 traffic_light_type,
    traffic_light_scope3 traffic_light_type,
    improvement_notes TEXT,
    status report_status_type DEFAULT 'draft',
    report_data JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, reporting_period_id)
);

CREATE INDEX idx_reports_company_id ON reports(company_id);
CREATE INDEX idx_reports_reporting_period_id ON reports(reporting_period_id);

COMMENT ON TABLE reports IS 'Generated PDF reports with traffic light system';

-- ========================================================================

CREATE TABLE report_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
    submitted_by UUID REFERENCES users(id),
    submitted_at TIMESTAMP DEFAULT NOW(),
    submission_status VARCHAR(20) DEFAULT 'draft',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_report_history_company_id ON report_history(company_id);

COMMENT ON TABLE report_history IS 'Report submission history';

-- ========================================================================

CREATE TABLE csv_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    exported_by UUID REFERENCES users(id),
    exported_at TIMESTAMP DEFAULT NOW(),
    file_path TEXT,
    file_size_bytes INTEGER,
    export_type VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_csv_exports_company_id ON csv_exports(company_id);

COMMENT ON TABLE csv_exports IS 'CSV export records';

-- ========================================================================
-- 12. PAYMENTS & BILLING
-- ========================================================================

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
    price_per_report DECIMAL(10,2) NOT NULL,
    billing_currency VARCHAR(3) DEFAULT 'EUR',
    status VARCHAR(20) DEFAULT 'active',
    reports_generated_this_month INTEGER DEFAULT 0,
    reports_generated_total INTEGER DEFAULT 0,
    last_billing_date DATE,
    next_billing_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_company_id ON subscriptions(company_id);

COMMENT ON TABLE subscriptions IS 'Company subscription (pay-per-report model)';

-- ========================================================================

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id),
    report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    stripe_charge_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    payment_status payment_status_type DEFAULT 'pending',
    payment_method VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    CONSTRAINT check_amount_positive CHECK (amount_cents > 0)
);

CREATE INDEX idx_payment_transactions_company_id ON payment_transactions(company_id);
CREATE INDEX idx_payment_transactions_payment_status ON payment_transactions(payment_status);

COMMENT ON TABLE payment_transactions IS 'Stripe payments (amounts in cents)';

-- ========================================================================
-- 13. LOCALIZATION & TRANSLATIONS
-- ========================================================================

CREATE TABLE translations (
    id SERIAL PRIMARY KEY,
    language_code CHAR(2) NOT NULL,
    translation_key VARCHAR(255) NOT NULL,
    translation_value TEXT NOT NULL,
    context VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(language_code, translation_key, context)
);

CREATE INDEX idx_translations_language_code ON translations(language_code);

COMMENT ON TABLE translations IS 'Centralized i18n strings (EN, DE)';

-- ========================================================================

-- Added language validation constraint
CREATE TABLE locale_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
    language VARCHAR(2) DEFAULT 'EN' CHECK (language IN ('EN', 'DE')),
    timezone VARCHAR(50) DEFAULT 'UTC',
    number_format VARCHAR(20) DEFAULT 'comma_decimal',
    date_format VARCHAR(20) DEFAULT 'DD.MM.YYYY',
    currency VARCHAR(3) DEFAULT 'EUR',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_locale_settings_company_id ON locale_settings(company_id);

COMMENT ON TABLE locale_settings IS 'Per-company localization (with language validation)';

-- ========================================================================
-- SAMPLE DATA
-- ========================================================================

INSERT INTO gwp_conversion_factors (ghg_type, gwp_value, assessment_year, source) VALUES
    ('CH4', 28, 2021, 'IPCC AR6'),
    ('N2O', 265, 2021, 'IPCC AR6'),
    ('SF6', 23500, 2021, 'IPCC AR6'),
    ('HFC', 1550, 2021, 'IPCC AR6'),
    ('PFC', 7200, 2021, 'IPCC AR6'),
    ('NF3', 17200, 2021, 'IPCC AR6')
ON CONFLICT (ghg_type) DO NOTHING;

INSERT INTO translations (language_code, translation_key, translation_value, context) VALUES
    ('EN', 'stationary_combustion_label', 'Stationary Combustion', 'FORM_LABEL'),
    ('EN', 'mobile_sources_label', 'Mobile Sources', 'FORM_LABEL'),
    ('EN', 'electricity_label', 'Electricity', 'FORM_LABEL'),
    ('EN', 'scope1_title', 'Scope 1: Direct Emissions', 'REPORT_SECTION'),
    ('EN', 'scope2_title', 'Scope 2: Indirect Emissions (Energy)', 'REPORT_SECTION'),
    ('EN', 'scope3_title', 'Scope 3: Value Chain Emissions', 'REPORT_SECTION'),
    ('DE', 'stationary_combustion_label', 'Stationäre Verbrennung', 'FORM_LABEL'),
    ('DE', 'mobile_sources_label', 'Mobile Quellen', 'FORM_LABEL'),
    ('DE', 'electricity_label', 'Elektrizität', 'FORM_LABEL'),
    ('DE', 'scope1_title', 'Scope 1: Direkte Emissionen', 'REPORT_SECTION'),
    ('DE', 'scope2_title', 'Scope 2: Indirekte Emissionen (Energie)', 'REPORT_SECTION'),
    ('DE', 'scope3_title', 'Scope 3: Lieferketten-Emissionen', 'REPORT_SECTION')
ON CONFLICT DO NOTHING;

-- ========================================================================
-- SCHEMA COMPLETE
-- ========================================================================
