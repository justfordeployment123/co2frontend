import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/common/Toast';
import { useAuth } from "../contexts/AuthContext";
import apiClient from '../api/apiClient';
import { boundariesAPI } from '../api/boundariesAPI';
import { 
  ClipboardDocumentCheckIcon, 
  PencilSquareIcon, 
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const ACTIVITY_METADATA = {
  // Scope 1
  stationary_combustion: { label: 'Stationary Combustion', scope: 1, description: 'On-site fuel combustion (boilers, furnaces)' },
  mobile_sources: { label: 'Mobile Sources', scope: 1, description: 'Owned or leased vehicles' },
  refrigeration_ac_material_balance: { label: 'Refrigeration & AC', scope: 1, description: 'Fugitive emissions from cooling systems' },
  refrigeration_ac_simplified_material_balance: { label: 'Refrigeration & AC (Simplified)', scope: 1, description: 'Fugitive emissions' },
  refrigeration_ac_screening_method: { label: 'Refrigeration & AC (Screening)', scope: 1, description: 'Fugitive emissions' },
  fire_suppression_material_balance: { label: 'Fire Suppression', scope: 1, description: 'Emissions from fire suppressants' },
  fire_suppression_simplified_material_balance: { label: 'Fire Suppression (Simplified)', scope: 1, description: 'Fire suppressants' },
  fire_suppression_screening_method: { label: 'Fire Suppression (Screening)', scope: 1, description: 'Fire suppressants' },
  purchased_gases: { label: 'Purchased Gases', scope: 1, description: 'Industrial gases used in processes' },
  
  // Scope 2
  electricity: { label: 'Purchased Electricity', scope: 2, description: 'Purchased electricity for own use' },
  steam: { label: 'Purchased Steam', scope: 2, description: 'Purchased steam, heat, or cooling' },
  
  // Scope 3
  business_travel_personal_car: { label: 'Business Travel (Car)', scope: 3, description: 'Employee-owned vehicle travel' },
  business_travel_rail_bus: { label: 'Business Travel (Rail/Bus)', scope: 3, description: 'Public transit business travel' },
  business_travel_air: { label: 'Business Travel (Air)', scope: 3, description: 'Air travel for business' },
  business_travel_hotel: { label: 'Hotel Stays', scope: 3, description: 'Business hotel accommodations' },
  employee_commuting_personal_car: { label: 'Employee Commuting (Car)', scope: 3, description: 'Commuting in personal vehicles' },
  employee_commuting_public_transport: { label: 'Employee Commuting (Public)', scope: 3, description: 'Commuting via public transit' },
  upstream_trans_dist_vehicle_miles: { label: 'Upstream Trans & Dist', scope: 3, description: 'Transportation of purchased goods' },
  upstream_trans_dist_ton_miles: { label: 'Upstream Trans & Dist (Ton-Miles)', scope: 3, description: 'Large scale transportation' },
  waste: { label: 'Waste Generated', scope: 3, description: 'Disposal and treatment of waste' },
  
  // Offsets
  offsets: { label: 'Carbon Offsets', scope: 'Other', description: 'Verified emission reductions' },
};

const ActivitiesChecklistPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { periodId } = useParams();
  const { user } = useAuth();
  const { error } = useToast();

  const [loading, setLoading] = useState(true);
  const [enabledTypes, setEnabledTypes] = useState([]);
  const [activitiesCount, setActivitiesCount] = useState({});
  const [periodInfo, setPeriodInfo] = useState(null);

  useEffect(() => {
    if (user?.companyId && periodId) {
      fetchData();
    }
  }, [user?.companyId, periodId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Period Info
      const periodRes = await apiClient.get(`/companies/${user.companyId}/reporting-periods`);
      const periods = periodRes.data.reportingPeriods || [];
      const currentPeriod = periods.find(p => p.id === periodId) || periods[0];
      setPeriodInfo(currentPeriod);

      // 2. Fetch Enabled Types
      const enabledRes = await boundariesAPI.getEnabledActivityTypes(user.companyId);
      setEnabledTypes(enabledRes.enabledActivityTypes || []);

      // 3. Fetch activity counts
      try {
        const countsRes = await apiClient.get(`/companies/${user.companyId}/reporting-periods/${periodId}/activities/counts`);
        setActivitiesCount(countsRes.data.counts || {});
      } catch (err) {
        console.error('Failed to fetch counts:', err);
      }
    } catch (err) {
      console.error(err);
      error(t('activities.fetchError', 'Failed to load activities'));
    } finally {
      setLoading(false);
    }
  };

  // Helper to map checklist ID to count keys
  const getCountForType = (type) => {
    // Some types in metadata map to broader groups in the backend count
    const mapping = {
      'stationary_combustion': 'stationary_combustion',
      'mobile_sources': 'mobile_sources',
      'refrigeration_ac_material_balance': 'refrigeration_ac',
      'refrigeration_ac_simplified_material_balance': 'refrigeration_ac',
      'refrigeration_ac_screening_method': 'refrigeration_ac',
      'fire_suppression_material_balance': 'fire_suppression',
      'fire_suppression_simplified_material_balance': 'fire_suppression',
      'fire_suppression_screening_method': 'fire_suppression',
      'purchased_gases': 'purchased_gases',
      'electricity': 'electricity',
      'steam': 'steam',
      'business_travel_personal_car': 'business_travel_road',
      'business_travel_rail_bus': 'business_travel_rail',
      'business_travel_air': 'business_travel_air',
      'business_travel_hotel': 'business_travel_hotel',
      'employee_commuting_personal_car': 'commuting',
      'employee_commuting_public_transport': 'commuting',
      'upstream_trans_dist_vehicle_miles': 'transportation_distribution',
      'upstream_trans_dist_ton_miles': 'transportation_distribution',
      'waste': 'waste',
      'offsets': 'offsets'
    };
    const key = mapping[type] || type;
    return activitiesCount[key] || 0;
  };

  const groupByType = (types) => {
    const groups = {
      'Scope 1': [],
      'Scope 2': [],
      'Scope 3': [],
      'Other': []
    };

    types.forEach(type => {
      const meta = ACTIVITY_METADATA[type];
      if (!meta) return;
      
      const scopeKey = meta.scope === 1 ? 'Scope 1' : 
                       meta.scope === 2 ? 'Scope 2' : 
                       meta.scope === 3 ? 'Scope 3' : 'Other';
      
      groups[scopeKey].push({ id: type, ...meta });
    });

    return groups;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-mist border-t-transparent"></div>
      </div>
    );
  }

  const groupedActivities = groupByType(enabledTypes);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back Navigation */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/reporting-periods')}
          className="text-cyan-mist hover:text-growth-green flex items-center gap-2 transition-colors text-sm"
        >
          ← Back to Active Reports
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-midnight-navy-lighter p-6 rounded-2xl border border-carbon-gray shadow-lg">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {periodInfo?.period_label || 'Report'} {t('activities.activities', 'Activities')}
          </h1>
          <p className="text-stone-gray">
            Configure data for each enabled emission source below.
          </p>
        </div>
        <div className="flex gap-3">
          {['company_admin', 'editor', 'internal_admin'].includes(user?.role) && (
            <>
              <Link
                to={`/settings/boundary/${periodId}`}
                className="flex items-center gap-2 px-4 py-2 border border-carbon-gray rounded-lg text-off-white hover:bg-midnight-navy transition-colors"
                title={t('boundary.editQuestions', 'Edit Questions')}
              >
                <PencilSquareIcon className="h-5 w-5" />
                <span className="hidden sm:inline">{t('boundary.editQuestions', 'Edit Questions')}</span>
              </Link>
              <Link
                to={`/reports/generate?periodId=${periodId}`}
                className="flex items-center gap-2 px-6 py-2 bg-growth-green text-midnight-navy font-bold rounded-lg hover:bg-opacity-90 transition-all shadow-lg"
                title={t('reports.generate', 'Generate Report')}
              >
                <ClipboardDocumentCheckIcon className="h-5 w-5" />
                <span className="hidden sm:inline">{t('reports.generate', 'Generate Report')}</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Scopes List */}
      <div className="space-y-12">
        {Object.entries(groupedActivities).map(([scope, activities]) => (
          activities.length > 0 && (
            <div key={scope} className="animate-fade-in">
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-cyan-mist uppercase tracking-wider">{scope}</h2>
                <div className="flex-grow h-px bg-gradient-to-r from-carbon-gray to-transparent"></div>
              </div>

              <div className="grid gap-4">
                {activities.map((activity) => (
                  <div 
                    key={activity.id}
                    onClick={() => navigate(`/reports/${periodId}/activities/${activity.id}`)}
                    className="flex items-center justify-between p-5 bg-midnight-navy/40 backdrop-blur-sm border border-carbon-gray/50 rounded-xl hover:border-cyan-mist/30 transition-all group cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-midnight-navy rounded-lg group-hover:bg-cyan-mist/10 transition-colors">
                        <ClipboardDocumentCheckIcon className="h-6 w-6 text-cyan-mist" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-off-white group-hover:text-cyan-mist transition-colors">
                          {activity.label}
                        </h3>
                        <p className="text-sm text-stone-gray">{activity.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-cyan-mist group-hover:translate-x-1 transition-transform">
                      <ArrowRightIcon className="h-6 w-6" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>

      {/* Empty State */}
      {enabledTypes.length === 0 && (
        <div className="text-center py-20 bg-midnight-navy-lighter rounded-2xl border border-dashed border-carbon-gray">
          <ExclamationCircleIcon className="h-16 w-16 text-stone-gray mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No activities enabled</h3>
          <p className="text-stone-gray mb-8">You need to answer the boundary questions to enable activities.</p>
          <Link to={`/settings/boundary/${periodId}`} className="btn-primary px-8">
            Go to Boundary Questions
          </Link>
        </div>
      )}
      
      {/* Footer / Summary Shortcut */}
      <div className="mt-16 p-8 bg-gradient-to-br from-midnight-navy-lighter to-midnight-navy border border-cyan-mist/20 rounded-2xl text-center shadow-2xl">
        <h3 className="text-2xl font-bold text-white mb-4">Done with all activities?</h3>
        <p className="text-gray-400 mb-8 max-w-xl mx-auto">
          Review your entries and see your total carbon footprint before generating the final compliance report.
        </p>
        <Link
          to={`/reports/generate?periodId=${periodId}`}
          className="inline-flex items-center gap-3 px-10 py-4 bg-cyan-mist text-midnight-navy font-black text-lg rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(34,211,238,0.3)]"
        >
          Check Summary & Generate Report
        </Link>
      </div>
    </div>
  );
};

export default ActivitiesChecklistPage;
