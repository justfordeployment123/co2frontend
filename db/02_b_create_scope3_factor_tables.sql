-- ========================================================================
-- CREATION OF MISSING SCOPE 3 & OTHER FACTOR TABLES
-- Required for 05_seed_emission_factor_values.sql to run correctly
-- ========================================================================

-- ========================================================================
-- PURCHASED GASES (Scope 1)
-- ========================================================================
CREATE TABLE IF NOT EXISTS purchased_gas_emission_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gas_type VARCHAR(100) NOT NULL,
    chemical_formula VARCHAR(100),
    gwp_value NUMERIC(15,2) NOT NULL,
    standard reporting_standard_type DEFAULT 'GHG_PROTOCOL',
    source VARCHAR(255),
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_purchased_gas_factors_type ON purchased_gas_emission_factors(gas_type);

-- ========================================================================
-- BUSINESS TRAVEL FACTORS (Scope 3)
-- ========================================================================

-- Unified table for Business Travel might be better, but based on 05 insert usage:
CREATE TABLE IF NOT EXISTS business_travel_emission_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    travel_mode VARCHAR(100) NOT NULL, -- Air, Rail, Car - Petrol
    vehicle_size VARCHAR(50), -- Average, Small, etc.
    cabin_class VARCHAR(50), -- Economy, Business
    flight_type VARCHAR(50), -- Long Haul, Short Haul
    fuel_type VARCHAR(50),
    co2e_kg_per_km NUMERIC(15,6),
    co2e_kg_per_mile NUMERIC(15,6),
    standard reporting_standard_type DEFAULT 'GHG_PROTOCOL',
    source VARCHAR(255),
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_business_travel_factors_mode ON business_travel_emission_factors(travel_mode);

-- ========================================================================
-- HOTEL STAYS (Scope 3)
-- ========================================================================
CREATE TABLE IF NOT EXISTS hotel_emission_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_category VARCHAR(50) NOT NULL, -- 3-Star, 4-Star
    country_code CHAR(2),
    co2e_kg_per_night NUMERIC(15,4) NOT NULL,
    standard reporting_standard_type DEFAULT 'GHG_PROTOCOL',
    source VARCHAR(255),
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================================================================
-- WASTE (Scope 3)
-- ========================================================================
CREATE TABLE IF NOT EXISTS waste_emission_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waste_type VARCHAR(100) NOT NULL,
    disposal_method VARCHAR(100) NOT NULL, -- Landfill, Recycling
    co2e_kg_per_ton NUMERIC(15,4) NOT NULL,
    standard reporting_standard_type DEFAULT 'GHG_PROTOCOL',
    source VARCHAR(255),
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_waste_factors_type_method ON waste_emission_factors(waste_type, disposal_method);

-- ========================================================================
-- COMMUTING (Scope 3)
-- ========================================================================
CREATE TABLE IF NOT EXISTS commuting_emission_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commute_mode VARCHAR(100) NOT NULL, -- Car, Public Transport
    vehicle_type VARCHAR(100), -- Petrol, Diesel, Bus
    co2e_kg_per_km NUMERIC(15,6) NOT NULL,
    co2e_kg_per_mile NUMERIC(15,6),
    standard reporting_standard_type DEFAULT 'GHG_PROTOCOL',
    source VARCHAR(255),
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================================================================
-- TRANSPORTATION & DISTRIBUTION (Scope 3)
-- ========================================================================
CREATE TABLE IF NOT EXISTS transportation_emission_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transport_mode VARCHAR(100) NOT NULL, -- Road Freight, Rail Freight
    vehicle_type VARCHAR(100),
    co2e_kg_per_ton_km NUMERIC(15,6) NOT NULL,
    co2e_kg_per_ton_mile NUMERIC(15,6),
    standard reporting_standard_type DEFAULT 'GHG_PROTOCOL',
    source VARCHAR(255),
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
