/**
 * ========================================================================
 * EMISSION FACTOR RESOLVER SERVICE
 * ========================================================================
 * 
 * This service loads emission factors from the database with version awareness.
 * Factors are cached for performance.
 * 
 * Supports multiple reporting standards:
 * - CSRD (Corporate Sustainability Reporting Directive)
 * - GHG Protocol
 * - ISO 14064
 */

import pool from '../utils/db.js';

// In-memory cache for emission factors
const factorCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Get emission factors for stationary combustion fuels
 * 
 * @param {string} fuelType - Type of fuel (e.g., "Natural Gas", "Diesel")
 * @param {string} [standard='GHG_PROTOCOL'] - Reporting standard
 * @param {string} [version='latest'] - Factor version (default: latest)
 * @returns {Promise<Object>} Emission factors
 */
async function getStationaryFuelFactors(fuelType, standard = 'GHG_PROTOCOL', version = 'latest') {
  const cacheKey = `stationary:${fuelType}:${standard}:${version}`;
  
  // Check cache first
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  try {
    const query = `
      SELECT 
        fuel_type,
        co2_kg_per_unit,
        ch4_g_per_unit,
        n2o_g_per_unit,
        unit,
        is_biomass,
        standard,
        version,
        effective_date,
        source
      FROM emission_factors_stationary
      WHERE LOWER(fuel_type) = LOWER($1)
        AND standard = $2
        AND (version = $3 OR $3 = 'latest')
      ORDER BY effective_date DESC
      LIMIT 1
    `;
    
    const result = await pool.query(query, [fuelType, standard, version]);
    
    if (result.rows.length === 0) {
      throw new Error(`Emission factors not found for fuel: ${fuelType} (${standard})`);
    }
    
    const factors = result.rows[0];
    
    // Cache the result
    setInCache(cacheKey, factors);
    
    return factors;
  } catch (error) {
    console.error('[EmissionFactorResolver] Error loading stationary fuel factors:', error);
    throw error;
  }
}

/**
 * Get emission factors for mobile sources
 * 
 * @param {string} vehicleType - Type of vehicle (e.g., "Passenger Cars - Gasoline")
 * @param {number} vehicleYear - Model year
 * @param {string} fuelType - Fuel type (e.g., "Motor Gasoline", "Diesel")
 * @param {string} [standard='GHG_PROTOCOL'] - Reporting standard
 * @returns {Promise<Object>} Emission factors
 */
