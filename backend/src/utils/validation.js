// ========================================================================
// ACTIVITY VALIDATION LAYER
// Validates activity data, units, and required fields
// ========================================================================

const ACTIVITY_TYPES = {
  stationary_combustion: {
    name: 'Stationary Combustion',
    required: ['fuel_combusted', 'quantity_combusted', 'units'],
    scope: 1,
  },
  mobile_sources: {
    name: 'Mobile Sources',
    required: ['vehicle_type', 'on_road_or_non_road', 'fuel_usage', 'units'],
    scope: 1,
  },
  refrigeration_ac: {
    name: 'Refrigeration & AC (Legacy)',
    required: ['refrigerant_type', 'amount_released'],
    scope: 1,
  },
  refrigeration_ac_material_balance: {
    name: 'Refrigeration & AC (Material Balance)',
    required: ['refrigerant_type', 'inventory_change', 'transferred_amount', 'capacity_change'],
    scope: 1,
  },
  refrigeration_ac_simplified_material_balance: {
    name: 'Refrigeration & AC (Simplified)',
    required: ['refrigerant_type', 'new_units_charge', 'new_units_capacity', 'existing_units_recharge', 'disposed_units_capacity', 'disposed_units_recovered'],
    scope: 1,
  },
  refrigeration_ac_screening_method: {
    name: 'Refrigeration & AC (Screening)',
    required: ['equipment_type', 'refrigerant_type', 'new_units_charge', 'operating_units_capacity', 'disposed_units_capacity'],
    scope: 1,
  },
  fire_suppression: {
    name: 'Fire Suppression',
    required: ['suppressant_type', 'amount_used'],
    scope: 1,
  },
  fire_suppression_material_balance: {
    name: 'Fire Suppression (Material Balance)',
    required: ['suppressant_type', 'inventory_change_lb', 'transferred_amount_lb', 'capacity_change_lb'],
    scope: 1,
  },
  fire_suppression_simplified_material_balance: {
    name: 'Fire Suppression (Simplified)',
    required: ['suppressant_type'],
    scope: 1,
  },
  fire_suppression_screening_method: {
    name: 'Fire Suppression (Screening)',
    required: ['suppressant_type', 'equipment_type', 'unit_capacity_lb'],
    scope: 1,
  },
  purchased_gases: {
    name: 'Purchased Gases',
    required: ['gas_type', 'amount_purchased'],
    scope: 1,
  },
  electricity: {
    name: 'Electricity',
    required: ['kwh_purchased'],
    scope: 2,
  },
  steam: {
    name: 'Steam & Heat',
    required: ['amount_purchased', 'fuel_type'],
    scope: 2,
  },
  business_travel_personal_car: {
    name: 'Business Travel - Personal Vehicle',
    required: ['vehicle_type', 'miles_traveled'],
    scope: 3,
  },
  business_travel_rail_bus: {
    name: 'Business Travel - Rail or Bus',
    required: ['vehicle_type', 'miles_traveled'],
    scope: 3,
  },
  business_travel_air: {
    name: 'Business Travel - Air',
    required: ['vehicle_type', 'miles_traveled'],
    scope: 3,
  },
  employee_commuting_personal_car: {
    name: 'Employee Commuting - Personal Vehicle',
    required: ['vehicle_type', 'miles_traveled'],
    scope: 3,
  },
  employee_commuting_public_transport: {
    name: 'Employee Commuting - Public Transport',
    required: ['vehicle_type', 'miles_traveled'],
    scope: 3,
  },
  business_travel_hotel: {
    name: 'Hotel Accommodation',
    required: ['num_nights'],
    scope: 3,
  },
  commuting: {
    name: 'Employee Commuting (Legacy)',
    required: ['commute_mode'],
    scope: 3,
  },
  transportation_distribution: {
    name: 'Transportation & Distribution',
    required: [],
    scope: 3,
  },
  upstream_trans_dist_vehicle_miles: {
    name: 'Upstream Trans & Dist - Vehicle-Miles',
    required: ['vehicle_type', 'vehicle_miles'],
    scope: 3,
  },
  upstream_trans_dist_ton_miles: {
    name: 'Upstream Trans & Dist - Ton-Miles',
    required: ['vehicle_type', 'short_ton_miles'],
    scope: 3,
  },
  waste: {
    name: 'Waste Generated in Operations',
    required: ['waste_type', 'disposal_method', 'amount', 'units'],
    scope: 3,
  },
  offsets: {
    name: 'Carbon Offsets',
    required: ['amount_mtco2e'],
    scope: 0,
  },
};

