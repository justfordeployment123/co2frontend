import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon, SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/common/Toast';
import { activitiesAPI } from '../api/activitiesAPI';
import { useAuth } from "../contexts/AuthContext";
import apiClient from '../api/apiClient';
import { getFuelState, getValidUnits, getMobileUnits, getFuelTypeFromVehicle } from '../utils/excelMappings';
import WASTE_METHOD_MAP from '../constants/wasteConfig';
import OFFSET_SCOPE_CATEGORIES from '../constants/offsetsConfig';

// GWP values from Excel (IPCC AR5, 100-yr)
const GWP_MAP = {
  'Carbon dioxide': 1,
  'Methane': 28,
  'Nitrous oxide': 265,
  'HFC-23': 12400,
  'HFC-32': 677,
  'HFC-41': 116,
  'HFC-125': 3170,
  'HFC-134': 1120,
  'HFC-134a': 1300,
  'HFC-143': 328,
  'HFC-143a': 4800,
  'HFC-152': 16,
  'HFC-152a': 138,
  'HFC-161': 4,
  'HFC-227ea': 3350,
  'HFC-236cb': 1210,
  'HFC-236ea': 1330,
  'HFC-236fa': 8060,
  'HFC-245ca': 716,
  'HFC-245fa': 858,
  'HFC-365mfc': 804,
  'HFC-43-10mee': 1650,
  'Sulfur hexafluoride': 23500,
  'Nitrogen trifluoride': 16100,
  'PFC-14': 6630,
  'PFC-116': 11100,
  'PFC-218': 8900,
  'PFC-318': 9540,
  'PFC-31-10': 9200,
  'PFC-41-12': 8550,
  'PFC-51-14': 7910,
  'PFC-91-18': 7190,
  'R-401A': 18,
  'R-401B': 15,
  'R-401C': 21,
  'R-402A': 1902,
  'R-402B': 1205,
  'R-403B': 3471,
  'R-404A': 3943,
  'R-406A': 0,
  'R-407A': 1923,
  'R-407B': 2547,
  'R-407C': 1624,
  'R-407D': 1487,
  'R-408A': 2430,
  'R-409A': 0,
  'R-410A': 1924,
  'R-410B': 2048,
  'R-411A': 15,
  'R-411B': 4,
  'R-414A': 0,
  'R-414B': 0,
  'R-417A': 2127,
  'R-422A': 2847,
  'R-422D': 2473,
  'R-424A': 3104,
  'R-426A': 1371,
  'R-428A': 3417,
  'R-434A': 3075,
  'R-507A': 3985,
  'R-508A': 11607,
  'R-508B': 11698
};

// Exact On-Road vehicle types from Excel DropDown sheet
const ON_ROAD_VEHICLE_TYPES = [
  'Passenger Cars - Gasoline',
  'Light-Duty Trucks - Gasoline',
  'Heavy-Duty Vehicles - Gasoline',
  'Motorcycles - Gasoline',
  'Passenger Cars - Diesel',
  'Light-Duty Trucks - Diesel',
  'Heavy-Duty Vehicles - Diesel',
  'Passenger Cars - CNG',
  'Light-Duty Trucks - CNG',
  'Heavy-Duty Vehicles - CNG',
  'Passenger Cars - LPG',
  'Light-Duty Trucks - LPG',
  'Heavy-Duty Vehicles - LPG',
  'Passenger Cars - LNG',
  'Light-Duty Trucks - LNG',
  'Heavy-Duty Vehicles - LNG',
  'Passenger Cars - Biodiesel',
  'Light-Duty Trucks - Biodiesel',
  'Heavy-Duty Vehicles - Biodiesel',
  'Passenger Cars - Ethanol',
  'Light-Duty Trucks - Ethanol',
  'Heavy-Duty Vehicles - Ethanol',
  'Passenger Cars - Methanol',
  'Light-Duty Trucks - Methanol',
  'Heavy-Duty Vehicles - Methanol',
  'Buses - Gasoline',
  'Buses - Diesel',
  'Buses - CNG',
  'Buses - LPG',
  'Buses - LNG',
  'Buses - Biodiesel',
  'Buses - Ethanol',
  'Buses - Methanol',
];

// Exact Non-Road vehicle types from Excel DropDown sheet
const NON_ROAD_VEHICLE_TYPES = [
  'Ships and Boats - Residual Fuel Oil',
  'Ships and Boats - Gasoline (2 stroke)',
  'Ships and Boats - Gasoline (4 stroke)',
  'Ships and Boats - Diesel',
  'Locomotives - Diesel',
  'Aircraft - Jet Fuel',
  'Aircraft - Aviation Gasoline',
];

