import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import DataTable from '../../components/common/DataTable';
import { reportsAPI } from '../../api/reportsAPI';
import { reportingPeriodsAPI } from '../../api/reportingPeriodsAPI';

const ReportHistoryPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [periods, setPeriods] = useState([]);

  useEffect(() => {
    fetchReportHistory();
    fetchPeriods();
  }, []);

  const fetchReportHistory = async () => {
    try {
      setLoading(true);
      const companyId = localStorage.getItem('selectedCompanyId');

      const data = await reportsAPI.getCompanyReports(companyId);
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching report history:', error);
      toast.error('Failed to load report history');
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriods = async () => {
    try {
      const companyId = localStorage.getItem('selectedCompanyId');
      const data = await reportingPeriodsAPI.listPeriods(companyId);
      setPeriods(data.reportingPeriods || []);
    } catch (error) {
      console.error('Error fetching periods:', error);
    }
  };

  const handleDownload = async (reportId, reportType, periodLabel) => {
    try {
      // Use the correct endpoint for downloading by report ID
      // backend/src/routes/reportHistoryRoutes.js: router.get('/download/:reportId', ...)
      // Mounted at /api/reports/history
      const endpoint = `/reports/history/download/${reportId}`;
      const blob = await reportsAPI.downloadFile(endpoint);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = reportType === 'PDF' ? 'pdf' : reportType === 'CSV' ? 'csv' : 'xlsx';
      a.download = `${periodLabel}_report.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await reportsAPI.deleteReport(reportId);
      toast.success('Report deleted successfully');
      fetchReportHistory();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      succeeded: { color: 'bg-green-500/20 text-green-300', label: 'Paid' },
      pending: { color: 'bg-yellow-500/20 text-yellow-300', label: 'Pending' },
      failed: { color: 'bg-red-500/20 text-red-300', label: 'Failed' },
      refunded: { color: 'bg-gray-500/20 text-gray-300', label: 'Refunded' }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getReportTypeBadge = (type) => {
    const colors = {
      PDF: 'bg-red-500/20 text-red-300',
      CSV: 'bg-blue-500/20 text-blue-300',
      EXCEL: 'bg-green-500/20 text-green-300'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[type] || colors.PDF}`}>
        {type}
      </span>
    );
  };

  const filteredReports = selectedPeriod === 'all'
    ? reports
    : reports.filter(report => report.reporting_period_id === selectedPeriod);

  const columns = [
    {
      key: 'generated_at',
      label: 'Generated Date',
      render: (value) => new Date(value).toLocaleString()
    },
    {
      key: 'period_label',
      label: 'Reporting Period'
    },
    {
      key: 'report_type',
      label: 'Type',
      render: (value) => getReportTypeBadge(value)
    },
    {
      key: 'payment_status',
      label: 'Payment',
      render: (value) => getPaymentStatusBadge(value)
    },
    {
      key: 'amount_paid',
      label: 'Amount',
      render: (value, row) => {
        if (row.payment_status === 'succeeded') {
          return `€${(value / 100).toFixed(2)}`;
        }
        return '-';
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleDownload(row.id, row.report_type, row.period_label)}
            className="px-3 py-1 text-sm rounded bg-cyan-mist/20 text-cyan-mist hover:bg-cyan-mist/30 transition-colors"
          >
            Download
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="px-3 py-1 text-sm rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading report history...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Report History</h1>
          <p className="text-gray-300">View and download your generated reports</p>
        </div>

        <button
          onClick={() => navigate('/reports')}
          className="px-4 py-2 rounded-lg bg-cyan-mist text-midnight-navy font-semibold hover:bg-cyan-mist/80 transition-colors"
        >
          Generate New Report
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-primary-light border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <label className="text-white font-medium">Filter by Period:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
          >
            <option value="all">All Periods</option>
            {periods.map(period => (
              <option key={period.id} value={period.id}>
                {period.period_label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-primary-light border border-gray-700 rounded-lg p-6">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Reports Found</h3>
            <p className="text-gray-400 mb-6">
              {selectedPeriod === 'all'
                ? 'You haven\'t generated any reports yet.'
                : 'No reports found for the selected period.'}
            </p>
            <button
              onClick={() => navigate('/reports')}
              className="px-6 py-2 rounded-lg bg-cyan-mist text-midnight-navy font-semibold hover:bg-cyan-mist/80 transition-colors"
            >
              Generate Your First Report
            </button>
          </div>
        ) : (
          <DataTable
            data={filteredReports}
            columns={columns}
            searchable={false}
          />
        )}
      </div>

      {/* Stats */}
      {reports.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-primary-light border border-gray-700 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Total Reports</div>
            <div className="text-2xl font-bold text-white">{reports.length}</div>
          </div>
          <div className="bg-primary-light border border-gray-700 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">PDF Reports</div>
            <div className="text-2xl font-bold text-white">
              {reports.filter(r => r.report_type === 'PDF').length}
            </div>
          </div>
          <div className="bg-primary-light border border-gray-700 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">CSV/Excel Reports</div>
            <div className="text-2xl font-bold text-white">
              {reports.filter(r => r.report_type === 'CSV' || r.report_type === 'EXCEL').length}
            </div>
          </div>
          <div className="bg-primary-light border border-gray-700 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Total Spent</div>
            <div className="text-2xl font-bold text-white">
              €{(reports.reduce((sum, r) => sum + (r.payment_status === 'succeeded' ? r.amount_paid : 0), 0) / 100).toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportHistoryPage;
