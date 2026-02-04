import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../contexts/AuthContext';
import { reportingPeriodsAPI } from '../api/reportingPeriodsAPI';
import { dashboardAPI } from '../api/dashboardAPI';
import { 
  ArrowRightIcon, 
  ArrowDownTrayIcon, 
  TableCellsIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/solid';

const GenerateReportPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const periodId = searchParams.get('periodId');

  const [formData, setFormData] = useState({
    reportType: 'csrd',
    includeCharts: true,
    includeDetails: true,
    includeBreakdown: true,
  });
  const [generating, setGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [reportId, setReportId] = useState(null);
  
  // New state for period selection
  const [periods, setPeriods] = useState([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  // Always fetch periods to have timeline info available
  useEffect(() => {
    const fetchPeriods = async () => {
      if (!user?.companyId) return;
      
      setLoadingPeriods(true);
      try {
        const data = await reportingPeriodsAPI.listPeriods(user.companyId);
        const periodsArray = data.periods || data.reportingPeriods || [];
        setPeriods(Array.isArray(periodsArray) ? periodsArray : []);
        
        // If periodId is provided, find and set the selected period
        if (periodId && periodsArray.length > 0) {
          const found = periodsArray.find(p => p.id === periodId);
          setSelectedPeriod(found || null);
        } else if (periodsArray.length === 1 && !periodId) {
          // Auto-select if only one period exists
          setSearchParams({ periodId: periodsArray[0].id });
        }
      } catch (err) {
        console.error('Failed to load periods', err);
        error('Failed to load reporting periods');
      } finally {
        setLoadingPeriods(false);
      }
    };
    
    fetchPeriods();
  }, [user?.companyId, periodId]);

  // Handle payment and summary when periodId is set
  useEffect(() => {
    if (!periodId) return;

    // Handle payment redirect parameters
    if (searchParams.get('payment_success') === 'true') {
      setIsPaid(true);
      setReportGenerated(true);
      success('Payment successful! Your report is ready.');
      // Clear params to avoid repeat toasts
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('payment_success');
      setSearchParams(newParams, { replace: true });
    } else if (searchParams.get('payment_cancelled') === 'true') {
      error('Payment was cancelled.');
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('payment_cancelled');
      setSearchParams(newParams, { replace: true });
    }

    const checkPaymentStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/payments/verify/${periodId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.paid) {
            setIsPaid(true);
          }
        }
      } catch (err) {
        console.error('Failed to check payment status', err);
      }
    };

    const fetchSummary = async () => {
      setLoadingSummary(true);
      try {
        const data = await dashboardAPI.getKPIs(user.companyId, periodId);
        setSummaryData(data);
      } catch (err) {
        console.error('Failed to fetch summary data', err);
      } finally {
        setLoadingSummary(false);
      }
    };

    checkPaymentStatus();
    fetchSummary();
  }, [periodId, navigate, user?.companyId, setSearchParams, searchParams, success, error]);

  const handleChange = (e) => {
    const { name, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : e.target.value,
    }));
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const token = localStorage.getItem('token');
      
      // Attempt to generate/download report logic
      // Note: The backend exportPDF endpoint checks for payment.
      // If paid, it returns the PDF. If not, it returns 402.
      
      const queryParams = new URLSearchParams({
        lang: formData.language || 'en',
        includeDetails: formData.includeDetails,
        includeBreakdown: formData.includeBreakdown,
        includeCharts: formData.includeCharts,
        reportType: formData.reportType
      }).toString();

      const generateResponse = await fetch(`/api/exports/pdf/${periodId}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (generateResponse.status === 402) {
        // Payment required
        setReportGenerated(true); // Switch to "Result/Payment" view
        setIsPaid(false); // Ensure we show payment button
        // Don't show success toast yet, maybe an info toast
        return; 
      }

      if (!generateResponse.ok) {
        throw new Error('Failed to generate report');
      }

      // If we got here, it effectively succeeded (or user is previously paid)
      // For the "Generate" flow, we might want to just show the success state.
      // The actual download happens via handleDownload.
      
      const newReportId = Math.random().toString(36).substr(2, 9);
      setReportId(newReportId);
      setReportGenerated(true);
      setIsPaid(true);
      success(t('reports.generateSuccess'));
    } catch (err) {
      error(err.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleProceedToPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Create Stripe checkout session
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportingPeriodId: periodId,
          metadata: {
            reportType: formData.reportType,
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      
      if (data.session?.url) {
        // Redirect to Stripe checkout
        window.location.href = data.session.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      error(err.message || 'Failed to proceed to payment');
    }
  };

  const handleDownload = async (format) => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        lang: formData.language || 'en',
        includeDetails: formData.includeDetails,
        includeBreakdown: formData.includeBreakdown,
        includeCharts: formData.includeCharts,
        reportType: formData.reportType
      }).toString();

      let endpoint = '';
      if (format === 'pdf') endpoint = `/api/exports/pdf/${periodId}?${queryParams}`;
      else if (format === 'csv') endpoint = `/api/exports/csv/${periodId}?${queryParams}`;
      else if (format === 'excel') endpoint = `/api/exports/excel/${periodId}?${queryParams}`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 402) {
         error('Payment required to download this report');
         setIsPaid(false);
         setReportGenerated(true);
         return;
      }

      if (!response.ok) {
        throw new Error(`Failed to download ${format.toUpperCase()}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${periodId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success(`${format.toUpperCase()} downloaded successfully`);
    } catch (err) {
      error(err.message || `Failed to download ${format.toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-midnight-navy p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-cyan-mist hover:text-growth-green mb-4 flex items-center gap-2 text-sm"
          >
            ← {t('common.back')}
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {t('reports.generateReport')}
          </h1>
          <p className="text-stone-gray text-sm">
            {t('reports.generateSubtitle')}
          </p>
        </div>


        {!periodId ? (
          <div className="bg-midnight-navy-lighter border border-carbon-gray rounded-lg p-6 max-w-2xl mx-auto shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Select Reporting Period</h2>
            {loadingPeriods ? (
              <div className="text-cyan-mist flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-mist border-t-transparent"></div>
                Loading periods...
              </div>
            ) : periods.length > 0 ? (
              <div className="space-y-4">
                <p className="text-stone-gray mb-4">Please select a reporting period to generate a report for.</p>
                <div className="grid gap-4">
                  {periods.map(period => (
                    <button
                      key={period.id}
                      onClick={() => setSearchParams({ periodId: period.id })}
                      className="w-full text-left p-4 bg-midnight-navy border border-carbon-gray rounded-lg hover:border-cyan-mist hover:bg-midnight-navy/80 transition-all group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-white group-hover:text-cyan-mist">{period.period_label}</span>
                        <div className="flex items-center gap-4">
                           <span className="text-sm text-stone-gray">
                              {new Date(period.period_start_date).toLocaleDateString()} - {new Date(period.period_end_date).toLocaleDateString()}
                           </span>
                           <ArrowRightIcon className="h-4 w-4 text-stone-gray group-hover:text-cyan-mist" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-stone-gray mb-4">No reporting periods found.</p>
                <button
                   onClick={() => navigate('/settings/reporting-periods')}
                   className="px-4 py-2 bg-cyan-mist text-midnight-navy rounded-lg hover:bg-growth-green transition-colors font-bold"
                >
                  Manage Reporting Periods
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Configuration & Status */}
            <div className="md:col-span-1 space-y-6">
              {/* Status Card */}
              <div className="bg-midnight-navy-lighter border border-carbon-gray rounded-2xl p-6 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-3">
                  {isPaid ? (
                    <span className="px-3 py-1 bg-growth-green text-midnight-navy text-xs font-black rounded-full uppercase tracking-tighter shadow-lg">
                      Paid
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-500 text-midnight-navy text-xs font-black rounded-full uppercase tracking-tighter shadow-lg">
                      Generated
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${isPaid ? 'bg-growth-green animate-pulse' : 'bg-yellow-500'}`}></div>
                   Report Status
                </h2>
                
                <div className="space-y-4">
                  <div className="p-3 bg-midnight-navy/50 rounded-xl border border-carbon-gray/50">
                    <p className="text-xs text-stone-gray uppercase font-bold tracking-widest mb-1">Company</p>
                    <p className="text-white font-medium">{user?.companyName || 'Your Company'}</p>
                  </div>
                  <div className="p-3 bg-midnight-navy/50 rounded-xl border border-carbon-gray/50">
                    <p className="text-xs text-stone-gray uppercase font-bold tracking-widest mb-1">Report Period</p>
                    {loadingPeriods ? (
                      <div className="h-5 w-32 bg-white/10 animate-pulse rounded"></div>
                    ) : selectedPeriod ? (
                      <p className="text-white font-medium">{selectedPeriod.period_label}</p>
                    ) : (
                      <p className="text-stone-gray text-sm">Loading...</p>
                    )}
                  </div>
                  <div className="p-3 bg-midnight-navy/50 rounded-xl border border-carbon-gray/50">
                    <p className="text-xs text-stone-gray uppercase font-bold tracking-widest mb-1">Timeline</p>
                    {loadingPeriods ? (
                      <div className="h-5 w-40 bg-white/10 animate-pulse rounded"></div>
                    ) : selectedPeriod ? (
                      <p className="text-white font-medium">
                        {new Date(selectedPeriod.period_start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} — {new Date(selectedPeriod.period_end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    ) : (
                      <p className="text-stone-gray text-sm">Loading...</p>
                    )}
                  </div>
                </div>

                {!isPaid && (
                  <div className="mt-8 space-y-4">
                    <div className="p-4 bg-growth-green/5 border border-growth-green/20 rounded-xl">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-stone-gray text-sm">Full PDF Export</span>
                        <span className="text-white font-bold">€49.00</span>
                      </div>
                      <p className="text-xs text-stone-gray">Includes CSRD compliance, audit trails, and multi-format exports.</p>
                    </div>
                    <button
                      onClick={handleProceedToPayment}
                      className="w-full py-4 bg-cyan-mist text-midnight-navy font-black rounded-xl hover:bg-growth-green transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                    >
                      Unlock Full Access →
                    </button>
                    <p className="text-[10px] text-center text-stone-gray">One-time payment. Multi-user access included.</p>
                  </div>
                )}

                {isPaid && (
                  <div className="mt-8 space-y-3">
                    <button
                      onClick={() => handleDownload('pdf')}
                      className="w-full py-3 bg-midnight-navy border border-cyan-mist/30 text-cyan-mist font-bold rounded-xl hover:bg-cyan-mist hover:text-midnight-navy transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" /> Download PDF
                    </button>
                    <button
                      onClick={() => handleDownload('csv')}
                      className="w-full py-3 bg-midnight-navy border border-carbon-gray text-off-white font-bold rounded-xl hover:bg-midnight-navy-lighter transition-all flex items-center justify-center gap-2"
                    >
                      <TableCellsIcon className="h-5 w-5" /> Download CSV
                    </button>
                  </div>
                )}
              </div>

              {/* Configuration Card */}
              {!isPaid && (
                <div className="bg-midnight-navy-lighter border border-carbon-gray rounded-2xl p-6 shadow-xl">
                  <h2 className="text-lg font-bold text-white mb-4">Report Details</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-gray uppercase tracking-widest mb-2">Standard</label>
                      <select
                        name="reportType"
                        value={formData.reportType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-midnight-navy border border-carbon-gray text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-mist"
                      >
                        <option value="csrd">CSRD (Compliance)</option>
                        <option value="ghg">GHG Protocol</option>
                        <option value="iso">ISO 14064</option>
                      </select>
                    </div>
                    <div className="space-y-3 pt-2">
                       <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          name="includeCharts"
                          checked={formData.includeCharts}
                          onChange={handleChange}
                          className="w-4 h-4 rounded border-carbon-gray bg-midnight-navy text-cyan-mist focus:ring-cyan-mist"
                        />
                        <span className="text-sm text-off-white group-hover:text-cyan-mist transition-colors">Include Charts</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          name="includeDetails"
                          checked={formData.includeDetails}
                          onChange={handleChange}
                          className="w-4 h-4 rounded border-carbon-gray bg-midnight-navy text-cyan-mist focus:ring-cyan-mist"
                        />
                        <span className="text-sm text-off-white group-hover:text-cyan-mist transition-colors">Detailed Breakdown</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Report Preview - Dark Theme */}
            <div className="md:col-span-2">
              <div className="bg-midnight-navy border border-white/10 rounded-xl p-6 text-white">
                {/* Report Header */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-mist to-growth-green rounded-lg flex items-center justify-center text-midnight-navy text-[10px] font-black">AX</div>
                    <div>
                      <span className="font-bold text-lg text-white">Aurixon.ai</span>
                      <p className="text-[9px] text-stone-gray uppercase tracking-wider">Emissions Report</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-cyan-mist/20 text-cyan-mist text-[9px] font-bold rounded uppercase">Confidential</span>
                    <p className="text-[10px] text-stone-gray mt-1">{new Date().toLocaleDateString('en-GB')}</p>
                  </div>
                </div>

                {loadingSummary ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <div className="w-8 h-8 border-2 border-cyan-mist border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-stone-gray uppercase tracking-wider">Loading data...</p>
                  </div>
                ) : summaryData ? (
                  <div className="space-y-6">
                    {/* Scope Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Scope 1 */}
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-bold text-white">Scope 01</p>
                            <p className="text-[9px] text-stone-gray uppercase tracking-wider">Direct</p>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-black text-white tabular-nums">{parseFloat(summaryData.scope1 || 0).toFixed(2)}</span>
                            <span className="text-[9px] block text-stone-gray uppercase">MT CO₂e</span>
                          </div>
                        </div>
                      </div>

                      {/* Scope 2 Location */}
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-bold text-white flex items-center gap-1">
                              Scope 02 <span className="px-1 py-0.5 text-[8px] bg-stone-gray/30 text-stone-gray rounded">LOC</span>
                            </p>
                            <p className="text-[9px] text-stone-gray uppercase tracking-wider">Indirect Energy</p>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-black text-white tabular-nums">{parseFloat(summaryData.scope2_location || summaryData.scope2 || 0).toFixed(2)}</span>
                            <span className="text-[9px] block text-stone-gray uppercase">MT CO₂e</span>
                          </div>
                        </div>
                      </div>

                      {/* Scope 2 Market */}
                      <div className="bg-white/5 border border-cyan-mist/20 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-bold text-white flex items-center gap-1">
                              Scope 02 <span className="px-1 py-0.5 text-[8px] bg-cyan-mist/20 text-cyan-mist rounded">MKT</span>
                            </p>
                            <p className="text-[9px] text-stone-gray uppercase tracking-wider">Contractual</p>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-black text-cyan-mist tabular-nums">{parseFloat(summaryData.scope2_market || 0).toFixed(2)}</span>
                            <span className="text-[9px] block text-stone-gray uppercase">MT CO₂e</span>
                          </div>
                        </div>
                      </div>

                      {/* Scope 3 */}
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-bold text-white">Scope 03</p>
                            <p className="text-[9px] text-stone-gray uppercase tracking-wider">Supply Chain</p>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-black text-white tabular-nums">{parseFloat(summaryData.scope3 || 0).toFixed(2)}</span>
                            <span className="text-[9px] block text-stone-gray uppercase">MT CO₂e</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="bg-gradient-to-r from-cyan-mist/10 to-growth-green/10 border border-cyan-mist/20 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-stone-gray uppercase tracking-wider mb-1">Total Impact</p>
                          <p className="text-[9px] text-cyan-mist">GHG Protocol Standard</p>
                        </div>
                        <div className="text-right">
                          <span className="text-4xl font-black text-white tabular-nums">{parseFloat(summaryData.total_emissions || summaryData.totalEmissions || 0).toFixed(2)}</span>
                          <span className="ml-2 px-2 py-0.5 bg-cyan-mist text-midnight-navy text-[9px] font-bold rounded uppercase">NET MT CO₂e</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-growth-green animate-pulse"></div>
                        <span className="text-[9px] text-stone-gray uppercase tracking-wider">Live Draft</span>
                      </div>
                      <span className="text-[9px] text-stone-gray">ID: {periodId?.substring(0,8).toUpperCase() || '7074C6F5'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ExclamationTriangleIcon className="h-12 w-12 text-stone-gray/50 mb-4" />
                    <h3 className="text-sm font-bold text-white mb-1">Awaiting Data</h3>
                    <p className="text-xs text-stone-gray max-w-xs">Add activities to generate your emissions summary.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateReportPage;