// Full list from DropDown sheet
const REFRIG_GASES = [
  'Carbon dioxide', 'Sulfur hexafluoride', 'Nitrogen trifluoride', 'PFC-14', 'PFC-116', 'PFC-218', 'PFC-318', 'PFC-31-10', 'PFC-41-12', 
  'PFC-51-14', 'PFC-91-18', 'HFC-23', 'HFC-32', 'HFC-41', 'HFC-125', 'HFC-134', 'HFC-134a', 'HFC-143', 'HFC-143a', 'HFC-152', 
  'HFC-152a', 'HFC-161', 'HFC-227ea', 'HFC-236cb', 'HFC-236ea', 'HFC-236fa', 'HFC-245ca', 'HFC-245fa', 'HFC-365mfc', 'HFC-43-10mee',
  'R-401A', 'R-401B', 'R-401C', 'R-402A', 'R-402B', 'R-403B', 'R-404A', 'R-406A', 'R-407A', 'R-407B', 'R-407C', 'R-407D', 'R-408A', 
  'R-409A', 'R-410A', 'R-410B', 'R-411A', 'R-411B', 'R-414A', 'R-414B', 'R-417A', 'R-422A', 'R-422D', 'R-424A', 'R-426A', 'R-428A', 
  'R-434A', 'R-507A', 'R-508A', 'R-508B'
];
const REFRIG_EQUIPMENT_TYPES = [
  'Domestic Refrigeration', 'Stand-Alone Commercial', 'Medium/Large Commercial', 'Transport Refrigeration', 
  'Industrial Refrigeration', 'Chillers', 'Residential/Commercial A/C', 'Maritime A/C Units', 
  'Railway A/C Units', 'Buses A/C Units', 'Other Mobile A/C Units'
];

// Fire Suppression gases from Excel
const FIRE_SUPPRESSION_GASES = [
  'Carbon dioxide', 'HFC-23', 'HFC-125', 'HFC-134a', 'HFC-227ea', 'HFC-236fa', 'PFC-14', 'PFC-31-10'
];

// Scope 3: Business Travel & Commuting Dropdowns (Exact Excel matches)
const BT_ROAD_TYPES = ['Passenger Car', 'Light-Duty Truck', 'Motorcycle'];
const BT_RAIL_TYPES = [
  'Intercity Rail - Northeast Corridor', 
  'Intercity Rail - Other Routes', 
  'Intercity Rail - National Average', 
  'Commuter Rail', 
  'Transit Rail (i.e. Subway, Tram)', 
  'Bus'
];
const BT_AIR_TYPES = [
  'Air Short Haul (< 300 miles)', 
  'Air Medium Haul (>= 300 miles, < 2300 miles)', 
  'Air Long Haul (>= 2300 miles)'
];

const EC_ROAD_TYPES = BT_ROAD_TYPES;
const EC_PUBLIC_TYPES = BT_RAIL_TYPES;

const UPSTREAM_VEHICLE_MILES_TYPES = ['Medium- and Heavy-duty Truck', 'Light-Duty Truck', 'Passenger Car'];
const UPSTREAM_TON_MILES_TYPES = ['Medium- and Heavy-Duty Truck', 'Rail', 'Waterborne Craft', 'Aircraft'];

const WASTE_MATERIALS = [
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
];

const DISPOSAL_METHODS = [
  'Recycled', 'Landfilled', 'Combusted', 'Composted', 
  'Anaerobically Digested (Dry Digestate with Curing)', 
  'Anaerobically Digested (Wet  Digestate with Curing)'
];

