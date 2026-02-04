import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DataTable from '../components/common/DataTable';
import { useToast } from '../components/common/Toast';
import { activitiesAPI } from '../api/activitiesAPI';
import { boundariesAPI } from '../api/boundariesAPI';
import { useAuth } from "../contexts/AuthContext";
import { TableCellsIcon } from '@heroicons/react/24/solid';

const ACTIVITY_TYPES = [
  { key: 'stationary_combustion', label: 'Stationary Combustion' },
  { key: 'mobile_sources', label: 'Mobile Sources' },
  { key: 'refrigeration_ac_material_balance', label: 'Refrigeration & AC (Material Balance)' },
  { key: 'refrigeration_ac_simplified_material_balance', label: 'Refrigeration & AC (Simplified)' },
  { key: 'refrigeration_ac_screening_method', label: 'Refrigeration & AC (Screening)' },
  { key: 'fire_suppression_material_balance', label: 'Fire Suppression (Material Balance)' },
  { key: 'fire_suppression_simplified_material_balance', label: 'Fire Suppression (Simplified)' },
  { key: 'fire_suppression_screening_method', label: 'Fire Suppression (Screening)' },
  { key: 'purchased_gases', label: 'Purchased Gases' },
  { key: 'electricity', label: 'Electricity' },
  { key: 'steam', label: 'Steam' },
  { key: 'business_travel_personal_car', label: 'Business Travel - Personal Vehicle' },
  { key: 'business_travel_rail_bus', label: 'Business Travel - Rail or Bus' },
  { key: 'business_travel_air', label: 'Business Travel - Air' },
  { key: 'employee_commuting_personal_car', label: 'Employee Commuting - Personal Vehicle' },
  { key: 'employee_commuting_public_transport', label: 'Employee Commuting - Public Transport' },
  { key: 'upstream_trans_dist_vehicle_miles', label: 'Upstream Trans & Dist - Vehicle-Miles' },
  { key: 'upstream_trans_dist_ton_miles', label: 'Upstream Trans & Dist - Ton-Miles' },
  { key: 'waste', label: 'Waste Generated in Operations' },
  { key: 'offsets', label: 'Carbon Offsets' },
];

const ActivitiesListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { success, error } = useToast();
  const { periodId, activityType: urlActivityType } = useParams();
  const normalizedUrlType = urlActivityType?.replace(/-/g, '_');
  const [selectedType, setSelectedType] = useState(normalizedUrlType || 'stationary_combustion');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [availableActivityTypes, setAvailableActivityTypes] = useState(ACTIVITY_TYPES);

  // Defensive: ensure hasPermission is always a function (for hot reloads or legacy context)
  const safeHasPermission = typeof hasPermission === 'function' ? hasPermission : () => true;
  const canEdit = safeHasPermission('activities.edit');
  const canDelete = safeHasPermission('activities.delete');

  const fetchActivities = async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const data = await activitiesAPI.listActivities(user.companyId, selectedType, {
        sortBy,
        sortOrder,
        reportingPeriodId: periodId
      });
      setActivities(data.activities || data || []);
    } catch (err) {
      console.error(err);
      error(t('activities.fetchError', 'Failed to fetch activities'));
    } finally {
      setLoading(false);
    }
  };

  // Fetch enabled activity types based on boundary answers
  useEffect(() => {
    const fetchEnabledActivityTypes = async () => {
      if (!user?.companyId) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/boundaries/enabled-activity-types/${user.companyId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const enabledTypes = data.enabledActivityTypes || [];
          
          // Filter ACTIVITY_TYPES to only show enabled ones
          if (enabledTypes.length > 0) {
            const filtered = ACTIVITY_TYPES.filter(type => enabledTypes.includes(type.key));
            setAvailableActivityTypes(filtered);
            
            // If current selected type is not enabled, switch to first enabled type
            if (!enabledTypes.includes(selectedType) && filtered.length > 0) {
              setSelectedType(filtered[0].key);
            }
          } else {
            // No boundary answers yet, show all types
            setAvailableActivityTypes(ACTIVITY_TYPES);
          }
        } else {
          console.error('[ActivitiesListPage] Failed to fetch, status:', response.status);
          const errorText = await response.text();
          console.error('[ActivitiesListPage] Error response:', errorText);
        }
      } catch (err) {
        console.error('[ActivitiesListPage] Failed to fetch enabled activity types:', err);
        // On error, show all types
        setAvailableActivityTypes(ACTIVITY_TYPES);
      }
    };
    
    fetchEnabledActivityTypes();
  }, [user?.companyId]); // Only fetch on mount or if company changes

  // Sync selectedType with URL if it changes
  useEffect(() => {
    if (urlActivityType) {
      setSelectedType(urlActivityType.replace(/-/g, '_'));
    }
  }, [urlActivityType]);

  useEffect(() => {
    fetchActivities();
  }, [user.companyId, selectedType, sortBy, sortOrder]);

  let columns;
  if (selectedType === 'stationary_combustion') {
    columns = [
      {
        key: 'reporting_period',
        header: t('activities.reportingPeriod', 'Reporting Period'),
        accessor: (row) => row.reporting_period_label || row.reporting_period || '-',
      },
      {
        key: 'source_id',
        header: t('activities.sourceId', 'Source ID'),
        accessor: (row) => row.source_id || '-',
      },
      {
        key: 'source_description',
        header: t('activities.sourceDescription', 'Source Description'),
        accessor: (row) => row.source_description || '-',
      },
      {
        key: 'fuel_combusted',
        header: t('activities.fuelCombusted', 'Fuel Combusted'),
        accessor: (row) => row.fuel_combusted || '-',
      },
      {
        key: 'fuel_state',
        header: t('activities.fuelState', 'Fuel State'),
        accessor: (row) => row.fuel_state || '-',
      },
      {
        key: 'quantity_combusted',
        header: t('activities.quantityCombusted', 'Quantity Combusted'),
        accessor: (row) => row.quantity_combusted || '-',
      },
      {
        key: 'units',
        header: t('activities.units', 'Units'),
        accessor: (row) => row.units || '-',
      },
      {
        key: 'emissions',
        header: t('activities.emissions', 'Emissions (MT CO₂e)'),
        accessor: (row) => {
          // co2e_kg is the standard emissions column in all activity tables
          // Convert to metric tons (MT)
          const emissions = parseFloat(row.co2e_kg);
          return !isNaN(emissions) && emissions > 0 ? `${(emissions / 1000).toFixed(4)} MT CO₂e` : '-';
        },
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (row) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/activities/${selectedType}/${row.id}${periodId ? `?periodId=${periodId}` : ''}`);
              }}
              className="text-compliance-blue hover:text-cyan-mist transition-colors"
            >
              {t('common.view')}
            </button>
            {canEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/activities/${selectedType}/${row.id}/edit${periodId ? `?periodId=${periodId}` : ''}`);
                }}
                className="text-cyan-mist hover:text-growth-green transition-colors"
              >
                {t('common.edit')}
              </button>
            )}
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(row.id);
                }}
                className="text-red-500 hover:text-red-400 transition-colors"
              >
                {t('common.delete')}
              </button>
            )}
          </div>
        ),
      },
    ];
  } else if (selectedType === 'mobile_sources') {
    columns = [
      {
        key: 'reporting_period',
        header: t('activities.reportingPeriod', 'Reporting Period'),
        accessor: (row) => row.reporting_period_label || row.reporting_period || '-',
      },
      {
        key: 'source_id',
        header: t('activities.sourceId', 'Source ID'),
        accessor: (row) => row.source_id || '-',
      },
      {
        key: 'source_description',
        header: t('activities.sourceDescription', 'Source Description'),
        accessor: (row) => row.source_description || '-',
      },
      {
        key: 'vehicle_type',
        header: t('activities.vehicleType', 'Vehicle Type'),
        accessor: (row) => row.vehicle_type || '-',
      },
      {
        key: 'vehicle_year',
        header: t('activities.vehicleYear', 'Vehicle Year'),
        accessor: (row) => row.vehicle_year || '-',
      },
      {
        key: 'fuel_usage',
        header: t('activities.fuelUsage', 'Fuel Usage'),
        accessor: (row) => row.fuel_usage || '-',
      },
      {
        key: 'units',
        header: t('activities.units', 'Units'),
        accessor: (row) => row.units || '-',
      },
      {
        key: 'miles_traveled',
        header: t('activities.milesTraveled', 'Miles Traveled'),
        accessor: (row) => row.miles_traveled || '-',
      },
      {
        key: 'emissions',
        header: t('activities.emissions', 'Emissions (MT CO₂e)'),
        accessor: (row) => {
          // co2e_kg is the standard emissions column in all activity tables
          // Convert to metric tons (MT)
          const emissions = parseFloat(row.co2e_kg);
          return !isNaN(emissions) && emissions > 0 ? `${(emissions / 1000).toFixed(4)} MT CO₂e` : '-';
        },
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (row) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/activities/${selectedType}/${row.id}${periodId ? `?periodId=${periodId}` : ''}`);
              }}
              className="text-compliance-blue hover:text-cyan-mist transition-colors"
            >
              {t('common.view')}
            </button>
            {canEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/activities/${selectedType}/${row.id}/edit${periodId ? `?periodId=${periodId}` : ''}`);
                }}
                className="text-cyan-mist hover:text-growth-green transition-colors"
              >
                {t('common.edit')}
              </button>
            )}
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(row.id);
                }}
                className="text-red-500 hover:text-red-400 transition-colors"
              >
                {t('common.delete')}
              </button>
            )}
          </div>
        ),
      },
    ];
  } else if (selectedType.startsWith('refrigeration_ac_')) {
    // Common columns for all Refrigeration types
    columns = [
      { key: 'reporting_period', header: t('activities.reportingPeriod', 'Reporting Period'), accessor: (row) => row.reporting_period_label || row.reporting_period || '-' },
      { key: 'refrigerant_type', header: t('activities.refrigerantType', 'Gas'), accessor: (row) => row.refrigerant_type || '-' },
      // Conditional columns based on subtype
      ...(selectedType === 'refrigeration_ac_material_balance' ? [
        { key: 'inventory_change', header: 'Inventory Change (kg)', accessor: (row) => row.inventory_change || '-' },
        { key: 'transferred_amount', header: 'Transferred (kg)', accessor: (row) => row.transferred_amount || '-' },
        { key: 'capacity_change', header: 'Capacity Change (kg)', accessor: (row) => row.capacity_change || '-' },
      ] : []),
      ...(selectedType === 'refrigeration_ac_simplified_material_balance' ? [
        { key: 'new_units_charge', header: 'New Charge (kg)', accessor: (row) => row.new_units_charge || '-' },
        { key: 'new_units_capacity', header: 'New Capacity (kg)', accessor: (row) => row.new_units_capacity || '-' },
        { key: 'existing_units_recharge', header: 'Recharge (kg)', accessor: (row) => row.existing_units_recharge || '-' },
      ] : []),
      ...(selectedType === 'refrigeration_ac_screening_method' ? [
        { key: 'equipment_type', header: 'Equipment Type', accessor: (row) => row.equipment_type || '-' },
        { key: 'new_units_charge', header: 'New Charge (kg)', accessor: (row) => row.new_units_charge || '-' },
        { key: 'operating_units_capacity', header: 'Op. Capacity (kg)', accessor: (row) => row.operating_units_capacity || '-' },
      ] : []),
      {
        key: 'emissions',
        header: t('activities.emissions', 'Emissions (MT CO₂e)'),
        accessor: (row) => {
          const emissions = parseFloat(row.co2e_kg);
          return !isNaN(emissions) && emissions > 0 ? `${(emissions / 1000).toFixed(4)} MT CO₂e` : '-';
        },
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (row) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}${periodId ? `?periodId=${periodId}` : ''}`); }}
              className="text-compliance-blue hover:text-cyan-mist transition-colors"
            >
              {t('common.view')}
            </button>
            {canEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}/edit${periodId ? `?periodId=${periodId}` : ''}`); }}
                className="text-cyan-mist hover:text-growth-green transition-colors"
              >
                {t('common.edit')}
              </button>
            )}
            {canDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
                className="text-red-500 hover:text-red-400 transition-colors"
              >
                {t('common.delete')}
              </button>
            )}
          </div>
        ),
      },
    ];
  } else if (selectedType.startsWith('fire_suppression_')) {
    // Common columns for all Fire Suppression types
    columns = [
      { key: 'reporting_period', header: t('activities.reportingPeriod', 'Reporting Period'), accessor: (row) => row.reporting_period_label || row.reporting_period || '-' },
      { key: 'suppressant_type', header: t('activities.suppressantType', 'Gas'), accessor: (row) => row.suppressant_type || '-' },
      // Conditional columns based on subtype
      ...(selectedType === 'fire_suppression_material_balance' ? [
        { key: 'inventory_change_lb', header: 'Inventory Change (lb)', accessor: (row) => row.inventory_change_lb || '-' },
        { key: 'transferred_amount_lb', header: 'Transferred (lb)', accessor: (row) => row.transferred_amount_lb || '-' },
        { key: 'capacity_change_lb', header: 'Capacity Change (lb)', accessor: (row) => row.capacity_change_lb || '-' },
      ] : []),
      ...(selectedType === 'fire_suppression_simplified_material_balance' ? [
        { key: 'new_units_charge_lb', header: 'New Charge (lb)', accessor: (row) => row.new_units_charge_lb || '-' },
        { key: 'existing_units_recharge_lb', header: 'Recharge (lb)', accessor: (row) => row.existing_units_recharge_lb || '-' },
        { key: 'disposed_units_capacity_lb', header: 'Disposed Cap. (lb)', accessor: (row) => row.disposed_units_capacity_lb || '-' },
        { key: 'disposed_units_recovered_lb', header: 'Recovered (lb)', accessor: (row) => row.disposed_units_recovered_lb || '-' },
      ] : []),
      ...(selectedType === 'fire_suppression_screening_method' ? [
        { key: 'equipment_type', header: 'Equipment Type', accessor: (row) => row.equipment_type || '-' },
        { key: 'unit_capacity_lb', header: 'Capacity (lb)', accessor: (row) => row.unit_capacity_lb || '-' },
      ] : []),
      {
        key: 'emissions',
        header: t('activities.emissions', 'Emissions (MT CO₂e)'),
        accessor: (row) => {
          const emissions = parseFloat(row.co2e_kg);
          return !isNaN(emissions) && emissions > 0 ? `${(emissions / 1000).toFixed(4)} MT CO₂e` : '-';
        },
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (row) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}${periodId ? `?periodId=${periodId}` : ''}`); }}
              className="text-compliance-blue hover:text-cyan-mist transition-colors"
            >
              {t('common.view')}
            </button>
            {canEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}/edit${periodId ? `?periodId=${periodId}` : ''}`); }}
                className="text-cyan-mist hover:text-growth-green transition-colors"
              >
                {t('common.edit')}
              </button>
            )}
            {canDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
                className="text-red-500 hover:text-red-400 transition-colors"
              >
                {t('common.delete')}
              </button>
            )}
          </div>
        ),
      },
    ];
  } else if (selectedType === 'purchased_gases') {
    // Purchased Gases columns
    columns = [
      { key: 'reporting_period', header: t('activities.reportingPeriod', 'Reporting Period'), accessor: (row) => row.reporting_period_label || row.reporting_period || '-' },
      { key: 'gas_type', header: t('activities.gasType', 'Gas Type'), accessor: (row) => row.gas_type || '-' },
      { 
        key: 'amount_purchased', 
        header: 'Purchased Amount (lb)', 
        accessor: (row) => {
          const amount = parseFloat(row.amount_purchased);
          return !isNaN(amount) ? `${amount.toFixed(2)} lb` : '-';
        }
      },
      {
        key: 'emissions',
        header: t('activities.emissions', 'Emissions (MT CO₂e)'),
        accessor: (row) => {
          const emissions = parseFloat(row.co2e_kg);
          return !isNaN(emissions) && emissions > 0 ? `${(emissions / 1000).toFixed(4)} MT CO₂e` : '-';
        },
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (row) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}${periodId ? `?periodId=${periodId}` : ''}`); }}
              className="text-compliance-blue hover:text-cyan-mist transition-colors"
            >
              {t('common.view')}
            </button>
            {canEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}/edit${periodId ? `?periodId=${periodId}` : ''}`); }}
                className="text-cyan-mist hover:text-growth-green transition-colors"
              >
                {t('common.edit')}
              </button>
            )}
            {canDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
                className="text-red-500 hover:text-red-400 transition-colors"
              >
                {t('common.delete')}
              </button>
            )}
          </div>
        ),
      },
    ];
  } else if (selectedType === 'business_travel_hotel') {
    columns = [
      { key: 'reporting_period', header: t('activities.reportingPeriod', 'Reporting Period'), accessor: (row) => row.reporting_period_label || row.reporting_period || '-' },
      { key: 'hotel_name', header: 'Hotel Name', accessor: (row) => row.hotel_name || '-' },
      { key: 'hotel_category', header: 'Category', accessor: (row) => row.hotel_category || '-' },
      { key: 'num_nights', header: 'Nights', accessor: (row) => row.num_nights || '-' },
      { key: 'num_rooms', header: 'Rooms', accessor: (row) => row.num_rooms || '-' },
      {
        key: 'emissions',
        header: t('activities.emissions', 'Emissions (MT CO₂e)'),
        accessor: (row) => {
          const mt = row.total_co2e_mt || (parseFloat(row.co2e_kg) / 1000);
          return !isNaN(mt) ? `${parseFloat(mt).toFixed(4)} MT CO₂e` : '-';
        },
      },
      {
        key: 'actions', // ... (actions render logic same as others)
        header: t('common.actions'),
        render: (row) => (
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}${periodId ? `?periodId=${periodId}` : ''}`); }} className="text-compliance-blue hover:text-cyan-mist transition-colors">{t('common.view')}</button>
            {canEdit && <button onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}/edit${periodId ? `?periodId=${periodId}` : ''}`); }} className="text-cyan-mist hover:text-growth-green transition-colors">{t('common.edit')}</button>}
            {canDelete && <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="text-red-500 hover:text-red-400 transition-colors">{t('common.delete')}</button>}
          </div>
        )
      }
    ];
  } else if (['business_travel_personal_car', 'business_travel_rail_bus', 'business_travel_air', 'employee_commuting_personal_car', 'employee_commuting_public_transport'].includes(selectedType)) {
    columns = [
      { key: 'reporting_period', header: t('activities.reportingPeriod', 'Reporting Period'), accessor: (row) => row.reporting_period_label || row.reporting_period || '-' },
      { key: 'source_id', header: t('activities.sourceId', 'Source ID'), accessor: (row) => row.source_id || '-' },
      { key: 'source_description', header: t('activities.sourceDescription', 'Source Description'), accessor: (row) => row.source_description || '-' },
      { 
        key: 'vehicle_type', 
        header: selectedType === 'business_travel_air' ? 'Flight Length' : 'Vehicle Type', 
        accessor: (row) => row.vehicle_type || '-' 
      },
      { 
        key: 'miles_traveled', 
        header: 'Distance (miles)', 
        accessor: (row) => row.miles_traveled || '-' 
      },
      {
        key: 'emissions',
        header: t('activities.emissions', 'Emissions (MT CO₂e)'),
        accessor: (row) => {
          const mt = row.total_co2e_mt || (parseFloat(row.co2e_kg) / 1000);
          return !isNaN(mt) ? `${parseFloat(mt).toFixed(4)} MT CO₂e` : '-';
        },
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (row) => (
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}${periodId ? `?periodId=${periodId}` : ''}`); }} className="text-compliance-blue hover:text-cyan-mist transition-colors">{t('common.view')}</button>
            {canEdit && <button onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}/edit${periodId ? `?periodId=${periodId}` : ''}`); }} className="text-cyan-mist hover:text-growth-green transition-colors">{t('common.edit')}</button>}
            {canDelete && <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="text-red-500 hover:text-red-400 transition-colors">{t('common.delete')}</button>}
          </div>
        )
      }
    ];
  } else if (selectedType === 'commuting') {
    columns = [
      { key: 'reporting_period', header: t('activities.reportingPeriod', 'Reporting Period'), accessor: (row) => row.reporting_period_label || row.reporting_period || '-' },
      { key: 'commute_mode', header: 'Commute Mode', accessor: (row) => row.commute_mode || '-' },
      { key: 'num_commuters', header: 'Commuters', accessor: (row) => row.num_commuters || '-' },
      { key: 'distance_per_trip_km', header: 'Distance/Trip (km)', accessor: (row) => row.distance_per_trip_km || '-' },
      {
        key: 'emissions',
        header: t('activities.emissions', 'Emissions (MT CO₂e)'),
        accessor: (row) => {
          const mt = row.total_co2e_mt || (parseFloat(row.co2e_kg) / 1000);
          return !isNaN(mt) ? `${parseFloat(mt).toFixed(4)} MT CO₂e` : '-';
        },
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (row) => (
          <div className="flex items-center gap-1">
             <button onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}${periodId ? `?periodId=${periodId}` : ''}`); }} className="text-compliance-blue hover:text-cyan-mist transition-colors">{t('common.view')}</button>
             {canEdit && <button onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}/edit${periodId ? `?periodId=${periodId}` : ''}`); }} className="text-cyan-mist hover:text-growth-green transition-colors">{t('common.edit')}</button>}
             {canDelete && <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="text-red-500 hover:text-red-400 transition-colors">{t('common.delete')}</button>}
          </div>
        )
      }
    ];
  } else if (selectedType === 'waste') {
    columns = [
      { key: 'reporting_period', header: t('activities.reportingPeriod', 'Reporting Period'), accessor: (row) => row.reporting_period_label || row.reporting_period || '-' },
      { key: 'source_id', header: t('activities.sourceId', 'Source ID'), accessor: (row) => row.source_id || '-' },
      { key: 'source_description', header: t('activities.sourceDescription', 'Source Description'), accessor: (row) => row.source_description || '-' },
      { key: 'waste_type', header: 'Waste Type', accessor: (row) => row.waste_type || '-' },
      { key: 'disposal_method', header: 'Disposal Method', accessor: (row) => row.disposal_method || '-' },
      { key: 'amount', header: 'Amount', accessor: (row) => `${row.amount || 0} ${row.units || 'kg'}` },
      {
        key: 'emissions',
        header: t('activities.emissions', 'Emissions (MT CO₂e)'),
        accessor: (row) => {
          const mt = row.total_co2e_mt || (parseFloat(row.co2e_kg) / 1000);
          return !isNaN(mt) ? `${parseFloat(mt).toFixed(4)} MT CO₂e` : '-';
        },
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (row) => (
          <div className="flex items-center gap-1">
             <button onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}${periodId ? `?periodId=${periodId}` : ''}`); }} className="text-compliance-blue hover:text-cyan-mist transition-colors">{t('common.view')}</button>
             {canEdit && <button onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}/edit${periodId ? `?periodId=${periodId}` : ''}`); }} className="text-cyan-mist hover:text-growth-green transition-colors">{t('common.edit')}</button>}
             {canDelete && <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="text-red-500 hover:text-red-400 transition-colors">{t('common.delete')}</button>}
          </div>
        )
      }
    ];
  } else if (selectedType === 'transportation_distribution') {
    columns = [
      { key: 'reporting_period', header: t('activities.reportingPeriod', 'Reporting Period'), accessor: (row) => row.reporting_period_label || row.reporting_period || '-' },
      { key: 'shipment_description', header: 'Shipment', accessor: (row) => row.shipment_description || '-' },
      { key: 'transport_mode', header: 'Mode', accessor: (row) => row.transport_mode || '-' },
      { key: 'distance_km', header: 'Distance (km)', accessor: (row) => row.distance_km || '-' },
      { key: 'weight_tons', header: 'Weight (tons)', accessor: (row) => row.weight_tons || '-' },
      {
        key: 'emissions',
        header: t('activities.emissions', 'Emissions (MT CO₂e)'),
        accessor: (row) => {
          const mt = row.total_co2e_mt || (parseFloat(row.co2e_kg) / 1000);
          return !isNaN(mt) ? `${parseFloat(mt).toFixed(4)} MT CO₂e` : '-';
        },
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (row) => (
          <div className="flex items-center gap-1">
             <button onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}${periodId ? `?periodId=${periodId}` : ''}`); }} className="text-compliance-blue hover:text-cyan-mist transition-colors">{t('common.view')}</button>
             {canEdit && <button onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}/edit${periodId ? `?periodId=${periodId}` : ''}`); }} className="text-cyan-mist hover:text-growth-green transition-colors">{t('common.edit')}</button>}
             {canDelete && <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="text-red-500 hover:text-red-400 transition-colors">{t('common.delete')}</button>}
          </div>
        )
      }
    ];
  } else if (selectedType === 'upstream_trans_dist_vehicle_miles') {
    columns = [
      { key: 'reporting_period', header: t('activities.reportingPeriod', 'Reporting Period'), accessor: (row) => row.reporting_period_label || row.reporting_period || '-' },
      { key: 'source_id', header: t('activities.sourceId', 'Source ID'), accessor: (row) => row.source_id || '-' },
      { key: 'source_description', header: t('activities.sourceDescription', 'Source Description'), accessor: (row) => row.source_description || '-' },
      { key: 'vehicle_type', header: 'Vehicle Type', accessor: (row) => row.vehicle_type || '-' },
      { key: 'vehicle_miles', header: 'Vehicle-Miles', accessor: (row) => row.vehicle_miles || '-' },
      {
        key: 'emissions',
        header: t('activities.emissions', 'Emissions (MT CO₂e)'),
        accessor: (row) => {
          const mt = row.total_co2e_mt || (parseFloat(row.co2e_kg) / 1000);
          return !isNaN(mt) ? `${parseFloat(mt).toFixed(4)} MT CO₂e` : '-';
        },
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (row) => (
          <div className="flex items-center gap-1">
             <button onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}${periodId ? `?periodId=${periodId}` : ''}`); }} className="text-compliance-blue hover:text-cyan-mist transition-colors">{t('common.view')}</button>
             {canEdit && <button onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}/edit${periodId ? `?periodId=${periodId}` : ''}`); }} className="text-cyan-mist hover:text-growth-green transition-colors">{t('common.edit')}</button>}
             {canDelete && <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="text-red-500 hover:text-red-400 transition-colors">{t('common.delete')}</button>}
          </div>
        )
      }
    ];
  } else if (selectedType === 'upstream_trans_dist_ton_miles') {
    columns = [
      { key: 'reporting_period', header: t('activities.reportingPeriod', 'Reporting Period'), accessor: (row) => row.reporting_period_label || row.reporting_period || '-' },
      { key: 'source_id', header: t('activities.sourceId', 'Source ID'), accessor: (row) => row.source_id || '-' },
      { key: 'source_description', header: t('activities.sourceDescription', 'Source Description'), accessor: (row) => row.source_description || '-' },
      { key: 'vehicle_type', header: 'Vehicle Type', accessor: (row) => row.vehicle_type || '-' },
      { key: 'short_ton_miles', header: 'Short Ton-Miles', accessor: (row) => row.short_ton_miles || '-' },
      {
        key: 'emissions',
        header: t('activities.emissions', 'Emissions (MT CO₂e)'),
        accessor: (row) => {
          const mt = row.total_co2e_mt || (parseFloat(row.co2e_kg) / 1000);
          return !isNaN(mt) ? `${parseFloat(mt).toFixed(4)} MT CO₂e` : '-';
        },
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (row) => (
          <div className="flex items-center gap-1">
             <button onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}${periodId ? `?periodId=${periodId}` : ''}`); }} className="text-compliance-blue hover:text-cyan-mist transition-colors">{t('common.view')}</button>
             {canEdit && <button onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}/edit${periodId ? `?periodId=${periodId}` : ''}`); }} className="text-cyan-mist hover:text-growth-green transition-colors">{t('common.edit')}</button>}
             {canDelete && <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="text-red-500 hover:text-red-400 transition-colors">{t('common.delete')}</button>}
          </div>
        )
      }
    ];
  } else if (selectedType === 'offsets') {
    columns = [
      { key: 'reporting_period', header: t('activities.reportingPeriod', 'Reporting Period'), accessor: (row) => row.reporting_period_label || row.reporting_period || '-' },
      { key: 'source_id', header: 'ID', accessor: (row) => row.source_id || '-' },
      { key: 'offset_description', header: 'Project Description', accessor: (row) => row.offset_description || '-' },
      { key: 'scope_category', header: 'Scope/Category', accessor: (row) => row.scope_category || '-' },
      { key: 'amount_mtco2e', header: 'Offsets Purchased (MT CO₂e)', accessor: (row) => row.amount_mtco2e || '0' },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (row) => (
          <div className="flex items-center gap-1">
             <button onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}${periodId ? `?periodId=${periodId}` : ''}`); }} className="text-compliance-blue hover:text-cyan-mist transition-colors">{t('common.view')}</button>
             {canEdit && <button onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}/edit${periodId ? `?periodId=${periodId}` : ''}`); }} className="text-cyan-mist hover:text-growth-green transition-colors">{t('common.edit')}</button>}
             {canDelete && <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="text-red-500 hover:text-red-400 transition-colors">{t('common.delete')}</button>}
          </div>
        )
      }
    ];
  } else if (selectedType === 'electricity') {
    columns = [
      { key: 'reporting_period', header: t('activities.reportingPeriod', 'Reporting Period'), accessor: (row) => row.reporting_period_label || row.reporting_period || '-' },
      { key: 'source_id', header: t('activities.sourceId', 'Source ID'), accessor: (row) => row.source_id || '-' },
      { key: 'source_description', header: t('activities.sourceDescription', 'Source Description'), accessor: (row) => row.source_description || '-' },
      { key: 'facility_location', header: 'eGRID Subregion', accessor: (row) => row.facility_location || '-' },
      { key: 'kwh_purchased', header: 'kWh Purchased', accessor: (row) => row.kwh_purchased || '0' },
      {
        key: 'loc_emissions',
        header: 'Location-Based (MT CO₂e)',
        accessor: (row) => row.location_based_co2e_mt ? `${parseFloat(row.location_based_co2e_mt).toFixed(4)}` : '-'
      },
      {
        key: 'mkt_emissions',
        header: 'Market-Based (MT CO₂e)',
        accessor: (row) => row.market_based_co2e_mt ? `${parseFloat(row.market_based_co2e_mt).toFixed(4)}` : '-'
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (row) => (
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}${periodId ? `?periodId=${periodId}` : ''}`); }} className="text-compliance-blue hover:text-cyan-mist transition-colors">{t('common.view')}</button>
            {canEdit && <button onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}/edit${periodId ? `?periodId=${periodId}` : ''}`); }} className="text-cyan-mist hover:text-growth-green transition-colors">{t('common.edit')}</button>}
            {canDelete && <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="text-red-500 hover:text-red-400 transition-colors">{t('common.delete')}</button>}
          </div>
        )
      }
    ];
  } else if (selectedType === 'steam') {
    columns = [
      { key: 'reporting_period', header: t('activities.reportingPeriod', 'Reporting Period'), accessor: (row) => row.reporting_period_label || row.reporting_period || '-' },
      { key: 'source_id', header: t('activities.sourceId', 'Source ID'), accessor: (row) => row.source_id || '-' },
      { key: 'source_description', header: t('activities.sourceDescription', 'Source Description'), accessor: (row) => row.source_description || '-' },
      { key: 'fuel_type', header: 'Fuel Type', accessor: (row) => row.fuel_type || '-' },
      { key: 'boiler_efficiency', header: 'Efficiency (%)', accessor: (row) => row.boiler_efficiency || '80' },
      { key: 'amount_purchased', header: 'Purchased (MMBtu)', accessor: (row) => row.amount_purchased || '0' },
      {
        key: 'loc_emissions',
        header: 'Location-Based (MT CO₂e)',
        accessor: (row) => row.location_based_co2e_mt ? `${parseFloat(row.location_based_co2e_mt).toFixed(4)}` : '-'
      },
      {
        key: 'mkt_emissions',
        header: 'Market-Based (MT CO₂e)',
        accessor: (row) => row.market_based_co2e_mt ? `${parseFloat(row.market_based_co2e_mt).toFixed(4)}` : '-'
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (row) => (
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}${periodId ? `?periodId=${periodId}` : ''}`); }} className="text-compliance-blue hover:text-cyan-mist transition-colors">{t('common.view')}</button>
            {canEdit && <button onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}/edit${periodId ? `?periodId=${periodId}` : ''}`); }} className="text-cyan-mist hover:text-growth-green transition-colors">{t('common.edit')}</button>}
            {canDelete && <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="text-red-500 hover:text-red-400 transition-colors">{t('common.delete')}</button>}
          </div>
        )
      }
    ];
  } else {
    // Generic fallback for other types
    columns = [
      { key: 'reporting_period', header: t('activities.reportingPeriod', 'Reporting Period'), accessor: (row) => row.reporting_period_label || row.reporting_period || '-' },
      { key: 'source_id', header: t('activities.sourceId', 'Source ID'), accessor: (row) => row.source_id || '-' },
      { key: 'description', header: 'Description', accessor: (row) => row.source_description || row.facility_description || row.description || '-' },
      {
        key: 'emissions',
        header: t('activities.emissions', 'Emissions (MT CO₂e)'),
        accessor: (row) => {
          const mt = row.total_co2e_mt || (parseFloat(row.co2e_kg) / 1000);
          return !isNaN(mt) ? `${parseFloat(mt).toFixed(4)} MT CO₂e` : '-';
        },
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (row) => (
          <div className="flex items-center gap-2">
             <button onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}${periodId ? `?periodId=${periodId}` : ''}`); }} className="text-compliance-blue hover:text-cyan-mist transition-colors">{t('common.view')}</button>
             {canEdit && <button onClick={(e) => { e.stopPropagation(); navigate(`/activities/${selectedType}/${row.id}/edit${periodId ? `?periodId=${periodId}` : ''}`); }} className="text-cyan-mist hover:text-growth-green transition-colors">{t('common.edit')}</button>}
             {canDelete && <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="text-red-500 hover:text-red-400 transition-colors">{t('common.delete')}</button>}
          </div>
        )
      }
    ];
  }


  // FIX: handleDelete must be an async function, and the try/catch must be inside it, not outside the columns array
  const handleDelete = async (id) => {
    if (window.confirm(t('common.confirmDelete', 'Are you sure you want to delete this activity?'))) {
      try {
        await activitiesAPI.deleteActivity(user.companyId, selectedType, id);
        success(t('common.deleteSuccess', 'Activity deleted successfully'));
        fetchActivities();
      } catch (err) {
        error(err.response?.data?.message || 'Failed to delete activity');
      }
    }
  };

  const handleSort = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
  };


  // Group activities by scope for display
  const groupedTypes = {
    'Scope 1': availableActivityTypes.filter(t => [
      'stationary_combustion', 'mobile_sources', 
      'refrigeration_ac_material_balance', 'refrigeration_ac_simplified_material_balance', 'refrigeration_ac_screening_method',
      'fire_suppression_material_balance', 'fire_suppression_simplified_material_balance', 'fire_suppression_screening_method',
      'purchased_gases'
    ].includes(t.key)),
    'Scope 2': availableActivityTypes.filter(t => [
      'electricity', 'steam'
    ].includes(t.key)),
    'Scope 3': availableActivityTypes.filter(t => [
      'business_travel_personal_car', 'business_travel_rail_bus', 'business_travel_air', 
      'employee_commuting_personal_car', 'employee_commuting_public_transport',
      'upstream_trans_dist_vehicle_miles', 'upstream_trans_dist_ton_miles',
      'waste'
    ].includes(t.key)),
    'Other': availableActivityTypes.filter(t => t.key === 'offsets')
  };

  // If no boundary answers are found/set, block access
  if (!loading && availableActivityTypes.length === 0) {
     return (
       <div className="container mx-auto px-4 py-16 text-center">
         <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md border border-cyan-mist/30 rounded-2xl p-12 shadow-2xl">
           <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
             <span className="text-4xl">⚙️</span>
           </div>
           <h2 className="text-3xl font-bold text-white mb-4">{t('activities.boundaryRequiredTitle')}</h2>
           <p className="text-xl text-gray-300 mb-8">
             {t('activities.boundaryRequiredText')}
           </p>
           <button
             onClick={() => navigate('/setup')} 
             className="btn-primary text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-cyan-mist/20 transition-all"
           >
             {t('activities.goToBoundary')}
           </button>
         </div>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-midnight-navy text-white p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Modernized Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
               <div className="w-8 h-1 bg-cyan-mist rounded-full"></div>
               <span className="text-[10px] uppercase font-black tracking-[0.3em] text-cyan-mist">Environmental Audit</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-white italic">
               operational<br/>activities.
            </h1>
          </div>
          {canEdit && (
            <button
              onClick={() => navigate(`/activities/${selectedType}/add${periodId ? `?periodId=${periodId}` : ''}`)}
              className="px-8 py-4 bg-cyan-mist text-midnight-navy font-black rounded-2xl hover:bg-growth-green transition-all shadow-xl hover:shadow-cyan-mist/20 active:scale-95 flex items-center gap-2 group"
            >
              <span className="text-2xl group-hover:rotate-90 transition-transform">+</span>
              {t('activities.addActivity')}
            </button>
          )}
        </div>

        <div className="mb-6">
          <button
            onClick={() => periodId ? navigate(`/reports/${periodId}/activities`) : navigate('/dashboard')}
            className="text-cyan-mist hover:text-growth-green flex items-center gap-2 transition-colors text-sm"
          >
            ← {periodId ? 'Back to Activities Checklist' : 'Back to Dashboard'}
          </button>
        </div>

        {/* Activity Type Selector with Scope Grouping */}
        {periodId ? (
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 mb-10 shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-mist/5 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:bg-cyan-mist/10 transition-all"></div>
             <div className="flex items-center gap-6">
                <div className="p-4 bg-cyan-mist/10 rounded-2xl border border-cyan-mist/20 shadow-inner">
                   <TableCellsIcon className="h-10 w-10 text-cyan-mist" />
                </div>
                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-cyan-mist animate-pulse"></span>
                      <label className="text-[10px] font-black text-cyan-mist uppercase tracking-[0.2em] opacity-80">
                         {t('activities.currentCategory', 'Operational Category')}
                      </label>
                   </div>
                   <h2 className="text-3xl font-black text-white tracking-tight">
                      {t(`activityTypes.${selectedType}`, ACTIVITY_TYPES.find(t => t.key === selectedType)?.label)}
                   </h2>
                </div>
             </div>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 mb-10 shadow-2xl relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <label className="block text-[10px] font-black text-cyan-mist mb-4 uppercase tracking-[0.2em] ml-1">
                  {t('activities.selectType', 'Select Operational Data Stream')}
                </label>
                <div className="relative group">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-6 py-4 bg-midnight-navy-lighter border border-white/10 rounded-2xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-mist transition-all text-lg font-bold cursor-pointer hover:border-white/20"
                  >
                    {Object.entries(groupedTypes).map(([scope, types]) => (
                      types.length > 0 && (
                        <optgroup key={scope} label={scope.toUpperCase()} className="bg-midnight-navy-lighter text-cyan-mist font-black py-4">
                          {types.map((type) => (
                            <option key={type.key} value={type.key} className="text-white font-medium py-2">
                              {t(`activityTypes.${type.key}`, type.label)}
                            </option>
                          ))}
                        </optgroup>
                      )
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-6 pointer-events-none text-cyan-mist">
                    <svg className="w-6 h-6 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col justify-end">
                <p className="text-xs text-stone-gray flex items-center gap-2 bg-white/5 p-4 rounded-xl border border-white/5">
                   <div className="w-2 h-2 rounded-full bg-success"></div>
                   <span>
                      {t('activities.boundarySettingsInfo', 'Reporting boundaries active.')}
                      <button onClick={() => navigate('/setup')} className="text-cyan-mist hover:underline ml-2 font-bold">
                        {t('activities.editSettings', 'Configure')}
                      </button>
                   </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Activities Table */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-xl">
          <div className="p-6">
            <DataTable
              data={activities}
              columns={columns}
              loading={loading}
              searchable
              pagination
              pageSize={15}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              onRowClick={(row) => navigate(`/activities/${selectedType}/${row.id}${periodId ? `?periodId=${periodId}` : ''}`)}
              emptyMessage={
                <div className="text-center py-12">
                   <p className="text-gray-400 text-lg mb-4">{t('activities.noActivities')}</p>
                   {canEdit && (
                     <button onClick={() => navigate(`/activities/${selectedType}/add`)} className="btn-secondary">
                        {t('activities.addFirstEntry')}
                     </button>
                   )}
                </div>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivitiesListPage;
