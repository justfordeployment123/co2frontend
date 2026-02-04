import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/common/Toast';
import { useAuth } from "../contexts/AuthContext";
import apiClient from '../api/apiClient';
import { boundariesAPI } from '../api/boundariesAPI';
import {
  ClipboardList,
  Pencil,
  ArrowRight,
  FileBarChart,
  AlertCircle,
  Flame,
  Car,
  Snowflake,
  Zap,
  Plane,
  Train,
  Building,
  Truck,
  Trash2,
  Leaf,
  ChevronRight
} from 'lucide-react';

const ACTIVITY_METADATA = {
  // Scope 1
  stationary_combustion: { label: 'Stationary Combustion', scope: 1, description: 'On-site fuel combustion (boilers, furnaces)', icon: Flame },
  mobile_sources: { label: 'Mobile Sources', scope: 1, description: 'Owned or leased vehicles', icon: Car },
  refrigeration_ac_material_balance: { label: 'Refrigeration & AC', scope: 1, description: 'Fugitive emissions from cooling systems', icon: Snowflake },
  refrigeration_ac_simplified_material_balance: { label: 'Refrigeration & AC (Simplified)', scope: 1, description: 'Fugitive emissions', icon: Snowflake },
  refrigeration_ac_screening_method: { label: 'Refrigeration & AC (Screening)', scope: 1, description: 'Fugitive emissions', icon: Snowflake },
  fire_suppression_material_balance: { label: 'Fire Suppression', scope: 1, description: 'Emissions from fire suppressants', icon: Flame },
  fire_suppression_simplified_material_balance: { label: 'Fire Suppression (Simplified)', scope: 1, description: 'Fire suppressants', icon: Flame },
  fire_suppression_screening_method: { label: 'Fire Suppression (Screening)', scope: 1, description: 'Fire suppressants', icon: Flame },
  purchased_gases: { label: 'Purchased Gases', scope: 1, description: 'Industrial gases used in processes', icon: Zap },

  // Scope 2
  electricity: { label: 'Purchased Electricity', scope: 2, description: 'Purchased electricity for own use', icon: Zap },
  steam: { label: 'Purchased Steam', scope: 2, description: 'Purchased steam, heat, or cooling', icon: Flame },

  // Scope 3
  business_travel_personal_car: { label: 'Business Travel (Car)', scope: 3, description: 'Employee-owned vehicle travel', icon: Car },
  business_travel_rail_bus: { label: 'Business Travel (Rail/Bus)', scope: 3, description: 'Public transit business travel', icon: Train },
  business_travel_air: { label: 'Business Travel (Air)', scope: 3, description: 'Air travel for business', icon: Plane },
  business_travel_hotel: { label: 'Hotel Stays', scope: 3, description: 'Business hotel accommodations', icon: Building },
  employee_commuting_personal_car: { label: 'Employee Commuting (Car)', scope: 3, description: 'Commuting in personal vehicles', icon: Car },
  employee_commuting_public_transport: { label: 'Employee Commuting (Public)', scope: 3, description: 'Commuting via public transit', icon: Train },
  upstream_trans_dist_vehicle_miles: { label: 'Upstream Trans & Dist', scope: 3, description: 'Transportation of purchased goods', icon: Truck },
  upstream_trans_dist_ton_miles: { label: 'Upstream Trans & Dist (Ton-Miles)', scope: 3, description: 'Large scale transportation', icon: Truck },
  waste: { label: 'Waste Generated', scope: 3, description: 'Disposal and treatment of waste', icon: Trash2 },

  // Offsets
  offsets: { label: 'Carbon Offsets', scope: 'Other', description: 'Verified emission reductions', icon: Leaf },
};