const FORM_FIELDS = {
  stationary_combustion: [
    { name: 'source_id', label: 'Source ID', type: 'text', required: false },
    { name: 'source_description', label: 'Source Description', type: 'text', required: false },
    { name: 'source_area_sqft', label: 'Source Area (sq ft)', type: 'number', required: false },
    { name: 'fuel_combusted', label: 'Fuel Combusted', type: 'select', options: [
      'Anthracite Coal', 'Bituminous Coal', 'Sub-bituminous Coal', 'Lignite Coal',
      'Mixed (Commercial Sector)', 'Mixed (Electric Power Sector)', 'Mixed (Industrial Coking)', 'Mixed (Industrial Sector)',
      'Coal Coke', 'Municipal Solid Waste', 'Petroleum Coke (Solid)', 'Plastics', 'Tires',
      'Agricultural Byproducts', 'Peat', 'Solid Byproducts', 'Wood and Wood Residuals',
      'Natural Gas', 'Propane Gas', 'Landfill Gas',
      'Distillate Fuel Oil No. 2', 'Residual Fuel Oil No. 6', 'Kerosene', 'Liquefied Petroleum Gases (LPG)',
      'Biodiesel (100%)', 'Ethanol (100%)', 'Rendered Animal Fat', 'Vegetable Oil'
    ], required: true },
    { name: 'fuel_state', label: 'Fuel State', type: 'text', required: false, readOnly: true },
    { name: 'quantity_combusted', label: 'Quantity Combusted', type: 'number', required: true },
    { name: 'units', label: 'Units', type: 'select', options: [], required: true },
  ],
  mobile_sources: [
    { name: 'source_id', label: 'Source ID', type: 'text', required: false },
    { name: 'source_description', label: 'Source Description', type: 'text', required: false },
    { name: 'on_road_or_non_road', label: 'On-Road or Non-Road?', type: 'select', options: ['On-Road', 'Non-Road'], required: true },
    { name: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: [], required: true },
    { name: 'vehicle_year', label: 'Vehicle Year', type: 'number', required: false },
    // fuel_type is not user-facing; set in backend only
    { name: 'fuel_usage', label: 'Fuel Usage', type: 'number', required: false },
    { name: 'units', label: 'Units', type: 'select', options: ['gal', 'scf'], required: true },
    { name: 'miles_traveled', label: 'Miles Traveled', type: 'number', required: false },
    // calculation_method is not user-facing; set in backend only
  ],

  refrigeration_ac_material_balance: [
    { name: 'refrigerant_type', label: 'Gas', type: 'select', options: REFRIG_GASES, required: true },
    { name: 'gwp', label: 'Gas GWP', type: 'text', required: false, readOnly: true },
    { name: 'inventory_change', label: 'Inventory Change (kg)', type: 'number', required: true },
    { name: 'transferred_amount', label: 'Transferred Amount (kg)', type: 'number', required: true },
    { name: 'capacity_change', label: 'Capacity Change (kg)', type: 'number', required: true },
  ],
  refrigeration_ac_simplified_material_balance: [
    { name: 'refrigerant_type', label: 'Gas', type: 'select', options: REFRIG_GASES, required: true },
    { name: 'gwp', label: 'Gas GWP', type: 'text', required: false, readOnly: true },
    { name: 'new_units_charge', label: 'New Units Charge (kg)', type: 'number', required: true },
    { name: 'new_units_capacity', label: 'New Units Capacity (kg)', type: 'number', required: true },
    { name: 'existing_units_recharge', label: 'Existing Units Recharge (kg)', type: 'number', required: true },
    { name: 'disposed_units_capacity', label: 'Disposed Units Capacity (kg)', type: 'number', required: true },
    { name: 'disposed_units_recovered', label: 'Disposed Units Recovered (kg)', type: 'number', required: true },
  ],
  refrigeration_ac_screening_method: [
    { name: 'source_id', label: 'Source ID', type: 'text', required: true },
    { name: 'equipment_type', label: 'Type of Equipment', type: 'select', options: REFRIG_EQUIPMENT_TYPES, required: true },
    { name: 'refrigerant_type', label: 'Gas', type: 'select', options: REFRIG_GASES, required: true },
    { name: 'gwp', label: 'Gas GWP', type: 'text', required: false, readOnly: true },
    { name: 'new_units_charge', label: 'New Units Charge (kg)', type: 'number', required: true },
    { name: 'operating_units_capacity', label: 'Operating Units Capacity (kg)', type: 'number', required: true },
    { name: 'disposed_units_capacity', label: 'Disposed Units Capacity (kg)', type: 'number', required: true },
    { name: 'months_in_operation', label: 'Months in Operation', type: 'number', required: false, default: 12 },
  ],
  fire_suppression: [
    { name: 'facility_description', label: 'Facility Description', type: 'text', required: false },
    { name: 'equipment_type', label: 'Equipment Type', type: 'select', options: ['Fixed', 'Portable'], required: false },
    { name: 'suppressant_type', label: 'Suppressant Type', type: 'select', options: [
      'Carbon dioxide', 'HFC-23', 'HFC-125', 'HFC-227ea', 'PFC-14', 'PFC-31-10'
    ], required: true },
    { name: 'amount_used', label: 'Amount Used', type: 'number', required: true },
    { name: 'amount_units', label: 'Units', type: 'select', options: ['kg', 'lb'], required: true },
  ],
  fire_suppression_material_balance: [
    { name: 'suppressant_type', label: 'Gas', type: 'select', options: FIRE_SUPPRESSION_GASES, required: true },
    { name: 'gwp', label: 'Gas GWP', type: 'text', required: false, readOnly: true },
    { name: 'inventory_change_lb', label: 'Inventory Change (lb)', type: 'number', required: true },
    { name: 'transferred_amount_lb', label: 'Transferred Amount (lb)', type: 'number', required: true },
    { name: 'capacity_change_lb', label: 'Capacity Change (lb)', type: 'number', required: true },
  ],
  fire_suppression_simplified_material_balance: [
    { name: 'suppressant_type', label: 'Gas', type: 'select', options: FIRE_SUPPRESSION_GASES, required: true },
    { name: 'gwp', label: 'Gas GWP', type: 'text', required: false, readOnly: true },
    { name: 'new_units_charge_lb', label: 'New Units - Charge (lb)', type: 'number', required: false },
    { name: 'new_units_capacity_lb', label: 'New Units - Capacity (lb)', type: 'number', required: false },
    { name: 'existing_units_recharge_lb', label: 'Existing Units - Recharge (lb)', type: 'number', required: false },
    { name: 'disposed_units_capacity_lb', label: 'Disposed Units - Capacity (lb)', type: 'number', required: false },
    { name: 'disposed_units_recovered_lb', label: 'Disposed Units - Recovered (lb)', type: 'number', required: false },
  ],
  fire_suppression_screening_method: [
    { name: 'source_id', label: 'Source ID', type: 'text', required: false },
    { name: 'equipment_type', label: 'Equipment Type (Fixed/Portable)', type: 'select', options: ['Fixed', 'Portable'], required: true },
    { name: 'suppressant_type', label: 'Gas Type', type: 'select', options: FIRE_SUPPRESSION_GASES, required: true },
    { name: 'gwp', label: 'Gas GWP', type: 'text', required: false, readOnly: true },
    { name: 'unit_capacity_lb', label: 'Unit Capacity (lb)', type: 'number', required: true },
  ],
  purchased_gases: [
    {
      name: 'gas_type',
      label: 'Gas Type',
      type: 'select',
      options: [
        'Carbon dioxide',
        'Methane',
        'Nitrous oxide',
        'HFC-23',
        'HFC-32',
        'HFC-41',
        'HFC-125',
        'HFC-134',
        'HFC-134a',
        'HFC-143',
        'HFC-143a',
        'HFC-152',
        'HFC-152a',
        'HFC-161',
        'HFC-227ea',
        'HFC-236cb',
        'HFC-236ea',
        'HFC-236fa',
        'HFC-245ca',
        'HFC-245fa',
        'HFC-365mfc',
        'HFC-43-10mee',
        'Sulfur hexafluoride',
        'Nitrogen trifluoride',
        'PFC-14',
        'PFC-116',
        'PFC-218',
        'PFC-318',
        'PFC-31-10',
        'PFC-41-12',
        'PFC-51-14',
        'PFC-91-18'
      ],
      required: true
    },
    {
      name: 'amount_purchased',
      label: 'Amount Purchased (lb)',
      type: 'number',
      required: true
    },
    {
      name: 'gwp',
      label: 'GWP',
      type: 'number',
      required: false,
      readOnly: true
    },
    {
      name: 'co2e',
      label: 'CO2 Equivalent (lb)',
      type: 'number',
      required: false,
      readOnly: true
    }
  ],
  electricity: [
    { name: 'source_id', label: 'Source ID', type: 'text', required: true },
    { name: 'source_description', label: 'Source Description', type: 'text', required: false },
    { name: 'source_area_sqft', label: 'Facility Area (sq. ft.)', type: 'number', required: false },
    { name: 'facility_location', label: 'eGRID Subregion', type: 'select', options: [
      'ASCC Alaska Grid', 'ASCC Miscellaneous', 'WECC Southwest', 'WECC California', 'ERCOT All', 'FRCC All',
      'HICC Miscellaneous', 'HICC Oahu', 'MRO East', 'MRO West', 'NPCC New England', 'WECC Northwest',
      'NPCC NYC/Westchester', 'NPCC Long Island', 'NPCC Upstate NY', 'Puerto Rico Miscellaneous',
      'RFC East', 'RFC Michigan', 'RFC West', 'WECC Rockies', 'SPP North', 'SPP South',
      'SERC Mississippi Valley', 'SERC Midwest', 'SERC South', 'SERC Tennessee Valley', 'SERC Virginia/Carolina', 'US Average'
    ], required: true },
    { name: 'kwh_purchased', label: 'Electricity Purchased (kWh)', type: 'number', required: true },
    { name: 'market_based_co2_factor', label: 'Market-Based CO2 Factor (lb/MWh)', type: 'number', required: false },
    { name: 'market_based_ch4_factor', label: 'Market-Based CH4 Factor (lb/MWh)', type: 'number', required: false },
    { name: 'market_based_n2o_factor', label: 'Market-Based N2O Factor (lb/MWh)', type: 'number', required: false },
  ],
  steam: [
    { name: 'source_id', label: 'Source ID', type: 'text', required: true },
    { name: 'source_description', label: 'Source Description', type: 'text', required: false },
    { name: 'source_area_sqft', label: 'Area (sq. ft.)', type: 'number', required: false },
    { name: 'fuel_type', label: 'Fuel Type', type: 'select', options: [
      'Natural Gas', 'Distillate Fuel Oil No. 2', 'Residual Fuel Oil No. 6', 'Kerosene', 
      'Liquefied Petroleum Gases (LPG)', 'Anthracite Coal', 'Bituminous Coal', 
      'Sub-bituminous Coal', 'Lignite Coal', 'Mixed (Electric Power Sector)', 'Coal Coke', 
      'Wood and Wood Residuals', 'Landfill Gas'
    ], required: true },
    { name: 'boiler_efficiency', label: 'Boiler Efficiency (%)', type: 'number', required: false, default: 80 },
    { name: 'amount_purchased', label: 'Steam Purchased (MMBtu)', type: 'number', required: true },
    { name: 'location_based_co2_factor', label: 'Location-Based CO2 Factor (kg/MMBtu)', type: 'number', required: false },
    { name: 'location_based_ch4_factor', label: 'Location-Based CH4 Factor (g/MMBtu)', type: 'number', required: false },
    { name: 'location_based_n2o_factor', label: 'Location-Based N2O Factor (g/MMBtu)', type: 'number', required: false },
    { name: 'market_based_co2_factor', label: 'Market-Based CO2 Factor (kg/MMBtu)', type: 'number', required: false },
    { name: 'market_based_ch4_factor', label: 'Market-Based CH4 Factor (g/MMBtu)', type: 'number', required: false },
    { name: 'market_based_n2o_factor', label: 'Market-Based N2O Factor (g/MMBtu)', type: 'number', required: false },
  ],
  business_travel_personal_car: [
    { name: 'source_id', label: 'Source ID', type: 'text', required: false },
    { name: 'source_description', label: 'Source Description', type: 'text', required: false },
    { name: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: BT_ROAD_TYPES, required: true },
    { name: 'miles_traveled', label: 'Vehicle-Miles (miles)', type: 'number', required: true },
  ],
  business_travel_rail_bus: [
    { name: 'source_id', label: 'Source ID', type: 'text', required: false },
    { name: 'source_description', label: 'Source Description', type: 'text', required: false },
    { name: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: BT_RAIL_TYPES, required: true },
    { name: 'miles_traveled', label: 'Passenger-Miles (miles)', type: 'number', required: true },
  ],
  business_travel_air: [
    { name: 'source_id', label: 'Source ID', type: 'text', required: false },
    { name: 'source_description', label: 'Source Description', type: 'text', required: false },
    { name: 'vehicle_type', label: 'Flight Length', type: 'select', options: BT_AIR_TYPES, required: true },
    { name: 'miles_traveled', label: 'Passenger-Miles (miles)', type: 'number', required: true },
  ],
  employee_commuting_personal_car: [
    { name: 'source_id', label: 'Source ID', type: 'text', required: false },
    { name: 'source_description', label: 'Source Description', type: 'text', required: false },
    { name: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: EC_ROAD_TYPES, required: true },
    { name: 'miles_traveled', label: 'Vehicle-Miles (miles)', type: 'number', required: true },
  ],
  employee_commuting_public_transport: [
    { name: 'source_id', label: 'Source ID', type: 'text', required: false },
    { name: 'source_description', label: 'Source Description', type: 'text', required: false },
    { name: 'vehicle_type', label: 'Transport Type', type: 'select', options: EC_PUBLIC_TYPES, required: true },
    { name: 'miles_traveled', label: 'Passenger-Miles (miles)', type: 'number', required: true },
  ],
  business_travel_hotel: [
    { name: 'hotel_name', label: 'Hotel Name', type: 'text', required: false },
    { name: 'city_country', label: 'City/Country', type: 'text', required: false },
    { name: 'hotel_category', label: 'Hotel Category', type: 'text', required: false },
    { name: 'num_nights', label: 'Number of Nights', type: 'number', required: true },
    { name: 'num_rooms', label: 'Number of Rooms', type: 'number', required: false, default: 1 },
  ],
  commuting: [
    { name: 'commute_mode', label: 'Commute Mode', type: 'select', options: [
      'Passenger Car', 'Light-Duty Truck', 'Motorcycle', 'Bus', 'Intercity Rail', 'Commuter Rail', 'Car (solo)', 'Car (shared)', 'Public Transport', 'Bicycle', 'Walking', 'Other'
    ], required: true },
    { name: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: [
      'Passenger Cars - Gasoline', 'Light-Duty Trucks - Gasoline', 'Heavy-Duty Vehicles - Gasoline', 'Motorcycles - Gasoline',
      'Passenger Cars - Diesel', 'Light-Duty Trucks - Diesel', 'Medium- and Heavy-Duty Vehicles - Diesel',
      'Light-Duty Cars - Methanol', 'Light-Duty Cars - Ethanol', 'Light-Duty Cars - CNG', 'Light-Duty Cars - LPG', 'Light-Duty Cars - Biodiesel',
      'Light-Duty Trucks - Ethanol', 'Light-Duty Trucks - CNG', 'Light-Duty Trucks - LPG', 'Light-Duty Trucks - LNG', 'Light-Duty Trucks - Biodiesel',
      'Medium-Duty Trucks - CNG', 'Medium-Duty Trucks - LPG', 'Medium-Duty Trucks - LNG', 'Medium-Duty Trucks - Biodiesel',
      'Heavy-Duty Trucks - Methanol', 'Heavy-Duty Trucks - Ethanol', 'Heavy-Duty Trucks - CNG', 'Heavy-Duty Trucks - LPG', 'Heavy-Duty Trucks - LNG', 'Heavy-Duty Trucks - Biodiesel',
      'Buses - Methanol', 'Buses - Ethanol', 'Buses - CNG', 'Buses - LPG', 'Buses - LNG', 'Buses - Biodiesel',
      'Ships and Boats - Residual Fuel Oil', 'Ships and Boats - Gasoline (2 stroke)', 'Ships and Boats - Gasoline (4 stroke)', 'Ships and Boats - Diesel',
      'Locomotives - Diesel', 'Aircraft - Jet Fuel', 'Aircraft - Aviation Gasoline',
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
    ], required: false },
    { name: 'distance_per_trip_km', label: 'Distance Per Trip (km)', type: 'number', required: false },
    { name: 'commute_days_per_year', label: 'Commute Days Per Year', type: 'number', required: false },
    { name: 'num_commuters', label: 'Number of Commuters', type: 'number', required: false, default: 1 },
  ],
  upstream_trans_dist_vehicle_miles: [
    { name: 'source_id', label: 'Source ID', type: 'text', required: false },
    { name: 'source_description', label: 'Source Description', type: 'text', required: false },
    { name: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: UPSTREAM_VEHICLE_MILES_TYPES, required: true },
    { name: 'vehicle_miles', label: 'Vehicle-Miles', type: 'number', required: true },
    // Unit is implicitly vehicle-mile, but we can display it if needed or just use number
  ],
  upstream_trans_dist_ton_miles: [
    { name: 'source_id', label: 'Source ID', type: 'text', required: false },
    { name: 'source_description', label: 'Source Description', type: 'text', required: false },
    { name: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: UPSTREAM_TON_MILES_TYPES, required: true },
    { name: 'short_ton_miles', label: 'Short Ton-Miles', type: 'number', required: true },
  ],
  waste: [
    { name: 'source_id', label: 'Source ID', type: 'text', required: false },
    { name: 'source_description', label: 'Source Description', type: 'text', required: false },
    { name: 'waste_type', label: 'Waste Material', type: 'select', options: WASTE_MATERIALS, required: true },
    { name: 'disposal_method', label: 'Disposal Method', type: 'select', options: DISPOSAL_METHODS, required: true },
    { name: 'amount', label: 'Weight', type: 'number', required: true },
    { name: 'units', label: 'Unit', type: 'select', options: ['short ton', 'lb', 'kg', 'metric ton'], required: true },
  ],

  offsets: [
    { name: 'source_id', label: 'ID', type: 'text', required: true },
    { name: 'offset_description', label: 'Project Description', type: 'text', required: true },
    { name: 'scope_category', label: 'Offset Scope/Category', type: 'select', options: OFFSET_SCOPE_CATEGORIES, required: true },
    { name: 'amount_mtco2e', label: 'Offsets Purchased (Metric Tons CO₂e)', type: 'number', required: true },
  ],

};