async function getMobileSourceFactors(vehicleType, vehicleYear, fuelType, standard = 'GHG_PROTOCOL') {
  const cacheKey = `mobile:${vehicleType}:${vehicleYear}:${fuelType}:${standard}`;
  
  // Check cache first
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  try {
    const query = `
      SELECT 
        vehicle_type,
        vehicle_year,
        fuel_type,
        co2_kg_per_gallon,
        ch4_g_per_mile,
        n2o_g_per_mile,
        standard,
        version,
        effective_date,
        source
      FROM emission_factors_mobile
      WHERE LOWER(vehicle_type) = LOWER($1)
        AND vehicle_year <= $2
        AND LOWER(fuel_type) = LOWER($3)
        AND standard = $4
      ORDER BY vehicle_year DESC, effective_date DESC
      LIMIT 1
    `;
    
    let result = await pool.query(query, [vehicleType, vehicleYear, fuelType, standard]);
    
    // FALLBACK: If no factor found for this year or older, try finding ANY factor for this vehicle/fuel
    // This handles cases where the vehicle is older than our dataset, or if there's a gap.
    if (result.rows.length === 0) {
      console.log(`[EmissionFactorResolver] No exact factor for ${vehicleType} (${vehicleYear}). Trying fallback...`);
      const fallbackQuery = `
        SELECT 
          vehicle_type,
          vehicle_year,
          fuel_type,
          co2_kg_per_gallon,
          ch4_g_per_mile,
          n2o_g_per_mile,
          standard,
          version,
          effective_date,
          source
        FROM emission_factors_mobile
        WHERE LOWER(vehicle_type) = LOWER($1)
          AND LOWER(fuel_type) = LOWER($2)
          AND standard = $3
        ORDER BY vehicle_year DESC 
        LIMIT 1
      `;
      
      const fallbackResult = await pool.query(
        fallbackQuery, 
        [vehicleType, fuelType, standard]
      );
      
      if (fallbackResult.rows.length > 0) {
        result = fallbackResult;
      }
    }
    
    // ------------------------------------------------------------------
    // HARDCODED BACKUP FACTORS
    // Only use if DB returns no results
    // ------------------------------------------------------------------
    if (result.rows.length === 0) {
      
      // Normalize keys for case-insensitive matching
      const vType = vehicleType.toLowerCase();
      const fType = fuelType.toLowerCase();
      
      // Standard CO2 factors (approximate EPA 2024 values)
      const GASOLINE_CO2 = 8.78; // kg/gallon
      const DIESEL_CO2 = 10.21;  // kg/gallon
      const CNG_CO2 = 0.0544;    // kg/scf
      const LPG_CO2 = 5.68;      // kg/gallon
      const ETHANOL_CO2 = 5.75;  // kg/gallon (100%)
      const BIODIESEL_CO2 = 9.45;// kg/gallon (100%)
      
      let backupFactor = null;

      if (fType.includes('gasoline') || fType.includes('petrol')) {
        backupFactor = { co2_kg_per_gallon: GASOLINE_CO2, ch4_g_per_mile: 0.019, n2o_g_per_mile: 0.013 };
      } else if (fType.includes('diesel')) {
        backupFactor = { co2_kg_per_gallon: DIESEL_CO2, ch4_g_per_mile: 0.001, n2o_g_per_mile: 0.001 };
      } else if (fType.includes('cng') || fType.includes('natural gas')) {
        backupFactor = { co2_kg_per_gallon: CNG_CO2, ch4_g_per_mile: 0.034, n2o_g_per_mile: 0.002, unit_override: 'scf' };
      } else if (fType.includes('lpg') || fType.includes('propane')) {
        backupFactor = { co2_kg_per_gallon: LPG_CO2, ch4_g_per_mile: 0.034, n2o_g_per_mile: 0.002 };
      } else if (fType.includes('ethanol')) {
        backupFactor = { co2_kg_per_gallon: ETHANOL_CO2, ch4_g_per_mile: 0.055, n2o_g_per_mile: 0.013 };
      } else if (fType.includes('biodiesel')) {
        backupFactor = { co2_kg_per_gallon: BIODIESEL_CO2, ch4_g_per_mile: 0.001, n2o_g_per_mile: 0.001 };
      }

      if (backupFactor) {
        console.warn(`[EmissionFactorResolver] Using HARDCODED backup factor for ${vehicleType} (${vehicleYear})`);
        const factors = {
          vehicle_type: vehicleType,
          vehicle_year: vehicleYear,
          fuel_type: fuelType,
          co2_kg_per_gallon: backupFactor.co2_kg_per_gallon,
          ch4_g_per_mile: backupFactor.ch4_g_per_mile,
          n2o_g_per_mile: backupFactor.n2o_g_per_mile,
          standard: standard,
          source: 'HARDCODED_BACKUP'
        };
        // Cache it
        setInCache(cacheKey, factors);
        return factors;
      }
    }

    const factors = result.rows[0];
    
    // Cache the result
    setInCache(cacheKey, factors);
    
    return factors;
  } catch (error) {
    console.error('[EmissionFactorResolver] Error loading mobile source factors:', error);
    throw error;
  }
}

/**
 * Get Global Warming Potential (GWP) for refrigerants and other gases
 * 
 * @param {string} gasType - Gas type (e.g., "R-410A", "SF6", "CO2")
 * @param {string} [standard='GHG_PROTOCOL'] - Reporting standard
 * @returns {Promise<Object>} GWP value
 */
async function getRefrigerantGWP(gasType, standard = 'GHG_PROTOCOL') {
  const cacheKey = `refrigerant:${gasType}:${standard}`;
  
  // Check cache first
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  try {
    const query = `
      SELECT 
        gas_type,
        gwp,
        standard,
        version,
        ipcc_assessment_report,
        effective_date
      FROM emission_factors_refrigerants
      WHERE LOWER(gas_type) = LOWER($1)
        AND standard = $2
      ORDER BY effective_date DESC
      LIMIT 1
    `;
    
    const result = await pool.query(query, [gasType, standard]);
    
    if (result.rows.length === 0) {
      throw new Error(`GWP not found for gas: ${gasType}`);
    }
    
    const factors = result.rows[0];
    
    // Cache the result
    setInCache(cacheKey, factors);
    
    return factors;
  } catch (error) {
    console.error('[EmissionFactorResolver] Error loading refrigerant GWP:', error);
    throw error;
  }
}

/**
 * Get EEA electricity emission factors (European countries)
 * 
 * @param {string} countryCode - ISO 2-letter country code (e.g., "DE", "FR", "UK")
 * @param {number} [year=2024] - Year for emission factors
 * @returns {Promise<Object|null>} EEA electricity factors or null if not found
 */
