import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DataTable from '../components/common/DataTable';
import { useToast } from '../components/common/Toast';
import { useAuth } from "../contexts/AuthContext";
import { reportsAPI } from '../api/reportsAPI';

const ReportsListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { user } = useAuth();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const canGenerate = user?.role === 'editor' || user?.role === 'company_admin';

  useEffect(() => {
    if (user?.companyId) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await reportsAPI.getCompanyReports(user.companyId);
      setReports(data || []);
    } catch (err) {
      console.error(err);
      error(err.message || 'Failed to load reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status, paymentStatus) => {
    // If paid, show PAID badge
    if (paymentStatus === 'succeeded') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-growth-green text-midnight-navy shadow-sm">
          ✓ PAID
        </span>
      );
    }

    // Generated but not paid
    if (status === 'draft' || status === 'generated') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500 text-midnight-navy shadow-sm">
          UNPAID
        </span>
      );
    }

    // Default status display
    const styles = {
      completed: 'bg-growth-green text-midnight-navy',
      pending: 'bg-blue-500 text-white',
      failed: 'bg-red-500 text-white',
    };

    const style = styles[status] || 'bg-stone-gray text-midnight-navy';

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${style}`}>
        {(status || 'draft').toUpperCase()}
      </span>
    );
  };

  const handleDownload = async (periodId, format) => {
    try {
      let endpoint = '';
      if (format === 'PDF') endpoint = `/exports/pdf/${periodId}`;
      else if (format === 'CSV') endpoint = `/exports/csv/${periodId}`;
      else if (format === 'Excel') endpoint = `/exports/excel/${periodId}`;

      const blob = await reportsAPI.downloadFile(endpoint);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${periodId}.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success(`${format} downloaded successfully`);
    } catch (err) {
      if (err.response && err.response.status === 402) {
        error(t('reports.paymentRequired', 'Payment required to download this report'));
        // Redirect to generate page which handles payment
        setTimeout(() => navigate(`/reports/generate?periodId=${periodId}`), 1000);
        return;
      }
      error(err.message || `Failed to download ${format}`);
    }
  };

  const handleDelete = async (reportId) => {
    try {
      await reportsAPI.deleteReport(reportId);
      success('Report deleted successfully');
      fetchReports(); // Refresh the list
    } catch (err) {
      error(err.message || 'Failed to delete report');
    }
  };

  const columns = [
    {
      key: 'name',
      header: t('reports.reportName'),
      sortable: true,
      accessor: (row) => row.period_label || 'Emissions Report',
    },
    {
      key: 'type',
      header: t('reports.type'),
      sortable: true,
      accessor: (row) => row.report_type || 'PDF',
    },
    {
      key: 'period',
      header: t('reports.period'),
      sortable: true,
      accessor: (row) => `${new Date(row.period_start_date).toLocaleDateString()} - ${new Date(row.period_end_date).toLocaleDateString()}`,
    },
    {
      key: 'status',
      header: t('reports.status'),
      sortable: true,
      render: (row) => getStatusBadge(row.status || 'draft', row.payment_status),
    },
    {
      key: 'generated_at',
      header: t('reports.generatedAt'),
      sortable: true,
      accessor: (row) => new Date(row.generated_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (row) => {
        const isPaid = row.payment_status === 'succeeded';

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/reports/${row.id}`);
              }}
              className="text-compliance-blue hover:text-cyan-mist transition-colors"
            >
              {t('common.view')}
            </button>

            {isPaid ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(row.reporting_period_id, 'PDF');
                  }}
                  className="text-cyan-mist hover:text-growth-green transition-colors"
                >
                  PDF
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(row.reporting_period_id, 'CSV');
                  }}
                  className="text-growth-green hover:text-cyan-mist transition-colors"
                >
                  CSV
                </button>
              </>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/reports/generate?periodId=${row.reporting_period_id}`);
                }}
                className="px-2 py-1 bg-yellow-500 text-midnight-navy text-xs font-bold rounded hover:bg-yellow-400 transition-colors"
              >
                Pay & Download
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to delete this report?')) {
                  handleDelete(row.id);
                }
              }}
              className="text-red-500 hover:text-red-400 transition-colors"
            >
              Delete
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-midnight-navy p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-off-white mb-2">
              {t('reports.title')}
            </h1>
            <p className="text-stone-gray">
              {t('reports.subtitle')}
            </p>
          </div>
          {canGenerate && (
            <button
              onClick={() => navigate('/reports/generate')}
              className="px-4 py-2 bg-cyan-mist text-midnight-navy rounded-lg hover:bg-growth-green transition-colors font-medium"
            >
              + {t('reports.generateReport')}
            </button>
          )}
        </div>

        {/* Reports Table */}
        <div className="bg-midnight-navy-lighter border border-carbon-gray rounded-lg p-6">
          <DataTable
            data={reports}
            columns={columns}
            loading={loading}
            searchable
            pagination
            pageSize={10}
            onRowClick={(row) => navigate(`/reports/${row.id}`)}
            emptyMessage={t('reports.noReports')}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportsListPage;
