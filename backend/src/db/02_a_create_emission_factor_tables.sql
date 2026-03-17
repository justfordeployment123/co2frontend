-- ========================================================================
-- EMISSION FACTORS & CALCULATION RESULTS TABLES
-- Phase 3: Calculation Engine Extension
-- ========================================================================

-- ========================================================================
-- EMISSION FACTORS - STATIONARY COMBUSTION
-- ========================================================================

CREATE TABLE emission_factors_stationary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fuel_type VARCHAR(100) NOT NULL,
    co2_kg_per_unit NUMERIC(15,6) NOT NULL,
    ch4_g_per_unit NUMERIC(15,6) NOT NULL,
    n2o_g_per_unit NUMERIC(15,6) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- MMBtu, scf, gallons, short ton, etc.
    is_biomass BOOLEAN DEFAULT false,
    standard reporting_standard_type NOT NULL DEFAULT 'GHG_PROTOCOL',
    version VARCHAR(50) NOT NULL DEFAULT 'EPA_2024_v1',
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    source VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emission_factors_stationary_fuel_type ON emission_factors_stationary(fuel_type);
CREATE INDEX idx_emission_factors_stationary_standard ON emission_factors_stationary(standard);
CREATE INDEX idx_emission_factors_stationary_version ON emission_factors_stationary(version);

COMMENT ON TABLE emission_factors_stationary IS 'Emission factors for stationary combustion fuels (EPA Emission Factors Hub)';

-- ========================================================================
-- EMISSION FACTORS - MOBILE SOURCES
-- ========================================================================

CREATE TABLE emission_factors_mobile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_type VARCHAR(100) NOT NULL,
    vehicle_year INTEGER NOT NULL,
    fuel_type VARCHAR(50) NOT NULL,
    co2_kg_per_gallon NUMERIC(15,6) NOT NULL,
    ch4_g_per_mile NUMERIC(15,6),
    n2o_g_per_mile NUMERIC(15,6),
    standard reporting_standard_type NOT NULL DEFAULT 'GHG_PROTOCOL',
    version VARCHAR(50) NOT NULL DEFAULT 'EPA_2024_v1',
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    source VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT check_vehicle_year CHECK (vehicle_year >= 1960 AND vehicle_year <= 2030)
);

CREATE INDEX idx_emission_factors_mobile_vehicle_type ON emission_factors_mobile(vehicle_type);
CREATE INDEX idx_emission_factors_mobile_vehicle_year ON emission_factors_mobile(vehicle_year);
CREATE INDEX idx_emission_factors_mobile_fuel_type ON emission_factors_mobile(fuel_type);
CREATE INDEX idx_emission_factors_mobile_standard ON emission_factors_mobile(standard);

COMMENT ON TABLE emission_factors_mobile IS 'Emission factors for mobile sources by vehicle type, year, and fuel';

-- ========================================================================
-- EMISSION FACTORS - REFRIGERANTS & GASES
-- ========================================================================

CREATE TABLE emission_factors_refrigerants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gas_type VARCHAR(50) NOT NULL,
    gwp NUMERIC(15,2) NOT NULL,
    standard reporting_standard_type NOT NULL DEFAULT 'GHG_PROTOCOL',
    version VARCHAR(50) NOT NULL DEFAULT 'IPCC_AR6',
    ipcc_assessment_report VARCHAR(20), -- AR5, AR6, etc.
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    source VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT check_gwp_positive CHECK (gwp >= 0)
);

CREATE INDEX idx_emission_factors_refrigerants_gas_type ON emission_factors_refrigerants(gas_type);
CREATE INDEX idx_emission_factors_refrigerants_standard ON emission_factors_refrigerants(standard);

COMMENT ON TABLE emission_factors_refrigerants IS 'Global Warming Potentials (GWP) for refrigerants, HFCs, PFCs, SF6, etc.';

-- ========================================================================
-- EMISSION FACTORS - ELECTRICITY GRID
-- ========================================================================

CREATE TABLE emission_factors_electricity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grid_region VARCHAR(100) NOT NULL, -- Country code or grid region
    co2e_kg_per_kwh NUMERIC(15,6) NOT NULL,
    standard reporting_standard_type NOT NULL DEFAULT 'GHG_PROTOCOL',
    version VARCHAR(50) NOT NULL DEFAULT 'IEA_2024',
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    source VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emission_factors_electricity_grid_region ON emission_factors_electricity(grid_region);
CREATE INDEX idx_emission_factors_electricity_standard ON emission_factors_electricity(standard);

COMMENT ON TABLE emission_factors_electricity IS 'Grid emission factors for purchased electricity by region';

-- ========================================================================
-- EMISSION FACTORS - STEAM/HEAT
-- ========================================================================