async function getEEAElectricityFactors(countryCode, year = 2024) {
  const cacheKey = `eea_electricity:${countryCode}:${year}`;
  
  // Check cache first
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  try {
    const query = `
      SELECT 
        country_code,
        country_name,
        year,
        grid_intensity_kg_co2e_per_kwh,
        renewable_percentage,
        data_source,
        notes
      FROM eea_electricity_factors
      WHERE country_code = $1
        AND year = $2
      LIMIT 1
    `;
    
    const result = await pool.query(query, [countryCode, year]);
    
    if (result.rows.length === 0) {
      // Try current year if specified year not found
      if (year !== 2024) {
        const currentQuery = `
          SELECT * FROM eea_electricity_factors
          WHERE country_code = $1
          ORDER BY year DESC
          LIMIT 1
        `;
        const currentResult = await pool.query(currentQuery, [countryCode]);
        if (currentResult.rows.length > 0) {
          setInCache(cacheKey, currentResult.rows[0]);
          return currentResult.rows[0];
        }
      }
      return null; // No EEA factors available for this country
    }
    
    const factors = result.rows[0];
    setInCache(cacheKey, factors);
    
    return factors;
  } catch (error) {
    console.error('[EmissionFactorResolver] Error loading EEA electricity factors:', error);
    return null; // Return null instead of throwing to allow fallback
  }
}

/**
 * Get emission factors for purchased electricity by grid region
 * 
 * REGIONAL INTELLIGENCE: Automatically uses EEA factors for European companies
 * for more accurate country-specific grid intensities.
 * 
 * @param {string} gridRegion - Grid region or country code
 * @param {string} [standard='GHG_PROTOCOL'] - Reporting standard
 * @param {Object} [options={}] - Additional options
 * @param {string} [options.companyCountry] - Company country code for intelligent factor selection
 * @returns {Promise<Object>} Emission factors
 */
async function getElectricityFactors(gridRegion, standard = 'GHG_PROTOCOL', options = {}) {
  const { companyCountry } = options;
  
  // List of European countries with EEA data
  const europeanCountries = [
    'DE', 'FR', 'UK', 'ES', 'IT', 'NL', 'PL', 'BE', 'AT', 'SE',
    'DK', 'FI', 'NO', 'PT', 'GR', 'CZ', 'RO', 'IE', 'HU', 'BG',
    'SK', 'HR', 'SI', 'LT', 'LV', 'EE', 'LU', 'CY', 'MT', 'CH'
  ];
  
  // Determine effective region (prefer companyCountry if provided)
  const effectiveRegion = companyCountry || gridRegion;
  const isEuropean = europeanCountries.includes(effectiveRegion);
  
  // For European companies, try EEA factors first
  if (isEuropean) {
    try {
      const eeaFactors = await getEEAElectricityFactors(effectiveRegion);
      if (eeaFactors) {
        console.log(`[EmissionFactorResolver] Using EEA factors for ${effectiveRegion}: ${eeaFactors.grid_intensity_kg_co2e_per_kwh} kg CO2e/kWh`);
        return {
          grid_region: effectiveRegion,
          co2e_kg_per_kwh: eeaFactors.grid_intensity_kg_co2e_per_kwh,
          renewable_percentage: eeaFactors.renewable_percentage,
          standard: 'EEA',
          source: eeaFactors.data_source,
          year: eeaFactors.year,
          country_name: eeaFactors.country_name,
          note: `EEA country-specific grid intensity for ${eeaFactors.country_name}`
        };
      }
    } catch (error) {
      console.log(`[EmissionFactorResolver] EEA factors not available for ${effectiveRegion}, using generic factors`);
    }
  }
  
  // Fallback to generic emission_factors_electricity table
  const cacheKey = `electricity:${gridRegion}:${standard}`;
  
  // Check cache first
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  try {
    const query = `
      SELECT 
        grid_region,
        co2e_kg_per_kwh,
        co2_lb_per_mwh,
        ch4_lb_per_mwh,
        n2o_lb_per_mwh,
        standard,
        version,
        effective_date,
        source
      FROM emission_factors_electricity
      WHERE grid_region = $1
        AND standard = $2
      ORDER BY effective_date DESC
      LIMIT 1
    `;
    
    const result = await pool.query(query, [gridRegion, standard]);
    
    if (result.rows.length === 0) {
      throw new Error(`Electricity emission factors not found for region: ${gridRegion}`);
    }
    
    const factors = result.rows[0];
    
    // Cache the result
    setInCache(cacheKey, factors);
    
    return factors;
  } catch (error) {
    console.error('[EmissionFactorResolver] Error loading electricity factors:', error);
    throw error;
  }
}

