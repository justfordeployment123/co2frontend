// ========================================================================
// ADMIN DASHBOARD PAGE
// Platform metrics and management for internal admins
// ========================================================================

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChartBarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CurrencyEuroIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const AdminDashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('metrics'); // metrics, companies, users
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [companySearch, setCompanySearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchMetrics();
    fetchCompanies();
    fetchUsers();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/admin/metrics`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async (search = '') => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '100');

      const response = await fetch(
        `/api/admin/companies?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch companies');
      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  const fetchUsers = async (search = '', role = 'all') => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (role !== 'all') params.append('role', role);
      params.append('limit', '100');

      const response = await fetch(
        `/api/admin/users?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleCompanySearch = (e) => {
    e.preventDefault();
    fetchCompanies(companySearch);
  };

  const handleUserSearch = (e) => {
    e.preventDefault();
    fetchUsers(userSearch, roleFilter);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {t('admin.dashboard.title', 'Admin Dashboard')}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {t('admin.dashboard.description', 'Platform metrics and management')}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {['metrics', 'companies', 'users'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
            >
              {t(`admin.tabs.${tab}`, tab)}
            </button>
          ))}
        </nav>
      </div>

      {/* Metrics Tab */}
      {activeTab === 'metrics' && metrics && (
        <div>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <MetricCard
              icon={BuildingOfficeIcon}
              title={t('admin.metrics.totalCompanies', 'Total Companies')}
              value={metrics.summary.totalCompanies}
              bgColor="bg-blue-500"
            />
            <MetricCard
              icon={UsersIcon}
              title={t('admin.metrics.totalUsers', 'Total Users')}
              value={metrics.summary.totalUsers}
              bgColor="bg-green-500"
            />
            <MetricCard
              icon={DocumentTextIcon}
              title={t('admin.metrics.reportsGenerated', 'Reports Generated')}
              value={metrics.summary.totalReportsGenerated}
              bgColor="bg-purple-500"
            />
            <MetricCard
              icon={CurrencyEuroIcon}
              title={t('admin.metrics.totalRevenue', 'Total Revenue')}
              value={`€${(metrics.summary.totalRevenue / 100).toFixed(2)}`}
              bgColor="bg-yellow-500"
            />
          </div>

          {/* Industry Breakdown */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {t('admin.metrics.industryBreakdown', 'Industry Breakdown')}
            </h2>
            <div className="space-y-3">
              {metrics.breakdown.industries.map((item) => (
                <div key={item.industry_type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">
                    {item.industry_type.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Standards Breakdown */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {t('admin.metrics.standardsBreakdown', 'Reporting Standards Usage')}
            </h2>
            <div className="space-y-3">
              {metrics.breakdown.standards.map((item) => (
                <div key={item.reporting_standard} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.reporting_standard}</span>
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {t('admin.metrics.monthlyTrends', 'Monthly Report Generation')}
            </h2>
            <div className="space-y-2">
              {metrics.trends.monthlyReportGeneration.map((item) => (
                <div key={item.month} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.month}</span>
                  <span className="text-sm font-medium text-gray-900">{item.count} reports</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Companies Tab */}
      {activeTab === 'companies' && (
        <div>
          {/* Search Bar */}
          <form onSubmit={handleCompanySearch} className="mb-6">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  placeholder={t('admin.companies.searchPlaceholder', 'Search companies...')}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {t('common.search', 'Search')}
              </button>
            </div>
          </form>

          {/* Companies Table */}
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.companies.companyName', 'Company Name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.companies.industry', 'Industry')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.companies.country', 'Country')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.companies.createdAt', 'Created')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.companies.reportCount', 'Reports')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companies.map((company) => (
                  <tr key={company.company_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {company.company_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {company.industry_type?.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {company.country_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(company.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {company.report_count || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          {/* Search and Filter */}
          <form onSubmit={handleUserSearch} className="mb-6">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={t('admin.users.searchPlaceholder', 'Search users...')}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">{t('admin.users.allRoles', 'All Roles')}</option>
                <option value="admin">{t('admin.users.admin', 'Admin')}</option>
                <option value="manager">{t('admin.users.manager', 'Manager')}</option>
                <option value="contributor">{t('admin.users.contributor', 'Contributor')}</option>
                <option value="viewer">{t('admin.users.viewer', 'Viewer')}</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {t('common.search', 'Search')}
              </button>
            </div>
          </form>

          {/* Users Table */}
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.users.name', 'Name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.users.email', 'Email')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.users.role', 'Role')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.users.company', 'Company')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.users.createdAt', 'Created')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'internal_admin'
                            ? 'bg-red-100 text-red-800'
                            : user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'manager'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.company_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ icon: Icon, title, value, bgColor }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${bgColor} rounded-md p-3`}>
            <Icon className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