const DROPDOWNS = {
  fuel_types: [
    'Anthracite Coal', 'Bituminous Coal', 'Sub-bituminous Coal', 'Lignite Coal',
    'Mixed (Commercial Sector)', 'Mixed (Electric Power Sector)', 'Mixed (Industrial Coking)', 'Mixed (Industrial Sector)',
    'Coal Coke', 'Municipal Solid Waste', 'Petroleum Coke (Solid)', 'Plastics', 'Tires',
    'Agricultural Byproducts', 'Peat', 'Solid Byproducts', 'Wood and Wood Residuals',
    'Natural Gas', 'Propane Gas', 'Landfill Gas', 'Butane', 'Ethane', 'Fuel Gas',
    'Compressed Natural Gas (CNG)', 'Aviation Gasoline', 'Jet Fuel',
    'Distillate Fuel Oil No. 2', 'Residual Fuel Oil No. 6', 'Kerosene', 'Liquefied Petroleum Gases (LPG)',
    'Biodiesel (100%)', 'Ethanol (100%)', 'Rendered Animal Fat', 'Vegetable Oil',
    'Diesel Fuel', 'Distillate Fuel Oil No. 1', 'Distillate Fuel Oil No. 4', 
    'Motor Gasoline', 'Residual Fuel Oil No. 5', 'Crude Oil', 'Heavy Gas Oils',
    'Petroleum Coke (Liquid)'
  ],
  vehicle_types: [
    // On-Road Gasoline
    'Passenger Cars - Gasoline', 'Light-Duty Trucks - Gasoline', 'Heavy-Duty Vehicles - Gasoline', 'Motorcycles - Gasoline',
    // On-Road Diesel
    'Passenger Cars - Diesel', 'Light-Duty Trucks - Diesel', 'Heavy-Duty Vehicles - Diesel', 'Medium- and Heavy-Duty Vehicles - Diesel',
    // On-Road Alternative Fuels
    'Passenger Cars - CNG', 'Passenger Cars - LPG', 'Passenger Cars - LNG', 'Passenger Cars - Biodiesel', 'Passenger Cars - Ethanol', 'Passenger Cars - Methanol',
    'Light-Duty Trucks - Ethanol', 'Light-Duty Trucks - CNG', 'Light-Duty Trucks - LPG', 'Light-Duty Trucks - LNG', 'Light-Duty Trucks - Biodiesel',
    'Light-Duty Cars - Methanol', 'Light-Duty Cars - Ethanol', 'Light-Duty Cars - CNG', 'Light-Duty Cars - LPG', 'Light-Duty Cars - Biodiesel',
    'Medium-Duty Trucks - CNG', 'Medium-Duty Trucks - LPG', 'Medium-Duty Trucks - LNG', 'Medium-Duty Trucks - Biodiesel',
    'Heavy-Duty Trucks - Methanol', 'Heavy-Duty Trucks - Ethanol', 'Heavy-Duty Trucks - CNG', 'Heavy-Duty Trucks - LPG', 'Heavy-Duty Trucks - LNG', 'Heavy-Duty Trucks - Biodiesel',
    'Heavy-Duty Vehicles - CNG', 'Heavy-Duty Vehicles - LPG', 'Heavy-Duty Vehicles - LNG', 'Heavy-Duty Vehicles - Biodiesel', 'Heavy-Duty Vehicles - Ethanol', 'Heavy-Duty Vehicles - Methanol',
    // Buses
    'Buses - Gasoline', 'Buses - Diesel', 'Buses - CNG', 'Buses - LPG', 'Buses - LNG', 'Buses - Biodiesel', 'Buses - Ethanol', 'Buses - Methanol',
    // Non-Road
    'Ships and Boats - Residual Fuel Oil', 'Ships and Boats - Gasoline (2 stroke)', 'Ships and Boats - Gasoline (4 stroke)', 'Ships and Boats - Diesel',
    'Locomotives - Diesel', 'Aircraft - Jet Fuel', 'Aircraft - Aviation Gasoline',
    // Equipment
    'Agricultural Equipment - Gasoline (2 stroke)', 'Agricultural Equipment - Gasoline (4 stroke)', 'Agricultural Equipment - Gasoline Off-Road Trucks',
    'Agricultural Equipment - Diesel Equipment', 'Agricultural Equipment - Diesel Off-Road Trucks', 'Agricultural Equipment - LPG',
    'Construction/Mining Equipment - Gasoline (2 stroke)', 'Construction/Mining Equipment - Gasoline (4 stroke)', 'Construction/Mining Equipment - Gasoline Off-Road Trucks',
    'Construction/Mining Equipment - Diesel Equipment', 'Construction/Mining Equipment - Diesel Off-Road Trucks', 'Construction/Mining Equipment - LPG',
    'Lawn and Garden Equipment - Gasoline (2 stroke)', 'Lawn and Garden Equipment - Gasoline (4 stroke)', 'Lawn and Garden Equipment - Diesel', 'Lawn and Garden Equipment - LPG',
    'Airport Equipment - Gasoline', 'Airport Equipment - Diesel', 'Airport Equipment - LPG',
    'Industrial/Commercial Equipment - Gasoline (2 stroke)', 'Industrial/Commercial Equipment - Gasoline (4 stroke)', 'Industrial/Commercial Equipment - Diesel', 'Industrial/Commercial Equipment - LPG',
    'Logging Equipment - Gasoline (2 stroke)', 'Logging Equipment - Gasoline (4 stroke)', 'Logging Equipment - Diesel',
    'Railroad Equipment - Gasoline', 'Railroad Equipment - Diesel', 'Railroad Equipment - LPG',
    'Recreational Equipment - Gasoline (2 stroke)', 'Recreational Equipment - Gasoline (4 stroke)', 'Recreational Equipment - Diesel', 'Recreational Equipment - LPG'
  ],
  refrigerant_types: [
    'Carbon dioxide', 'Sulfur hexafluoride', 'Nitrogen trifluoride', 'PFC-14', 'PFC-116', 'PFC-218', 'PFC-318', 'PFC-31-10', 'PFC-41-12', 
    'PFC-51-14', 'PFC-91-18', 'HFC-23', 'HFC-32', 'HFC-41', 'HFC-125', 'HFC-134', 'HFC-134a', 'HFC-143', 'HFC-143a', 'HFC-152', 
    'HFC-152a', 'HFC-161', 'HFC-227ea', 'HFC-236cb', 'HFC-236ea', 'HFC-236fa', 'HFC-245ca', 'HFC-245fa', 'HFC-365mfc', 'HFC-43-10mee',
    'R-401A', 'R-401B', 'R-401C', 'R-402A', 'R-402B', 'R-403B', 'R-404A', 'R-406A', 'R-407A', 'R-407B', 'R-407C', 'R-407D', 'R-408A', 
    'R-409A', 'R-410A', 'R-410B', 'R-411A', 'R-411B', 'R-414A', 'R-414B', 'R-417A', 'R-422A', 'R-422D', 'R-424A', 'R-426A', 'R-428A', 
    'R-434A', 'R-507A', 'R-508A', 'R-508B'
  ],
  flight_types: [
    'Air Short Haul (< 300 miles)',
    'Air Medium Haul (>= 300 miles, < 2300 miles)',
    'Air Long Haul (>= 2300 miles)'
  ],
  cabin_classes: ['Economy', 'Business', 'First'],
  rail_types: [
    'Intercity Rail - Northeast Corridor',
    'Intercity Rail - Other Routes',
    'Intercity Rail - National Average',
    'Commuter Rail',
    'Transit Rail (i.e. Subway, Tram)',
    'Bus'
  ],
  road_vehicle_types: [
    'Passenger Car', 'Light-Duty Truck', 'Motorcycle'
  ],
  transport_types: [
    'Passenger Car', 'Light-Duty Truck', 'Motorcycle',
    'Car (rental)', 'Taxi', 'Bus', 'Coach'
  ],
  vehicle_sizes: ['Small', 'Medium', 'Large'],
  commute_modes: [
    'Passenger Car', 'Light-Duty Truck', 'Motorcycle',
    'Bus', 'Intercity Rail', 'Commuter Rail',
    'Transit Rail (i.e. Subway, Tram)',
    'Public Transport',
    'Bicycle', 'Walking', 'Other'
  ],
  hotel_categories: ['1-star', '2-star', '3-star', '4-star', '5-star'],
  transport_modes: [
    'Heavy-Duty Truck', 'Medium-Duty Truck', 'Rail',
    'Waterborne Craft', 'Aircraft',
    'Road', 'Sea', 'Air', 'Multi-modal'
  ],
  waste_types: [
    'Aluminum Cans', 'Aluminum Ingot', 'Steel Cans', 'Copper Wire', 'Glass',
    'HDPE', 'LDPE', 'PET', 'LLDPE', 'PP', 'PS', 'PVC', 'PLA',
    'Corrugated Containers', 'Magazines/Third-class mail', 'Newspaper', 'Office Paper', 
    'Phonebooks', 'Textbooks', 'Dimensional Lumber', 'Medium-density Fiberboard',
    'Food Waste (non-meat)', 'Food Waste (meat only)', 'Beef', 'Poultry', 'Grains', 'Bread',
    'Fruits and Vegetables', 'Dairy Products', 'Yard Trimmings', 'Grass', 'Leaves', 'Branches',
    'Mixed Paper (general)', 'Mixed Paper (primarily residential)', 'Mixed Paper (primarily from offices)',
    'Mixed Metals', 'Mixed Plastics', 'Mixed Recyclables', 'Mixed Organics', 'Mixed MSW',
    'Carpet', 'Desktop CPUs', 'Portable Electronic Devices', 'Flat-panel Displays', 'CRT Displays',
    'Electronic Peripherals', 'Hard-copy Devices', 'Mixed Electronics',
    'Clay Bricks', 'Concrete', 'Fly Ash', 'Tires', 'Asphalt Concrete', 'Asphalt Shingles',
    'Drywall', 'Fiberglass Insulation', 'Structural Steel', 'Vinyl Flooring', 'Wood Flooring'
  ],
  disposal_methods: [
    'Recycled', 'Landfilled', 'Combusted', 'Composted',
    'Anaerobically Digested (Dry Digestate with Curing)',
    'Anaerobically Digested (Wet  Digestate with Curing)'
  ],
  units: [
    'kg', 'tonnes', 'metric ton', 'short ton', 'ton',
    'litres', 'liter', 'gallons', 'gallon', 'gal',
    'barrel', 'cubic meters',
    'kWh', 'MWh', 'MMBtu', 'scf', 'Mcf',
    'thousand cubic feet', 'therms', 'Therm', 'GJ',
    'km', 'miles',
    'kg CO2e', 'tonnes CO2e', 'lb', 'lbs', 'pounds'
  ],
  // Scope 3 Specific (Matches Excel)
  scope3_road: ['Passenger Car', 'Light-Duty Truck', 'Motorcycle'],
  scope3_rail: [
    'Intercity Rail - Northeast Corridor', 
    'Intercity Rail - Other Routes', 
    'Intercity Rail - National Average',
    'Commuter Rail', 
    'Transit Rail (i.e. Subway, Tram)',
    'Bus' // Bus effectively treated as rail/public group in Excel structure
  ],
  scope3_air: [
    'Air Short Haul (< 300 miles)', 
    'Air Medium Haul (>= 300 miles, < 2300 miles)', 
    'Air Long Haul (>= 2300 miles)'
  ],
  scope3_upstream_vehicle_miles: [
    'Medium- and Heavy-duty Truck', 'Light-Duty Truck', 'Passenger Car'
  ],
  scope3_upstream_ton_miles: [
    'Medium- and Heavy-Duty Truck', 'Rail', 'Waterborne Craft', 'Aircraft'
  ]
};