/**
 * Get emission factors for steam/heat
 * 
 * @param {string} [standard='GHG_PROTOCOL'] - Reporting standard
 * @returns {Promise<Object>} Emission factors
 */
async function getSteamFactors(standard = 'GHG_PROTOCOL') {
  const cacheKey = `steam:${standard}`;
  
  // Check cache first
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  try {
    const query = `
      SELECT 
        co2e_kg_per_mmbtu,
        standard,
        version,
        effective_date,
        source
      FROM emission_factors_steam
      WHERE standard = $1
      ORDER BY effective_date DESC
      LIMIT 1
    `;
    
    const result = await pool.query(query, [standard]);
    
    if (result.rows.length === 0) {
      throw new Error(`Steam/heat emission factors not found for standard: ${standard}`);
    }
    
    const factors = result.rows[0];
    
    // Cache the result
    setInCache(cacheKey, factors);
    
    return factors;
  } catch (error) {
    console.error('[EmissionFactorResolver] Error loading steam factors:', error);
    throw error;
  }
}

/**
 * Get all available fuel types for stationary combustion
 * 
 * @param {string} [standard='GHG_PROTOCOL'] - Reporting standard
 * @returns {Promise<Array>} List of available fuel types
 */
async function getAvailableFuelTypes(standard = 'GHG_PROTOCOL') {
  try {
    const query = `
      SELECT DISTINCT fuel_type, is_biomass
      FROM emission_factors_stationary
      WHERE standard = $1
      ORDER BY fuel_type
    `;
    
    const result = await pool.query(query, [standard]);
    return result.rows;
  } catch (error) {
    console.error('[EmissionFactorResolver] Error loading fuel types:', error);
    throw error;
  }
}

/**
 * Get all available vehicle types for mobile sources
 * 
 * @param {string} [standard='GHG_PROTOCOL'] - Reporting standard
 * @returns {Promise<Array>} List of available vehicle types
 */
async function getAvailableVehicleTypes(standard = 'GHG_PROTOCOL') {
  try {
    const query = `
      SELECT DISTINCT vehicle_type, fuel_type
      FROM emission_factors_mobile
      WHERE standard = $1
      ORDER BY vehicle_type, fuel_type
    `;
    
    const result = await pool.query(query, [standard]);
    return result.rows;
  } catch (error) {
    console.error('[EmissionFactorResolver] Error loading vehicle types:', error);
    throw error;
  }
}

/**
 * Clear the emission factor cache
 */
function clearCache() {
  factorCache.clear();
  console.log('[EmissionFactorResolver] Cache cleared');
}

/**
 * Get value from cache if not expired
 * 
 * @param {string} key - Cache key
 * @returns {Object|null} Cached value or null
 */
function getFromCache(key) {
  const cached = factorCache.get(key);
  
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL_MS) {
    // Cache expired
    factorCache.delete(key);
    return null;
  }
  
  return cached.value;
}

/**
 * Store value in cache with timestamp
 * 
 * @param {string} key - Cache key
 * @param {Object} value - Value to cache
 */
function setInCache(key, value) {
  factorCache.set(key, {
    value,
    timestamp: Date.now()
  });
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  return {
    size: factorCache.size,
    ttl_ms: CACHE_TTL_MS
  };
}

/**
 * Get emission factors for waste disposal
 */
async function getWasteFactors(wasteType, disposalMethod) {
  const cacheKey = `waste:${wasteType}:${disposalMethod}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  try {
    const query = `
      SELECT waste_type, disposal_method, co2e_kg_per_ton, source
      FROM waste_emission_factors
      WHERE waste_type = $1 AND disposal_method = $2 AND is_active = true
      LIMIT 1
    `;
    
    const result = await pool.query(query, [wasteType, disposalMethod]);
    if (result.rows.length === 0) {
      throw new Error(`No emission factor found for waste type: ${wasteType}, disposal: ${disposalMethod}`);
    }
    
    setInCache(cacheKey, result.rows[0]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error fetching waste emission factors: ${error.message}`);
  }
}

/**
 * Get GWP for purchased gases
 */
