import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { reportingPeriodsAPI } from '../api/reportingPeriodsAPI';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Plus, FileText, Calendar, Settings2, Trash2, ChevronRight } from 'lucide-react';
import NewReportingPeriodModal from '../components/forms/NewReportingPeriodModal';

const ReportingPeriodsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { user } = useAuth();

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
      closed: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Closed' },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-midnight-navy">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-mist/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-mist animate-spin"></div>
          </div>
          <p className="text-gray-400">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight-navy p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Active Reports</h1>
              <p className="text-sm text-gray-400">Manage your reporting periods</p>
            </div>
          </div>
          {canEdit && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-mist to-growth-green text-midnight-navy rounded-xl hover:shadow-lg hover:shadow-growth-green/20 transition-all font-semibold flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              New Report
            </button>
          )}
        </div>

        {/* Reports List */}
        {periods.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-cyan-mist/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-cyan-mist" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Active Reports</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Create your first reporting period to start tracking your organization's carbon emissions.
            </p>
            {canEdit && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-cyan-mist to-growth-green text-midnight-navy rounded-xl hover:shadow-lg hover:shadow-growth-green/20 transition-all font-semibold inline-flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Create New Report
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {periods.map(period => (
              <div
                key={period.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-cyan-mist/30 transition-all group"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Report Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-mist/20 to-growth-green/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-cyan-mist" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-bold text-white truncate">{period.period_label}</h3>
                        {getStatusBadge(period.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(period.period_start_date)} — {formatDate(period.period_end_date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="hidden md:flex items-center gap-8 text-sm text-gray-400 mr-4">
                    <div className="text-center">
                      <span className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Type</span>
                      <span className="text-white capitalize font-medium">{period.period_type}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Standard</span>
                      <span className="text-white font-medium">{period.reporting_standard?.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewReport(period.id)}
                      className="px-4 py-2 bg-cyan-mist/10 text-cyan-mist text-sm font-medium rounded-xl hover:bg-cyan-mist hover:text-midnight-navy transition-all flex items-center gap-2"
                    >
                      {canEdit ? 'Edit' : 'View'}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    {canEdit && (
                      <>
                        <button
                          onClick={() => handleEditBoundary(period.id)}
                          className="p-2 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 hover:text-white transition-all"
                          title="Edit Boundary Questions"
                        >
                          <Settings2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeletePeriod(period.id, period.period_label)}
                          className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                          title="Delete Report"
                        >
                          <Trash2 className="w-5 h-5" />
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