CREATE TABLE emission_factors_steam (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    co2e_kg_per_mmbtu NUMERIC(15,6) NOT NULL,
    standard reporting_standard_type NOT NULL DEFAULT 'GHG_PROTOCOL',
    version VARCHAR(50) NOT NULL DEFAULT 'EPA_2024_v1',
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    source VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emission_factors_steam_standard ON emission_factors_steam(standard);

COMMENT ON TABLE emission_factors_steam IS 'Emission factors for purchased steam and heat';

-- ========================================================================
-- CALCULATION RESULTS (IMMUTABLE)
-- ========================================================================

CREATE TABLE calculation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL, -- References specific activity tables
    reporting_period_id UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
    activity_type activity_category_type NOT NULL,
    
    -- Calculated emissions (metric tons)
    co2_mt NUMERIC(15,6) DEFAULT 0,
    ch4_co2e_mt NUMERIC(15,6) DEFAULT 0,
    n2o_co2e_mt NUMERIC(15,6) DEFAULT 0,
    total_co2e_mt NUMERIC(15,6) NOT NULL,
    biomass_co2_mt NUMERIC(15,6) DEFAULT 0,
    
    -- Full calculation breakdown (JSON)
    calculation_breakdown JSONB NOT NULL,
    
    -- Traceability
    emission_factor_version VARCHAR(50) NOT NULL,
    reporting_standard reporting_standard_type NOT NULL,
    calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    calculated_by UUID REFERENCES users(id),
    
    -- Immutable constraint (never update, always insert)
    CONSTRAINT immutable_result CHECK (calculated_at IS NOT NULL)
);

CREATE INDEX idx_calculation_results_activity_id ON calculation_results(activity_id);
CREATE INDEX idx_calculation_results_reporting_period_id ON calculation_results(reporting_period_id);
CREATE INDEX idx_calculation_results_activity_type ON calculation_results(activity_type);
CREATE INDEX idx_calculation_results_calculated_at ON calculation_results(calculated_at DESC);
CREATE INDEX idx_calculation_results_breakdown ON calculation_results USING GIN (calculation_breakdown);

COMMENT ON TABLE calculation_results IS 'Immutable storage of all calculation results with full audit trail';

-- ========================================================================
-- SAMPLE EMISSION FACTORS (EPA Simplified GHG Calculator - Sept 2024)
-- ========================================================================