async function getPurchasedGasGWP(gasType) {
  const cacheKey = `gas:${gasType}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  try {
    const query = `
      SELECT gas_type, chemical_formula, gwp_value, source
      FROM purchased_gas_emission_factors
      WHERE gas_type = $1 AND is_active = true
      LIMIT 1
    `;
    
    const result = await pool.query(query, [gasType]);
    if (result.rows.length === 0) {
      throw new Error(`No GWP found for gas type: ${gasType}`);
    }
    
    setInCache(cacheKey, result.rows[0]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error fetching purchased gas GWP: ${error.message}`);
  }
}

/**
 * Get emission factors for business travel
 */
async function getBusinessTravelFactors(travelMode, options = {}) {
  const { vehicleSize, cabinClass, flightType, fuelType } = options;
  const cacheKey = `travel:${travelMode}:${vehicleSize}:${cabinClass}:${flightType}:${fuelType}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  try {
    const query = `
      SELECT travel_mode, vehicle_size, cabin_class, flight_type, 
             co2e_kg_per_km, co2e_kg_per_mile, source
      FROM business_travel_emission_factors
      WHERE travel_mode = $1
        AND ($2::VARCHAR IS NULL OR vehicle_size = $2)
        AND ($3::VARCHAR IS NULL OR cabin_class = $3)
        AND ($4::VARCHAR IS NULL OR flight_type = $4)
        AND ($5::VARCHAR IS NULL OR fuel_type = $5)
        AND is_active = true
      ORDER BY id
      LIMIT 1
    `;
    
    const result = await pool.query(query, [travelMode, vehicleSize, cabinClass, flightType, fuelType]);
    if (result.rows.length === 0) {
      throw new Error(`No emission factor found for travel mode: ${travelMode}`);
    }
    
    setInCache(cacheKey, result.rows[0]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error fetching business travel factors: ${error.message}`);
  }
}

/**
 * Get emission factors for hotel stays
 */
async function getHotelFactors(hotelCategory) {
  const cacheKey = `hotel:${hotelCategory}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  try {
    const query = `
      SELECT hotel_category, co2e_kg_per_night, source
      FROM hotel_emission_factors
      WHERE hotel_category = $1 AND is_active = true
      LIMIT 1
    `;
    
    const result = await pool.query(query, [hotelCategory]);
    if (result.rows.length === 0) {
      throw new Error(`No emission factor found for hotel category: ${hotelCategory}`);
    }
    
    setCache(cacheKey, result.rows[0]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error fetching hotel emission factors: ${error.message}`);
  }
}

/**
 * Get emission factors for commuting
 */
async function getCommutingFactors(commuteMode, vehicleType) {
  const cacheKey = `commute:${commuteMode}:${vehicleType}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  try {
    const query = `
      SELECT commute_mode, vehicle_type, co2e_kg_per_km, co2e_kg_per_mile, source
      FROM commuting_emission_factors
      WHERE commute_mode = $1 
        AND ($2::VARCHAR IS NULL OR vehicle_type = $2)
        AND is_active = true
      ORDER BY id
      LIMIT 1
    `;
    
    const result = await pool.query(query, [commuteMode, vehicleType]);
    if (result.rows.length === 0) {
      throw new Error(`No emission factor found for commute mode: ${commuteMode}`);
    }
    
    setInCache(cacheKey, result.rows[0]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error fetching commuting factors: ${error.message}`);
  }
}

/**
 * Get emission factors for transportation
 */
async function getTransportationFactors(transportMode, vehicleType) {
  const cacheKey = `transport:${transportMode}:${vehicleType}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  try {
    const query = `
      SELECT transport_mode, vehicle_type, co2e_kg_per_ton_km, co2e_kg_per_ton_mile, source
      FROM transportation_emission_factors
      WHERE transport_mode = $1 
        AND ($2::VARCHAR IS NULL OR vehicle_type = $2)
        AND is_active = true
      ORDER BY id
      LIMIT 1
    `;
    
    const result = await pool.query(query, [transportMode, vehicleType]);
    if (result.rows.length === 0) {
      throw new Error(`No emission factor found for transport mode: ${transportMode}`);
    }
    
    setInCache(cacheKey, result.rows[0]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error fetching transportation factors: ${error.message}`);
  }
}

export {
  getStationaryFuelFactors,
  getMobileSourceFactors,
  getRefrigerantGWP,
  getElectricityFactors,
  getEEAElectricityFactors,
  getSteamFactors,
  getWasteFactors,
  getPurchasedGasGWP,
  getBusinessTravelFactors,
  getHotelFactors,
  getCommutingFactors,
  getTransportationFactors,
  getAvailableFuelTypes,
  getAvailableVehicleTypes,
  clearCache,
  getCacheStats
};
