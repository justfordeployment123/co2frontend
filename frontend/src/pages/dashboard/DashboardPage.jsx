import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { dashboardAPI } from '../../api/dashboardAPI';
import { useToast } from '../../components/common/Toast';
import NewReportingPeriodModal from '../../components/forms/NewReportingPeriodModal';
import { reportingPeriodsAPI } from '../../api/reportingPeriodsAPI';

/**
 * Dashboard Page - Premium Redesign
 * Aggregated emissions data across all reporting periods
 */
const DashboardPage = () => {
  const { user, hasAnyRole } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { error, success } = useToast();

  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewPeriodModal, setShowNewPeriodModal] = useState(false);
  const [reports, setReports] = useState([]);

  // Role-based permissions
  const canManagePeriods = hasAnyRole(['company_admin']);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch all reporting periods
      const reportsRes = await reportingPeriodsAPI.listPeriods(user.companyId);
      const reportsList = reportsRes.reportingPeriods || reportsRes.periods || [];
      setReports(reportsList);

      // Fetch aggregated KPIs across ALL periods (no specific periodId = aggregate)
      const kpiData = await dashboardAPI.getKPIs(user.companyId);
      setKpis(kpiData);

    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodCreated = (newPeriod) => {
    success(t('reportingPeriod.createSuccess', 'Report created successfully'));
    setShowNewPeriodModal(false);
    navigate(`/settings/boundary/${newPeriod.id}`);
  };

  const showEmptyState = !loading && reports.length === 0;

  // Calculate traffic light based on emissions data
  const calculateTrafficLight = (kpiData) => {
    if (!kpiData) return 'green';
    
    // Use the traffic_light from API if available
    if (kpiData.traffic_light) return kpiData.traffic_light;
    
    // Fallback calculation based on total emissions
    const total = kpiData.totalEmissions || 0;
    if (total === 0) return 'green';
    if (total < 100) return 'green';
    if (total < 500) return 'yellow';
    return 'red';
  };

  // Get traffic light color styling
  const getTrafficLightStyles = (color) => {
    const styles = {
      green: {
        bg: 'from-emerald-500 to-green-600',
        glow: 'shadow-emerald-500/30',
        text: 'text-emerald-400',
        icon: '✓',
        title: 'Excellent Performance',
        description: 'Your emissions are well below the industry baseline'
      },
      yellow: {
        bg: 'from-amber-400 to-yellow-500',
        glow: 'shadow-amber-500/30',
        text: 'text-amber-400',
        icon: '!',
        title: 'Room for Improvement',
        description: 'Your emissions are near or slightly above industry baseline'
      },
      red: {
        bg: 'from-red-500 to-rose-600',
        glow: 'shadow-red-500/30',
        text: 'text-red-400',
        icon: '!',
        title: 'Action Required',
        description: 'Your emissions are significantly above industry baseline'
      }
    };
    return styles[color] || styles.green;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-midnight-navy via-slate-900 to-midnight-navy flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-mist/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-mist animate-spin"></div>
          </div>
          <p className="text-gray-400 animate-pulse">Loading your carbon data...</p>
        </div>
      </div>
    );
  }

  // Empty state for new users
  if (showEmptyState && canManagePeriods) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-midnight-navy via-slate-900 to-midnight-navy">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-cyan-500/30">
                  <svg className="w-10 h-10 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Start Your Carbon Journey
                </h2>
                <p className="text-lg md:text-xl text-gray-400 mb-8 leading-relaxed">
                  Create your first reporting period to begin tracking and reducing your organization's carbon footprint.
                </p>
                <button
                  onClick={() => setShowNewPeriodModal(true)}
                  className="group relative px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold text-base md:text-lg shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all hover:-translate-y-1"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span>Create Your First Report</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <NewReportingPeriodModal
          isOpen={showNewPeriodModal}
          onClose={() => setShowNewPeriodModal(false)}
          onSuccess={handlePeriodCreated}
          companyId={user?.companyId}
        />
      </div>
    );
  }

  const trafficLight = calculateTrafficLight(kpis);
  const trafficStyles = getTrafficLightStyles(trafficLight);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-midnight-navy via-slate-900 to-midnight-navy">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 lg:py-10">
          
          {/* Hero Header */}
          <div className="relative mb-6 md:mb-10">
            <div className="absolute top-0 left-0 w-48 md:w-72 h-48 md:h-72 bg-cyan-500/10 rounded-full blur-3xl -z-10"></div>
            <div className="absolute top-20 right-20 w-64 md:w-96 h-64 md:h-96 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>
            
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 md:gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2 md:mb-3">
                  <div className="h-1 w-8 md:w-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"></div>
                  <span className="text-xs font-semibold tracking-wider text-cyan-400 uppercase">Carbon Dashboard</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white mb-2 md:mb-3">
                  Welcome back, <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">{user?.firstName || 'User'}</span>
                </h1>
                <p className="text-gray-400 text-sm md:text-lg max-w-xl">
                  Your aggregated emissions overview across all reporting period(s)
                </p>
              </div>
              
              {canManagePeriods && (
                <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto">
                  <button 
                    onClick={() => navigate('/reporting-periods')}
                    className="flex-1 lg:flex-initial px-3 md:px-5 py-2 md:py-3 bg-white/5 backdrop-blur-sm border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-medium flex items-center justify-center gap-2 text-sm"
                  >
                    <span>Active Reports</span>
                  </button>
                  <button 
                    onClick={() => setShowNewPeriodModal(true)}
                    className="flex-1 lg:flex-initial px-3 md:px-5 py-2 md:py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium flex items-center justify-center gap-2 text-sm"
                  >
                    <span>+ New Report</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Aggregation Notice Banner */}
          <div className="mb-6 md:mb-8 p-3 md:p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl md:rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-blue-500/20 rounded-lg md:rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-blue-200 font-medium text-sm md:text-base">Aggregated Data View</p>
                <p className="text-blue-300/70 text-xs md:text-sm truncate md:whitespace-normal">This dashboard shows your total emissions combined across all reporting periods.</p>
              </div>
            </div>
          </div>

          {kpis && (
            <>
              {/* Main Stats Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                
                {/* Traffic Light Card - Larger */}
                <div className="lg:col-span-1 relative group">
                  <div className={`absolute inset-0 bg-gradient-to-br ${trafficStyles.bg} rounded-2xl md:rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity`}></div>
                  <div className="relative h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 md:w-40 h-32 md:h-40 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full"></div>
                    
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-20 h-20 md:w-28 md:h-28 rounded-full bg-gradient-to-br ${trafficStyles.bg} flex items-center justify-center shadow-2xl ${trafficStyles.glow} mb-4 md:mb-6`}>
                        <span className="text-white text-3xl md:text-5xl font-bold">{trafficStyles.icon}</span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{trafficStyles.title}</h3>
                      <p className="text-gray-400 text-xs md:text-sm">{trafficStyles.description}</p>
                      
                      {/* Mini Traffic Light Visual */}
                      <div className="flex gap-2 mt-4 md:mt-6">
                        <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${trafficLight === 'red' ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-gray-700'}`}></div>
                        <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${trafficLight === 'yellow' ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50' : 'bg-gray-700'}`}></div>
                        <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${trafficLight === 'green' ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-700'}`}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Emissions Card */}
                <div className="lg:col-span-2">
                  <div className="h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                      <div>
                        <h3 className="text-xs md:text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Carbon Footprint</h3>
                        <p className="text-3xl md:text-5xl font-bold text-white">
                          {(kpis.totalEmissions || 0).toFixed(2)}
                          <span className="text-lg md:text-2xl text-gray-400 ml-2">MT CO₂e</span>
                        </p>
                      </div>
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl md:rounded-2xl flex items-center justify-center">
                        <svg className="w-6 h-6 md:w-8 md:h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Scope Distribution Progress Bars */}
                    <div className="space-y-3 md:space-y-4">
                      <div>
                        <div className="flex justify-between text-xs md:text-sm mb-1 md:mb-2">
                          <span className="text-gray-400">Scope 1 (Direct)</span>
                          <span className="text-white font-medium">{(kpis.scope1 || 0).toFixed(2)} MT</span>
                        </div>
                        <div className="h-2 md:h-3 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-1000"
                            style={{ width: `${kpis.totalEmissions > 0 ? (kpis.scope1 / kpis.totalEmissions * 100) : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs md:text-sm mb-1 md:mb-2">
                          <span className="text-gray-400">Scope 2 (Energy)</span>
                          <span className="text-white font-medium">{(kpis.scope2_market || kpis.scope2_location || 0).toFixed(2)} MT</span>
                        </div>
                        <div className="h-2 md:h-3 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full transition-all duration-1000"
                            style={{ width: `${kpis.totalEmissions > 0 ? ((kpis.scope2_market || kpis.scope2_location || 0) / kpis.totalEmissions * 100) : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs md:text-sm mb-1 md:mb-2">
                          <span className="text-gray-400">Scope 3 (Value Chain)</span>
                          <span className="text-white font-medium">{(kpis.scope3 || 0).toFixed(2)} MT</span>
                        </div>
                        <div className="h-2 md:h-3 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full transition-all duration-1000"
                            style={{ width: `${kpis.totalEmissions > 0 ? (kpis.scope3 / kpis.totalEmissions * 100) : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scope Detail Cards - Equal Sizes */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {/* Scope 1 */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-xl md:rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <span className="text-white font-bold text-sm md:text-base">S1</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-white font-semibold text-sm md:text-base">Scope 1</h4>
                        <p className="text-xs text-gray-500 truncate">Direct</p>
                      </div>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-white mb-1">{(kpis.scope1 || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">MT CO₂e</p>
                  </div>
                </div>

                {/* Scope 2 Location */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl md:rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-cyan-500/30 transition-colors">
                    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                        <span className="text-white font-bold text-sm md:text-base">S2</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-white font-semibold text-sm md:text-base">Scope 2</h4>
                        <p className="text-xs text-gray-500 truncate">Location</p>
                      </div>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-white mb-1">{(kpis.scope2_location || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">MT CO₂e</p>
                  </div>
                </div>

                {/* Scope 2 Market */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-xl md:rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-blue-500/30 transition-colors">
                    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <span className="text-white font-bold text-sm md:text-base">S2</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-white font-semibold text-sm md:text-base">Scope 2</h4>
                        <p className="text-xs text-gray-500 truncate">Market</p>
                      </div>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-white mb-1">{(kpis.scope2_market || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">MT CO₂e</p>
                  </div>
                </div>

                {/* Scope 3 */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-violet-600/20 rounded-xl md:rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-purple-500/30 transition-colors">
                    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <span className="text-white font-bold text-sm md:text-base">S3</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-white font-semibold text-sm md:text-base">Scope 3</h4>
                        <p className="text-xs text-gray-500 truncate">Supply Chain</p>
                      </div>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-white mb-1">{(kpis.scope3 || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">MT CO₂e</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Reporting Period Modal */}
      <NewReportingPeriodModal
        isOpen={showNewPeriodModal}
        onClose={() => setShowNewPeriodModal(false)}
        onSuccess={handlePeriodCreated}
        companyId={user?.companyId}
      />
    </>
  );
};

export default DashboardPage;