const SCOPE_COLORS = {
  'Scope 1': { gradient: 'from-emerald-500 to-green-600', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'Scope 2': { gradient: 'from-cyan-500 to-blue-600', bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  'Scope 3': { gradient: 'from-purple-500 to-violet-600', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  'Other': { gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
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
      const periodRes = await apiClient.get(`/companies/${user.companyId}/reporting-periods`);
      const periods = periodRes.data.reportingPeriods || [];
      const currentPeriod = periods.find(p => p.id === periodId) || periods[0];
      setPeriodInfo(currentPeriod);

      const enabledRes = await boundariesAPI.getEnabledActivityTypes(user.companyId);
      setEnabledTypes(enabledRes.enabledActivityTypes || []);

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

  const getCountForType = (type) => {
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
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-mist/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-mist animate-spin"></div>
          </div>
          <p className="text-gray-400">Loading activities...</p>
        </div>
      </div>
    );
  }

  const groupedActivities = groupByType(enabledTypes);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/reporting-periods')}
          className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors text-sm"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to Active Reports
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {periodInfo?.period_label || 'Report'} Activities
          </h1>
          <p className="text-gray-400">
            Configure data for each enabled emission source below.
          </p>
        </div>
        <div className="flex gap-3">
          {['company_admin', 'editor', 'internal_admin'].includes(user?.role) && (
            <>
              <Link
                to={`/settings/boundary/${periodId}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-all"
              >
                <Pencil className="h-4 w-4" />
                <span className="hidden sm:inline">Edit Questions</span>
              </Link>
              <Link
                to={`/reports/generate?periodId=${periodId}`}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-mist to-growth-green text-midnight-navy font-semibold rounded-xl hover:shadow-lg hover:shadow-growth-green/20 transition-all"
              >
                <FileBarChart className="h-5 w-5" />
                <span className="hidden sm:inline">Generate Report</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Scopes List */}
      <div className="space-y-10">
        {Object.entries(groupedActivities).map(([scope, activities]) => (
          activities.length > 0 && (
            <div key={scope}>
              <div className="flex items-center gap-4 mb-5">
                <h2 className={`text-lg font-bold uppercase tracking-wider ${SCOPE_COLORS[scope]?.text || 'text-cyan-mist'}`}>
                  {scope}
                </h2>
                <div className={`flex-grow h-px bg-gradient-to-r ${SCOPE_COLORS[scope]?.gradient || 'from-cyan-mist'} opacity-30`}></div>
                <span className="text-sm text-gray-500">{activities.length} sources</span>
              </div>

              <div className="grid gap-3">
                {activities.map((activity) => {
                  const Icon = activity.icon || ClipboardList;
                  const scopeColor = SCOPE_COLORS[scope];
                  return (
                    <div
                      key={activity.id}
                      onClick={() => navigate(`/reports/${periodId}/activities/${activity.id}`)}
                      className={`flex items-center justify-between p-5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:${scopeColor?.border} transition-all group cursor-pointer`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 ${scopeColor?.bg} rounded-xl group-hover:scale-110 transition-transform`}>
                          <Icon className={`h-5 w-5 ${scopeColor?.text}`} />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-white group-hover:text-cyan-mist transition-colors">
                            {activity.label}
                          </h3>
                          <p className="text-sm text-gray-500">{activity.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <ArrowRight className={`h-5 w-5 ${scopeColor?.text} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ))}
      </div>

      {/* Empty State */}
      {enabledTypes.length === 0 && (
        <div className="text-center py-16 bg-white/5 rounded-2xl border border-dashed border-white/20">
          <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No activities enabled</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            You need to answer the boundary questions to enable emission sources for tracking.
          </p>
          <Link
            to={`/settings/boundary/${periodId}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-mist to-growth-green text-midnight-navy font-semibold rounded-xl hover:shadow-lg hover:shadow-growth-green/20 transition-all"
          >
            Go to Boundary Questions
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      )}

      {/* Footer CTA */}
      {enabledTypes.length > 0 && (
        <div className="mt-16 p-8 bg-gradient-to-br from-white/5 to-white/[0.02] border border-cyan-mist/20 rounded-2xl text-center">
          <h3 className="text-2xl font-bold text-white mb-3">Ready to generate your report?</h3>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            Review your entries and see your total carbon footprint before generating the final compliance report.
          </p>
          <Link
            to={`/reports/generate?periodId=${periodId}`}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-mist to-growth-green text-midnight-navy font-bold rounded-xl hover:shadow-lg hover:shadow-growth-green/30 transition-all"
          >
            <FileBarChart className="w-5 h-5" />
            Generate Report
          </Link>
        </div>
      )}
    </div>
  );
};

export default ActivitiesChecklistPage;