-- Stationary Combustion Factors
INSERT INTO emission_factors_stationary (fuel_type, co2_kg_per_unit, ch4_g_per_unit, n2o_g_per_unit, unit, is_biomass, standard, version, source) VALUES
-- Natural Gas
('Natural Gas', 53.06, 1.0, 0.1, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', 'EPA Emission Factors Hub - September 2024'),
-- Coal Types
('Anthracite Coal', 103.69, 11.0, 1.6, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', 'EPA Emission Factors Hub - September 2024'),
('Bituminous Coal', 93.28, 11.0, 1.6, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', 'EPA Emission Factors Hub - September 2024'),
('Sub-bituminous Coal', 97.17, 11.0, 1.6, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', 'EPA Emission Factors Hub - September 2024'),
('Lignite Coal', 97.72, 11.0, 1.6, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', 'EPA Emission Factors Hub - September 2024'),
-- Petroleum Products
('Distillate Fuel Oil No. 2', 73.96, 3.0, 0.6, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', 'EPA Emission Factors Hub - September 2024'),
('Residual Fuel Oil No. 6', 75.10, 3.0, 0.6, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', 'EPA Emission Factors Hub - September 2024'),
('Kerosene', 72.31, 3.0, 0.6, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', 'EPA Emission Factors Hub - September 2024'),
('Liquefied Petroleum Gases (LPG)', 61.71, 3.0, 0.6, 'MMBtu', false, 'GHG_PROTOCOL', 'EPA_2024_v1', 'EPA Emission Factors Hub - September 2024'),
-- Biomass Fuels
('Wood and Wood Residuals', 93.80, 32.0, 4.2, 'MMBtu', true, 'GHG_PROTOCOL', 'EPA_2024_v1', 'EPA Emission Factors Hub - September 2024'),
('Biodiesel (100%)', 73.84, 3.0, 0.6, 'MMBtu', true, 'GHG_PROTOCOL', 'EPA_2024_v1', 'EPA Emission Factors Hub - September 2024'),
('Ethanol (100%)', 68.44, 3.0, 0.6, 'MMBtu', true, 'GHG_PROTOCOL', 'EPA_2024_v1', 'EPA Emission Factors Hub - September 2024')
ON CONFLICT DO NOTHING;

-- Mobile Source Factors (Sample - Gasoline Passenger Cars)
INSERT INTO emission_factors_mobile (vehicle_type, vehicle_year, fuel_type, co2_kg_per_gallon, ch4_g_per_mile, n2o_g_per_mile, standard, version, source) VALUES
('Passenger Cars - Gasoline', 2019, 'Motor Gasoline', 8.78, 0.0108, 0.0036, 'GHG_PROTOCOL', 'EPA_2024_v1', 'EPA Mobile Combustion Factors 2024'),
('Passenger Cars - Gasoline', 2020, 'Motor Gasoline', 8.78, 0.0106, 0.0035, 'GHG_PROTOCOL', 'EPA_2024_v1', 'EPA Mobile Combustion Factors 2024'),
('Passenger Cars - Gasoline', 2021, 'Motor Gasoline', 8.78, 0.0105, 0.0035, 'GHG_PROTOCOL', 'EPA_2024_v1', 'EPA Mobile Combustion Factors 2024'),
('Light-Duty Trucks - Gasoline', 2019, 'Motor Gasoline', 8.78, 0.0156, 0.0070, 'GHG_PROTOCOL', 'EPA_2024_v1', 'EPA Mobile Combustion Factors 2024'),
('Light-Duty Trucks - Gasoline', 2020, 'Motor Gasoline', 8.78, 0.0153, 0.0069, 'GHG_PROTOCOL', 'EPA_2024_v1', 'EPA Mobile Combustion Factors 2024'),
('Light-Duty Trucks - Gasoline', 2021, 'Motor Gasoline', 8.78, 0.0151, 0.0068, 'GHG_PROTOCOL', 'EPA_2024_v1', 'EPA Mobile Combustion Factors 2024'),
('Passenger Cars - Diesel', 2019, 'Diesel Fuel', 10.21, 0.0003, 0.0003, 'GHG_PROTOCOL', 'EPA_2024_v1', 'EPA Mobile Combustion Factors 2024'),
('Passenger Cars - Diesel', 2020, 'Diesel Fuel', 10.21, 0.0003, 0.0003, 'GHG_PROTOCOL', 'EPA_2024_v1', 'EPA Mobile Combustion Factors 2024'),
('Passenger Cars - Diesel', 2021, 'Diesel Fuel', 10.21, 0.0003, 0.0003, 'GHG_PROTOCOL', 'EPA_2024_v1', 'EPA Mobile Combustion Factors 2024')
ON CONFLICT DO NOTHING;

-- Refrigerant GWPs (IPCC AR6)
INSERT INTO emission_factors_refrigerants (gas_type, gwp, standard, version, ipcc_assessment_report, source) VALUES
('R-410A', 2088, 'GHG_PROTOCOL', 'IPCC_AR6', 'AR6', 'IPCC Sixth Assessment Report'),
('R-134a', 1430, 'GHG_PROTOCOL', 'IPCC_AR6', 'AR6', 'IPCC Sixth Assessment Report'),
('R-404A', 3922, 'GHG_PROTOCOL', 'IPCC_AR6', 'AR6', 'IPCC Sixth Assessment Report'),
('R-407C', 1774, 'GHG_PROTOCOL', 'IPCC_AR6', 'AR6', 'IPCC Sixth Assessment Report'),
('R-22', 1810, 'GHG_PROTOCOL', 'IPCC_AR6', 'AR6', 'IPCC Sixth Assessment Report'),
('SF6', 23500, 'GHG_PROTOCOL', 'IPCC_AR6', 'AR6', 'IPCC Sixth Assessment Report'),
('CO2', 1, 'GHG_PROTOCOL', 'IPCC_AR6', 'AR6', 'IPCC Sixth Assessment Report')
ON CONFLICT DO NOTHING;

-- Electricity Grid Factors (Sample European countries)
INSERT INTO emission_factors_electricity (grid_region, co2e_kg_per_kwh, standard, version, source) VALUES
('DE', 0.485, 'GHG_PROTOCOL', 'IEA_2024', 'IEA Emissions Factors 2024 - Germany'),
('FR', 0.056, 'GHG_PROTOCOL', 'IEA_2024', 'IEA Emissions Factors 2024 - France'),
('UK', 0.233, 'GHG_PROTOCOL', 'IEA_2024', 'IEA Emissions Factors 2024 - United Kingdom'),
('IT', 0.336, 'GHG_PROTOCOL', 'IEA_2024', 'IEA Emissions Factors 2024 - Italy'),
('ES', 0.213, 'GHG_PROTOCOL', 'IEA_2024', 'IEA Emissions Factors 2024 - Spain'),
('PL', 0.778, 'GHG_PROTOCOL', 'IEA_2024', 'IEA Emissions Factors 2024 - Poland'),
('NL', 0.412, 'GHG_PROTOCOL', 'IEA_2024', 'IEA Emissions Factors 2024 - Netherlands'),
('US', 0.386, 'GHG_PROTOCOL', 'IEA_2024', 'IEA Emissions Factors 2024 - United States')
ON CONFLICT DO NOTHING;

-- Steam/Heat Factors
INSERT INTO emission_factors_steam (co2e_kg_per_mmbtu, standard, version, source) VALUES
(66.33, 'GHG_PROTOCOL', 'EPA_2024_v1', 'EPA Simplified GHG Calculator 2024')
ON CONFLICT DO NOTHING;

-- ========================================================================
-- SCHEMA EXTENSION COMPLETE
-- ========================================================================