// ... (existing imports moved or kept)
// Ensure apiClient is imported if not already, or add it to the top.




const AddActivityPage = () => {
  const { t } = useTranslation();
  const { activityType, activityId } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { user } = useAuth();
  
  console.log('AddActivityPage - activityType:', activityType, 'activityId:', activityId);
  
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activePeriodId, setActivePeriodId] = useState(null);
  const [reportingPeriods, setReportingPeriods] = useState([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);

  const normalizedActivityType = activityType?.replace(/-/g, '_');
  const formFields = FORM_FIELDS[normalizedActivityType] || FORM_FIELDS.stationary_combustion;
  // Previously complex logic for refrigeration AC is now handled by standard FORM_FIELDS mapping above


  // Helper: Only enable vehicle type dropdown if On-Road or Non-Road is selected
  const isVehicleTypeDisabled = !formData.on_road_or_non_road;

  // Helper: Get vehicle type options based on road type
  const getVehicleTypeOptions = () => {
    if (formData.on_road_or_non_road === 'On-Road') return ON_ROAD_VEHICLE_TYPES;
    if (formData.on_road_or_non_road === 'Non-Road') return NON_ROAD_VEHICLE_TYPES;
    return [];
  };

  useEffect(() => {
    const isEdit = !!activityId;
    setIsEditMode(isEdit);

    const urlPeriodId = new URLSearchParams(window.location.search).get('periodId');
    
    const initializeData = async () => {
      if (user?.companyId) {
        await fetchReportingPeriods(urlPeriodId);
      }
    };

    initializeData();
    
    if (isEdit) {
      // Load existing activity data
      loadActivity();
    } else {
      // Initialize form with default values
      const initialData = {};
      formFields.forEach(field => {
        initialData[field.name] = field.default || '';
      });
      setFormData(initialData);
      
      // key defaults
      // No calculation_method in frontend; backend will infer
      // No calculation method for electricity; both are calculated on backend per Excel logic
    }
  }, [activityType, activityId, user?.companyId]);

  const fetchReportingPeriods = async (urlPeriodId) => {
    setLoadingPeriods(true);
    try {
      const response = await apiClient.get(`/companies/${user.companyId}/reporting-periods`);
      const periods = response.data.reportingPeriods || [];
      setReportingPeriods(periods);
      
      if (periods.length > 0) {
        // Sort by start date desc
        periods.sort((a, b) => new Date(b.period_start_date) - new Date(a.period_start_date));
        
        // Priority: 1. URL parameter | 2. First period (latest)
        if (urlPeriodId) {
          setActivePeriodId(urlPeriodId);
        } else {
          setActivePeriodId(periods[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch reporting periods', err);
      error('Failed to load reporting periods');
    } finally {
      setLoadingPeriods(false);
    }
  };

  const loadActivity = async () => {
    setLoading(true);
    try {
      const data = await activitiesAPI.getActivity(user.companyId, activityType, activityId);
      setFormData(data.activity || data);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to load activity');
      navigate('/reporting-periods');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Purchased Gases: Auto-fill GWP and CO2e
    if (normalizedActivityType === 'purchased_gases') {
      if (name === 'gas_type') {
        const gwp = GWP_MAP[value] || '';
        setFormData(prev => {
          const amount = prev.amount_purchased;
          const co2e = (amount && gwp) ? (parseFloat(amount) * parseFloat(gwp)).toFixed(2) : '';
          return {
            ...prev,
            gas_type: value,
            gwp,
            co2e
          };
        });
        return;
      }
      if (name === 'amount_purchased') {
        setFormData(prev => {
          const gwp = prev.gwp;
          const co2e = (value && gwp) ? (parseFloat(value) * parseFloat(gwp)).toFixed(2) : '';
          return {
            ...prev,
            amount_purchased: value,
            co2e
          };
        });
        return;
      }
    }



    // Auto-fill logic for Stationary Combustion
    if (name === 'fuel_combusted' && normalizedActivityType === 'stationary_combustion') {
      const fuelState = getFuelState(value);
      const validUnits = getValidUnits(value);
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        fuel_state: fuelState,
        // Reset units if current unit is not valid for new fuel type
        units: validUnits.includes(prev.units) ? prev.units : validUnits[0]
      }));
    } 
    // Auto-fill logic for Mobile Sources
    else if (name === 'vehicle_type' && normalizedActivityType === 'mobile_sources') {
      const validUnits = getMobileUnits(value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        units: validUnits[0] // Always set to the only valid unit for this vehicle type
      }));
    }
    // If On-Road/Non-Road changes, reset vehicle_type and units
    else if (name === 'on_road_or_non_road' && normalizedActivityType === 'mobile_sources') {
      setFormData(prev => ({
        ...prev,
        on_road_or_non_road: value,
        vehicle_type: '',
        units: ''
      }));
    }
    // Auto-fill logic for Waste
    else if (name === 'waste_type' && normalizedActivityType === 'waste') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        disposal_method: '' // Reset disposal method
      }));
    }
    // Auto-fill logic for Refrigeration & AC GWP
    else if (name === 'refrigerant_type' && normalizedActivityType.startsWith('refrigeration_ac')) {
      const gwp = GWP_MAP[value] || '';
      setFormData(prev => ({
        ...prev,
        [name]: value,
        gwp: gwp
      }));
    }
    // Auto-fill logic for Fire Suppression GWP
    else if (name === 'suppressant_type' && normalizedActivityType.startsWith('fire_suppression')) {
      const gwp = GWP_MAP[value] || '';
      setFormData(prev => ({
        ...prev,
        [name]: value,
        gwp: gwp
      }));
    }
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const missingFields = formFields
      .filter(field => field.required && !formData[field.name])
      .map(field => field.label);

    if (missingFields.length > 0) {
      error(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);

    try {
      const normalizedActivityType = activityType.replace(/-/g, '_');
      
      // Get reporting period ID from state (URL or fetched)
      // If editing, we might not strictly need it if the backend handles it, but safer to include.
      // If creating, it is MANDATORY.
      
      const reportingPeriodId = activePeriodId;

      if (!reportingPeriodId && !isEditMode) {
        error('Reporting period ID is required. Please ensure a reporting period exists.');
        setLoading(false);
        return;
      }

      // Filter out virtual/computed fields that don't exist in database
      const { co2e_kg, calculation_result, ...cleanFormData } = formData;
      
      // Remove gwp and co2e (frontend display helpers for purchased_gases)
      if (normalizedActivityType === 'purchased_gases') {
        delete cleanFormData.gwp;
        delete cleanFormData.co2e;
      }
      // calculation_method and fuel_type are set in backend only for mobile_sources
      if (normalizedActivityType === 'mobile_sources') {
        delete cleanFormData.calculation_method;
        delete cleanFormData.fuel_type;
      }


      const payload = {
        ...cleanFormData,
        reportingPeriodId,
        reporting_period_id: reportingPeriodId,
      };
      
      if (isEditMode) {
        await activitiesAPI.updateActivity(user.companyId, normalizedActivityType, activityId, payload);
        success(t('activities.updateSuccess'));
      } else {
        await activitiesAPI.createActivity(user.companyId, activityType, payload);
        success(t('activities.createSuccess'));
      }
      if (activePeriodId) {
        // Redirect back to the specific activity type list
        navigate(`/reports/${activePeriodId}/activities/${activityType.replace(/-/g, '_')}`);
      } else {
        navigate(`/activities`);
      }
    } catch (err) {
      error(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} activity`);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    // Tooltips and help text for improved UX
    const helpTexts = {
      offset_description: 'Describe the offset project and its impact.',
      offset_type: 'Select the type of offset project.',
      amount_mtco2e: 'Enter the amount of CO₂e offset in metric tons.',
      certification_standard: 'Choose the certification standard for this offset.',
      retirement_date: 'Date when the carbon credit was retired.'
    };
    // For mobile_sources, restrict units dropdown to only the valid unit for the selected vehicle type
    if (normalizedActivityType === 'mobile_sources' && field.name === 'units') {
      const validUnits = getMobileUnits(formData.vehicle_type);
      return (
        <select
          name={field.name}
          value={formData[field.name] || validUnits[0]}
          onChange={handleChange}
          required={field.required}
          className="w-full px-4 py-2 bg-midnight-navy border border-carbon-gray rounded-lg text-off-white focus:outline-none focus:border-cyan-mist"
        >
          {validUnits.map(unit => (
            <option key={unit} value={unit}>{unit}</option>
          ))}
        </select>
      );
    }
    // Special handling for mobile_sources vehicle_type dropdown
    if (field.name === 'vehicle_type' && normalizedActivityType === 'mobile_sources') {
      return (
        <select
          name={field.name}
          value={formData[field.name] || ''}
          onChange={handleChange}
          required={field.required}
          className="w-full px-4 py-2 bg-midnight-navy border border-carbon-gray rounded-lg text-off-white focus:outline-none focus:border-cyan-mist"
          disabled={isVehicleTypeDisabled}
        >
          <option value="">Select Vehicle Type</option>
          {getVehicleTypeOptions().map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    // End special handling
    switch (field.type) {
      case 'textarea':
        return (
          <>
            <textarea
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              required={field.required}
              rows={4}
              className="w-full px-4 py-2 bg-midnight-navy border border-carbon-gray rounded-lg text-off-white focus:outline-none focus:border-cyan-mist"
              placeholder={field.label}
            />
            {helpTexts[field.name] && (
              <p className="text-xs text-stone-gray mt-1">{helpTexts[field.name]}</p>
            )}
          </>
        );
      case 'select':
        return (
          <>
            <select
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              required={field.required}
              className="w-full px-4 py-2 bg-midnight-navy border border-carbon-gray rounded-lg text-off-white focus:outline-none focus:border-cyan-mist"
            >
              <option value="">Select {field.label}</option>
              {(field.name === 'units' && normalizedActivityType === 'mobile_sources'
                ? getMobileUnits(formData.vehicle_type)
                : (field.name === 'units' && normalizedActivityType === 'stationary_combustion'
                  ? getValidUnits(formData.fuel_combusted || '')
                  : (field.name === 'disposal_method' && normalizedActivityType === 'waste'
                    ? (WASTE_METHOD_MAP[formData.waste_type] || [])
                    : field.options)
                )
              ).map(opt => {
                if (typeof opt === 'object' && opt !== null && 'value' in opt && 'label' in opt) {
                  return <option key={opt.value} value={opt.value}>{opt.label}</option>;
                } else {
                  return <option key={opt} value={opt}>{opt}</option>;
                }
              })}
            </select>
            {helpTexts[field.name] && (
              <p className="text-xs text-stone-gray mt-1">{helpTexts[field.name]}</p>
            )}
          </>
        );
      case 'date':
        return (
          <>
            <input
              type="date"
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              required={field.required}
              className="w-full px-4 py-2 bg-midnight-navy border border-carbon-gray rounded-lg text-off-white focus:outline-none focus:border-cyan-mist"
              placeholder={field.label}
            />
            {helpTexts[field.name] && (
              <p className="text-xs text-stone-gray mt-1">{helpTexts[field.name]}</p>
            )}
          </>
        );
      default:
        // For stationary_combustion, make fuel_state always readOnly and visible
        if (field.name === 'fuel_state' && normalizedActivityType === 'stationary_combustion') {
          return (
            <input
              type="text"
              name={field.name}
              value={formData[field.name] || ''}
              readOnly
              className="w-full px-4 py-2 bg-gray-800 text-gray-400 border border-carbon-gray rounded-lg"
              placeholder={field.label}
            />
          );
        }
        return (
          <>
            <input
              type={field.type}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              required={field.required}
              readOnly={field.readOnly}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${
                field.readOnly 
                  ? 'bg-gray-800 text-gray-400 border-carbon-gray cursor-not-allowed' 
                  : 'bg-midnight-navy border-carbon-gray text-off-white focus:border-cyan-mist'
              }`}
              placeholder={field.label}
            />
            {helpTexts[field.name] && (
              <p className="text-xs text-stone-gray mt-1">{helpTexts[field.name]}</p>
            )}
          </>
        );
    }
  };

  const [searchParams] = useSearchParams();

  const handleReturn = () => {
    if (activePeriodId && activityType) {
      // Go back to the specific activity type list
      navigate(`/reports/${activePeriodId}/activities/${activityType.replace(/-/g, '_')}`);
    } else if (activePeriodId) {
      // Fallback to checklist
      navigate(`/reports/${activePeriodId}/activities`);
    } else {
      navigate('/reporting-periods');
    }
  };

  return (
    <div className="min-h-screen bg-midnight-navy text-white p-6 sm:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Modern Header */}
        <div className="flex items-center gap-6 mb-10">
           <button
              onClick={handleReturn}
              className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-cyan-mist transition-all group"
              title="Back"
           >
              <ArrowLeftIcon className="h-6 w-6 text-cyan-mist group-hover:scale-110 transition-transform" />
           </button>
           <div>
             <div className="flex items-center gap-2 mb-1">
                <SparklesIcon className="h-4 w-4 text-cyan-mist opacity-60" />
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-cyan-mist opacity-80">
                  {isEditMode ? 'Record Amendment' : 'New Environmental Entry'}
                </span>
             </div>
             <h1 className="text-4xl font-bold tracking-tight">
               {normalizedActivityType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
             </h1>
           </div>
        </div>

        {/* Enhanced Form Container */}
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
          {/* Section: Period & Context - Read Only */}
          {!isEditMode && (
             <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 shadow-xl">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                   <div className="w-6 h-px bg-gray-600"></div>
                   Reporting Context
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-3 ml-1">
                      Target Audit Period
                    </label>
                    {loadingPeriods ? (
                      <div className="h-14 w-full bg-white/5 animate-pulse rounded-2xl"></div>
                    ) : activePeriodId ? (
                      // Show selected period as a read-only styled card
                      <div className="w-full px-5 py-4 bg-midnight-navy border border-cyan-mist/30 rounded-2xl flex items-center gap-3">
                        <div className="w-8 h-8 bg-cyan-mist/20 rounded-lg flex items-center justify-center">
                          <span className="text-cyan-mist text-sm font-bold">R</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">
                            {reportingPeriods.find(p => p.id === activePeriodId)?.period_label || 'Selected Period'}
                          </p>
                          <p className="text-xs text-stone-gray">
                            {(() => {
                              const period = reportingPeriods.find(p => p.id === activePeriodId);
                              if (period) {
                                return `${new Date(period.period_start_date).toLocaleDateString()} - ${new Date(period.period_end_date).toLocaleDateString()}`;
                              }
                              return '';
                            })()}
                          </p>
                        </div>
                        <span className="text-[10px] text-stone-gray uppercase tracking-wider">Auto-assigned</span>
                      </div>
                    ) : (
                      // Error state - no period context
                      <div className="w-full px-5 py-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
                        ⚠️ No reporting period specified. Please navigate from Active Reports to add activities.
                      </div>
                    )}
                  </div>
                </div>
             </div>
          )}

          {/* Section: Activity Data */}
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-10 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-mist/5 rounded-full -translate-y-16 translate-x-16 blur-3xl"></div>
             
             <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                <div className="w-6 h-px bg-gray-600"></div>
                Primary Metric Data
             </h3>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
               {formFields.map(field => (
                 <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                   <label className="block text-sm font-bold text-gray-300 mb-3 ml-1">
                     {field.label} {field.required && <span className="text-cyan-mist">*</span>}
                   </label>
                   <div className="relative group">
                     {renderField({
                       ...field,
                       className: `w-full px-5 py-4 bg-midnight-navy border border-white/5 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-mist focus:border-transparent transition-all hover:border-white/20 ${field.className || ''}`
                     })}
                   </div>
                 </div>
               ))}
             </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-6 pt-6">
            <button
              type="button"
              onClick={handleReturn}
              className="px-8 py-4 text-stone-gray font-bold hover:text-white transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-4 bg-cyan-mist text-midnight-navy font-black rounded-2xl hover:bg-growth-green transition-all shadow-xl hover:shadow-cyan-mist/20 active:scale-95 disabled:opacity-50 flex items-center gap-3"
            >
              {loading ? (
                 <div className="w-5 h-5 border-2 border-midnight-navy border-t-transparent rounded-full animate-spin"></div>
              ) : (
                 <CheckCircleIcon className="h-5 w-5" />
              )}
              {loading ? t('common.saving') : isEditMode ? 'Commit Changes' : 'Persist Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddActivityPage;
