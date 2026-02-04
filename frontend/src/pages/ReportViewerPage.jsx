import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/common/Toast';
import { useAuth } from "../contexts/AuthContext";

const ReportViewerPage = () => {
  const { t } = useTranslation();
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { error: showError, success } = useToast();
  const { user } = useAuth();
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/history/details/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }
      
      const data = await response.json();
      setReport(data.report || data);
    } catch (err) {
      showError(err.message || 'Failed to load report');
      setTimeout(() => navigate('/reports'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!report) return;
    try {
      const token = localStorage.getItem('token');
      // Use export endpoint with periodId to force PDF generation/retrieval
      const response = await fetch(`/api/exports/pdf/${report.reporting_period_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${report.period_label || reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      success('PDF downloaded successfully');
    } catch (err) {
      showError(err.message || 'Failed to download PDF');
    }
  };

  const handleDownloadCSV = async () => {
    if (!report) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/exports/csv/${report.reporting_period_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download CSV');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      success('CSV downloaded successfully');
    } catch (err) {
      showError(err.message || 'Failed to download CSV');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight-navy flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-growth-green mx-auto mb-4"></div>
          <p className="text-cyan-mist">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-midnight-navy p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-red-500">{t('reports.notFound')}</p>
          <button onClick={() => navigate('/reports')} className="mt-4 btn-primary">
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  const totalEmissions = report.kpis?.total_emissions || 0;
  const scope1 = report.kpis?.scope_breakdown?.['Scope 1'] || 0;
  const scope2 = report.kpis?.scope_breakdown?.['Scope 2'] || 0;
  const scope3 = report.kpis?.scope_breakdown?.['Scope 3'] || 0;

  return (
    <div className="min-h-screen bg-midnight-navy p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/reports')}
            className="text-cyan-mist hover:text-growth-green mb-4 flex items-center gap-2 text-sm sm:text-base"
          >
            ← {t('common.back')}
          </button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {report.period_label || 'Report'}
              </h1>
              <p className="text-stone-gray text-sm sm:text-base">
                CSRD Standard • {new Date(report.period_start_date).toLocaleDateString()} - {new Date(report.period_end_date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleDownloadPDF}
                className="px-3 sm:px-4 py-2 bg-growth-green text-midnight-navy rounded-lg hover:bg-opacity-80 transition-all font-medium text-sm"
              >
                📄 PDF
              </button>
              <button
                onClick={handleDownloadCSV}
                className="px-3 sm:px-4 py-2 bg-compliance-blue text-midnight-navy rounded-lg hover:bg-opacity-80 transition-all font-medium text-sm"
              >
                📊 CSV
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
          <div className="bg-midnight-navy-lighter border border-carbon-gray rounded-lg p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-stone-gray mb-2">{t('reports.totalEmissions')}</p>
            <p className="text-2xl sm:text-3xl font-bold text-cyan-mist">
              {(totalEmissions / 1000).toFixed(1)}
            </p>
            <p className="text-xs text-stone-gray mt-1">MT CO₂e</p>
          </div>
          <div className="bg-midnight-navy-lighter border border-carbon-gray rounded-lg p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-stone-gray mb-2">Scope 1</p>
            <p className="text-2xl sm:text-3xl font-bold text-white">
              {(scope1 / 1000).toFixed(1)}
            </p>
            <p className="text-xs text-stone-gray mt-1">MT CO₂e</p>
          </div>
          <div className="bg-midnight-navy-lighter border border-carbon-gray rounded-lg p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-stone-gray mb-2">Scope 2</p>
            <p className="text-2xl sm:text-3xl font-bold text-white">
              {(scope2 / 1000).toFixed(1)}
            </p>
            <p className="text-xs text-stone-gray mt-1">MT CO₂e</p>
          </div>
          <div className="bg-midnight-navy-lighter border border-carbon-gray rounded-lg p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-stone-gray mb-2">Scope 3</p>
            <p className="text-2xl sm:text-3xl font-bold text-white">
              {(scope3 / 1000).toFixed(1)}
            </p>
            <p className="text-xs text-stone-gray mt-1">MT CO₂e</p>
          </div>
        </div>

        {/* Activity Breakdown */}
        {report.activity_breakdown && (
          <div className="bg-midnight-navy-lighter border border-carbon-gray rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Emissions by Activity Type</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-carbon-gray">
                    <th className="text-left py-3 px-2 text-stone-gray">Activity Type</th>
                    <th className="text-right py-3 px-2 text-stone-gray">Emissions (MT CO₂e)</th>
                    <th className="text-right py-3 px-2 text-stone-gray">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(report.activity_breakdown).map(([type, data]) => (
                    <tr key={type} className="border-b border-carbon-gray hover:bg-midnight-navy transition-colors">
                      <td className="py-3 px-2 text-white capitalize">{type.replace(/_/g, ' ')}</td>
                      <td className="text-right py-3 px-2 text-cyan-mist font-medium">
                        {((data.total || 0) / 1000).toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-2 text-stone-gray">{data.count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Traffic Light Score */}
        {report.traffic_light && (
          <div className="mt-6 bg-midnight-navy-lighter border border-carbon-gray rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Sustainability Score</h2>
            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${
                report.traffic_light === 'green' ? 'bg-green-500 text-white' :
                report.traffic_light === 'yellow' ? 'bg-yellow-500 text-black' :
                'bg-red-500 text-white'
              }`}>
                {report.traffic_light === 'green' ? '✓' : report.traffic_light === 'yellow' ? '⚠' : '✗'}
              </div>
              <div>
                <p className="text-stone-gray text-sm">Current Rating</p>
                <p className="text-white text-lg font-semibold capitalize">{report.traffic_light}</p>
                <p className="text-stone-gray text-xs mt-1 max-w-xs">
                  {report.traffic_light === 'green' ? 'Good sustainability performance' :
                   report.traffic_light === 'yellow' ? 'Room for improvement' :
                   'Needs immediate attention'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Section */}
        {report.recommendations && report.recommendations.length > 0 && (
          <div className="mt-6 bg-midnight-navy-lighter border border-carbon-gray rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Key Recommendations</h2>
            <ul className="list-disc pl-6 text-white text-sm">
              {report.recommendations.map((rec, idx) => (
                <li key={idx} className="mb-2">{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Audit Trail Section */}
        {report.audit_trail && report.audit_trail.length > 0 && (
          <div className="mt-6 bg-midnight-navy-lighter border border-carbon-gray rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Audit Trail</h2>
            <ul className="list-disc pl-6 text-white text-sm">
              {report.audit_trail.map((entry, idx) => (
                <li key={idx} className="mb-2">{entry}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Certification Section */}
        {report.certification && (
          <div className="mt-6 bg-midnight-navy-lighter border border-carbon-gray rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Certification</h2>
            <p className="text-white text-sm mb-2">{report.certification.text}</p>
            {report.certification.signed_by && (
              <div className="text-stone-gray text-xs">Signed by: {report.certification.signed_by}</div>
            )}
            {report.certification.date && (
              <div className="text-stone-gray text-xs">Date: {new Date(report.certification.date).toLocaleDateString()}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportViewerPage;