// Validate activity data
export function validateActivity(activityType, data) {
  const config = ACTIVITY_TYPES[activityType];

  if (!config) {
    return { valid: false, errors: [`Unknown activity type: ${activityType}`] };
  }

  const errors = [];

  // Check required fields
  for (const field of config.required) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`Required field missing: ${field}`);
    }
  }

  // Check conditional required fields
  if (config.conditionalRequired && data.calculation_method) {
    const method = data.calculation_method.toUpperCase();
    const conditionalFields = config.conditionalRequired[method];
    if (conditionalFields) {
      for (const field of conditionalFields) {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
          errors.push(`Required for ${method}: ${field}`);
        }
      }
    }
  }

  // Validate numeric fields are non-negative where applicable
  const numericFields = [
    'fuel_consumption',
    'fuel_usage',
    'miles_traveled',
    'vehicle_miles',
    'short_ton_miles',
    'amount_released',
    'amount_used',
    'amount_purchased',
    'kwh_purchased',
    'distance_km',
    'distance_per_trip_km',
    'weight_tons',
    'amount',
    'weight',
    'amount_mtco2e',
    'num_nights',
    'num_rooms',
    'num_commuters',
    'commute_days_per_year',
  ];

  for (const field of numericFields) {
    if (data[field] !== undefined && data[field] !== null) {
      const value = parseFloat(data[field]);
      if (isNaN(value)) {
        errors.push(`${field} must be a valid number`);
      } else if (value < 0) {
        errors.push(`${field} must be non-negative`);
      }
    }
  }

  // Validate dropdowns
  if (
    data.fuel_type &&
    !DROPDOWNS.fuel_types.includes(data.fuel_type)
  ) {
    errors.push(
      `Invalid fuel_type. Expected one of: ${DROPDOWNS.fuel_types.join(', ')}`
    );
  }

  // Validate vehicle_type based on activity context
  if (data.vehicle_type) {
    let allowed = DROPDOWNS.vehicle_types; // Default to legacy Mobile Sources

    if (['business_travel_personal_car', 'employee_commuting_personal_car'].includes(activityType)) {
      allowed = DROPDOWNS.scope3_road;
    } else if (['business_travel_rail_bus', 'employee_commuting_public_transport'].includes(activityType)) {
      allowed = DROPDOWNS.scope3_rail;
    } else if (activityType === 'business_travel_air') {
      allowed = DROPDOWNS.scope3_air;
    } else if (activityType === 'upstream_trans_dist_vehicle_miles') {
      allowed = DROPDOWNS.scope3_upstream_vehicle_miles;
    } else if (activityType === 'upstream_trans_dist_ton_miles') {
      allowed = DROPDOWNS.scope3_upstream_ton_miles;
    }

    if (!allowed.includes(data.vehicle_type)) {
      errors.push(`Invalid vehicle_type. Expected one of: ${allowed.join(', ')}`);
    }
  }

  if (
    data.calculation_method &&
    !['FUEL_BASED', 'DISTANCE_BASED', 'LOCATION_BASED', 'MARKET_BASED', 'MATERIAL_BALANCE', 'SIMPLIFIED_MATERIAL_BALANCE', 'SCREENING_METHOD',
      'PERSONAL_VEHICLE', 'RAIL_BUS', 'AIR', 'PUBLIC_TRANSPORTATION', 'VEHICLE_MILES', 'TON_MILES'].includes(
      data.calculation_method.toUpperCase()
    )
  ) {
    errors.push('Invalid calculation_method');
  }

  if (
    data.flight_type &&
    !DROPDOWNS.flight_types.includes(data.flight_type)
  ) {
    errors.push(
      `Invalid flight_type. Expected one of: ${DROPDOWNS.flight_types.join(', ')}`
    );
  }

  if (
    data.commute_mode &&
    !DROPDOWNS.commute_modes.includes(data.commute_mode)
  ) {
    errors.push(
      `Invalid commute_mode. Expected one of: ${DROPDOWNS.commute_modes.join(', ')}`
    );
  }

  if (
    data.refrigerant_type &&
    !DROPDOWNS.refrigerant_types.includes(data.refrigerant_type)
  ) {
    errors.push(
      `Invalid refrigerant_type. Expected one of: ${DROPDOWNS.refrigerant_types.join(', ')}`
    );
  }

  if (data.units && !DROPDOWNS.units.includes(data.units)) {
    errors.push(
      `Invalid units. Expected one of: ${DROPDOWNS.units.join(', ')}`
    );
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}




// Get activity config
export function getActivityConfig(activityType) {
  return ACTIVITY_TYPES[activityType];
}

// Get all dropdowns
export function getDropdowns() {
  return DROPDOWNS;
}

// Get activity types
export function getActivityTypes() {
  return Object.entries(ACTIVITY_TYPES).map(([key, value]) => ({
    id: key,
    name: value.name,
    scope: value.scope,
  }));
}
