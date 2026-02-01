import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/common/Toast';
import { activitiesAPI } from '../api/activitiesAPI';
import { useAuth } from "../contexts/AuthContext";
import { PencilSquareIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const ActivityDetailsPage = () => {
  const { t } = useTranslation();
  const { activityType, activityId } = useParams();
  const [searchParams] = useSearchParams();
  const periodId = searchParams.get('periodId');
  const navigate = useNavigate();
  const { error } = useToast();
  const { user } = useAuth();
  
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  const canEdit = user?.role === 'editor' || user?.role === 'company_admin';

  useEffect(() => {
    fetchActivity();
  }, [activityId, activityType]);

  const fetchActivity = async () => {
    try {
      const data = await activitiesAPI.getActivity(user.companyId, activityType, activityId || activity.id);
      setActivity(data.activity || data);
    } catch (err) {
      console.error('Failed to fetch activity:', err);
      error(err.response?.data?.message || 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (periodId) {
      navigate(`/reports/${periodId}/activities/${activityType}`);
    } else {
      navigate('/reporting-periods');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight-navy flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-mist border-t-transparent"></div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-midnight-navy p-4 flex items-center justify-center">
        <div className="max-w-sm w-full bg-white/5 border border-white/10 rounded-xl p-6 text-center">
          <p className="text-gray-400 text-sm mb-4">{t('activities.notFound')}</p>
          <button onClick={handleBack} className="px-4 py-2 bg-cyan-mist text-midnight-navy rounded-lg text-sm font-medium hover:bg-growth-green transition-all">
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight-navy text-white p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Compact Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all">
               <ArrowLeftIcon className="h-4 w-4 text-cyan-mist" />
            </button>
            <div>
              <p className="text-[9px] uppercase font-bold tracking-widest text-cyan-mist/70 mb-0.5">Activity Record</p>
              <h1 className="text-xl font-bold tracking-tight">
                {activityType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </h1>
            </div>
          </div>
          {canEdit && (
            <button
              onClick={() => navigate(`/activities/${activityType}/${activityId}/edit${periodId ? `?periodId=${periodId}` : ''}`)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-sm font-medium flex items-center gap-2"
            >
              <PencilSquareIcon className="h-4 w-4 text-cyan-mist" />
              {t('common.edit')}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Block */}
          <div className="lg:col-span-2">
             <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                   <div className="w-1 h-4 bg-cyan-mist rounded-full"></div>
                   Entry Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(activity).map(([key, value]) => {
                    if (['id', 'entered_by', 'company_id', 'created_at', 'updated_at', 'calculation_result', 'co2e_kg', 'co2e', 'co2_kg', 'ch4_kg', 'n2o_kg'].includes(key) || key.includes('purpose')) return null;
                    if (typeof value === 'object' && value !== null) return null;
                    if (value === null || value === '') return null;
                    
                    return (
                      <div key={key} className="p-3 bg-white/[0.03] border border-white/5 rounded-lg">
                        <p className="text-[9px] text-stone-gray font-bold uppercase tracking-wider mb-0.5">
                          {key.replace(/_/g, ' ')}
                        </p>
                        <p className="text-white text-sm capitalize">
                          {value}
                        </p>
                      </div>
                    );
                  })}
                </div>
             </div>
          </div>

          {/* Sidebar / Stats Block */}
          <div className="lg:col-span-1 space-y-4">
             {/* Emission Headliner */}
             <div className="bg-gradient-to-br from-cyan-mist/10 to-transparent border border-cyan-mist/20 rounded-xl p-5 text-center">
                <p className="text-[9px] font-bold text-cyan-mist uppercase tracking-widest mb-2">Total Footprint</p>
                <div className="text-4xl font-black text-white mb-1 tabular-nums">
                   {parseFloat(activity.co2e_kg || activity.co2e || 0).toFixed(2)}
                </div>
                <div className="inline-block px-3 py-1 bg-cyan-mist text-midnight-navy text-[9px] font-bold rounded uppercase tracking-wider mb-4">
                   KG CO₂e
                </div>

                <div className="flex flex-col gap-2 text-xs">
                   {(activity.co2_kg || activity.co2) && (
                     <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-stone-gray">CO₂</span>
                        <span className="font-medium">{parseFloat(activity.co2_kg || activity.co2 || 0).toFixed(2)} kg</span>
                     </div>
                   )}
                   {(activity.ch4_kg || activity.ch4) && (
                     <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-stone-gray">CH₄</span>
                        <span className="font-medium">{parseFloat(activity.ch4_kg || activity.ch4 || 0).toFixed(2)} kg</span>
                     </div>
                   )}
                   {(activity.n2o_kg || activity.n2o) && (
                     <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-stone-gray">N₂O</span>
                        <span className="font-medium">{parseFloat(activity.n2o_kg || activity.n2o || 0).toFixed(2)} kg</span>
                     </div>
                   )}
                </div>
             </div>

             {/* Meta Data Card */}
             <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="space-y-3 text-xs">
                  <div>
                    <p className="text-[9px] font-bold text-stone-gray uppercase tracking-wider mb-1">Created</p>
                    <p className="text-gray-300">
                      {new Date(activity.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-stone-gray uppercase tracking-wider mb-1">Last Updated</p>
                    <p className="text-gray-300">
                      {new Date(activity.updated_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailsPage;
