import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { reportingPeriodsAPI } from '../api/reportingPeriodsAPI';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import NewReportingPeriodModal from '../components/forms/NewReportingPeriodModal';

const ReportingPeriodsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { user
 } = useAuth();

  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const canEdit = ['editor', 'company_admin', 'internal_admin'].includes(user?.role);

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const data = await reportingPeriodsAPI.listPeriods(user.companyId);
      const periodsArray = data.periods || data.reportingPeriods || [];
      // Filter to show only unpaid/active reports
      const activeReports = Array.isArray(periodsArray) ? periodsArray.filter(p => p.status !== 'paid') : [];
      setPeriods(activeReports);
    } catch (err) {
      console.error('Failed to load reports:', err);
      error(t('activeReports.loadError', 'Failed to load reports'));
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodCreated = (newPeriod) => {
    success(t('activeReports.createSuccess', 'Report created successfully'));
    setShowCreateModal(false);
    navigate(`/settings/boundary/${newPeriod.id}`);
  };

  const handleDeletePeriod = async (periodId, periodLabel) => {
    if (!window.confirm(`Are you sure you want to delete "${periodLabel}"? All associated data will be permanently lost.`)) {
      return;
    }

    try {
      await reportingPeriodsAPI.deletePeriod(user.companyId, periodId);
      success(t('activeReports.deleteSuccess', 'Report deleted successfully'));
      fetchPeriods();
    } catch (err) {
      console.error('Failed to delete report:', err);
      error(err.response?.data?.error || t('activeReports.deleteError', 'Failed to delete report'));
    }
  };

  const handleViewReport = (periodId) => {
    navigate(`/reports/${periodId}/activities`);
  };

  const handleEditBoundary = (periodId) => {
    navigate(`/settings/boundary/${periodId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Draft' },
      active: { bg: 'bg-growth-green/20', text: 'text-growth-green', label: 'Active' },
      closed: { bg: 'bg-stone-gray/20', text: 'text-stone-gray', label: 'Closed' },
    };
    
    const config = statusConfig[status] || statusConfig.draft;

    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-midnight-navy">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-mist border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight-navy p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
            >
              <ArrowLeftIcon className="h-4 w-4 text-cyan-mist" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Active Reports</h1>
              <p className="text-xs text-stone-gray">Manage your unpaid reporting periods</p>
            </div>
          </div>
          {canEdit && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-cyan-mist text-midnight-navy rounded-lg hover:bg-growth-green transition-colors text-sm font-medium flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              New Report
            </button>
          )}
        </div>

        {/* Reports List */}
        {periods.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-lg font-bold text-white mb-2">No Active Reports</h3>
            <p className="text-sm text-stone-gray mb-4">
              Create your first report to start tracking emissions data.
            </p>
            {canEdit && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-cyan-mist text-midnight-navy rounded-lg hover:bg-growth-green transition-colors text-sm font-medium"
              >
                Create New Report
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {periods.map(period => (
              <div
                key={period.id}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-cyan-mist/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  {/* Report Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-cyan-mist/10 rounded-lg flex items-center justify-center">
                      <span className="text-cyan-mist text-lg font-bold">R</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-bold text-white truncate">{period.period_label}</h3>
                        {getStatusBadge(period.status)}
                      </div>
                      <p className="text-xs text-stone-gray">
                        {formatDate(period.period_start_date)} — {formatDate(period.period_end_date)}
                      </p>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="hidden sm:flex items-center gap-6 text-xs text-stone-gray mr-6">
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider mb-0.5">Type</span>
                      <span className="text-white capitalize">{period.period_type}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider mb-0.5">Standard</span>
                      <span className="text-white">{period.reporting_standard?.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewReport(period.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        canEdit 
                          ? 'bg-cyan-mist/10 text-cyan-mist hover:bg-cyan-mist hover:text-midnight-navy' 
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {canEdit ? 'Edit Report' : 'View Details'}
                    </button>
                    {canEdit && (
                      <>
                        <button
                          onClick={() => handleEditBoundary(period.id)}
                          className="px-3 py-1.5 bg-white/5 text-stone-gray text-xs font-medium rounded-lg hover:bg-white/10 hover:text-white transition-all"
                        >
                          Edit Questions
                        </button>
                        <button
                          onClick={() => handleDeletePeriod(period.id, period.period_label)}
                          className="px-3 py-1.5 bg-red-500/10 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500 hover:text-white transition-all"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Report Modal */}
      <NewReportingPeriodModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handlePeriodCreated}
        companyId={user?.companyId}
      />
    </div>
  );
};

export default ReportingPeriodsPage;

