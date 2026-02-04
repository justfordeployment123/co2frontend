import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/common/Toast';
import FileUpload from '../components/common/FileUpload';
import { companyAPI } from '../api/companyAPI';
import { useAuth } from "../contexts/AuthContext";
import { COUNTRIES, REPORTING_STANDARDS } from '../utils/countries';

const CompanySettingsPage = () => {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    address: '',
    city: '',
    country_code: '',
    postal_code: '',
    website: '',
    contact_email: '',
    contact_phone: '',
    reporting_standards: [],
  });

  const canEdit = user?.role === 'company_admin';

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      const data = await companyAPI.getCompany(user.companyId);
      setCompany(data);
      setFormData({
        name: data.name || '',
        industry: data.industry || '',
        address: data.address || '',
        city: data.city || '',
        country_code: data.country_code || '',
        postal_code: data.postal_code || '',
        website: data.website || '',
        contact_email: data.contact_email || '',
        contact_phone: data.contact_phone || '',
        reporting_standards: data.reporting_standards || [],
      });
    } catch (err) {
      error(err.response?.data?.message || 'Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStandardToggle = (standardId) => {
    setFormData(prev => ({
      ...prev,
      reporting_standards: prev.reporting_standards.includes(standardId)
        ? prev.reporting_standards.filter(id => id !== standardId)
        : [...prev.reporting_standards, standardId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;

    setSaving(true);
    try {
      await companyAPI.updateCompany(user.companyId, formData);
      success(t('settings.updateSuccess'));
      fetchCompanyData();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update company');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight-navy flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-mist border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight-navy p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-off-white mb-2">
            {t('settings.companySettings')}
          </h1>
          <p className="text-stone-gray">
            {t('settings.companySubtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-midnight-navy-lighter border border-carbon-gray rounded-lg p-6">
            <h2 className="text-xl font-semibold text-off-white mb-4 pb-2 border-b border-carbon-gray">
              {t('settings.basicInfo')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-off-white mb-2">
                  {t('settings.companyName')} *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  className="w-full px-4 py-2 bg-midnight-navy border border-carbon-gray rounded-lg text-off-white focus:outline-none focus:border-cyan-mist disabled:opacity-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-off-white mb-2">
                  {t('settings.industry')}
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="w-full px-4 py-2 bg-midnight-navy border border-carbon-gray rounded-lg text-off-white focus:outline-none focus:border-cyan-mist disabled:opacity-50"
                >
                  <option value="">Select Industry</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="technology">Technology</option>
                  <option value="retail">Retail</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="finance">Finance</option>
                  <option value="energy">Energy</option>
                  <option value="transportation">Transportation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-off-white mb-2">
                  {t('settings.website')}
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="w-full px-4 py-2 bg-midnight-navy border border-carbon-gray rounded-lg text-off-white focus:outline-none focus:border-cyan-mist disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-midnight-navy-lighter border border-carbon-gray rounded-lg p-6">
            <h2 className="text-xl font-semibold text-off-white mb-4 pb-2 border-b border-carbon-gray">
              {t('settings.contactInfo')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-off-white mb-2">
                  {t('settings.email')}
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="w-full px-4 py-2 bg-midnight-navy border border-carbon-gray rounded-lg text-off-white focus:outline-none focus:border-cyan-mist disabled:opacity-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-off-white mb-2">
                  {t('settings.phone')}
                </label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="w-full px-4 py-2 bg-midnight-navy border border-carbon-gray rounded-lg text-off-white focus:outline-none focus:border-cyan-mist disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-midnight-navy-lighter border border-carbon-gray rounded-lg p-6">
            <h2 className="text-xl font-semibold text-off-white mb-4 pb-2 border-b border-carbon-gray">
              {t('settings.address')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-off-white mb-2">
                  {t('settings.streetAddress')}
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="w-full px-4 py-2 bg-midnight-navy border border-carbon-gray rounded-lg text-off-white focus:outline-none focus:border-cyan-mist disabled:opacity-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-off-white mb-2">
                  {t('settings.city')}
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="w-full px-4 py-2 bg-midnight-navy border border-carbon-gray rounded-lg text-off-white focus:outline-none focus:border-cyan-mist disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-off-white mb-2">
                  {t('settings.postalCode')}
                </label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="w-full px-4 py-2 bg-midnight-navy border border-carbon-gray rounded-lg text-off-white focus:outline-none focus:border-cyan-mist disabled:opacity-50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-off-white mb-2">
                  {t('settings.country')}
                </label>
                <select
                  name="country_code"
                  value={formData.country_code}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="w-full px-4 py-2 bg-midnight-navy border border-carbon-gray rounded-lg text-off-white focus:outline-none focus:border-cyan-mist disabled:opacity-50"
                >
                  <option value="">Select Country</option>
                  {COUNTRIES.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Reporting Standards */}
          <div className="bg-midnight-navy-lighter border border-carbon-gray rounded-lg p-6">
            <h2 className="text-xl font-semibold text-off-white mb-2">
              {t('settings.reportingStandards', 'Reporting Standards')}
            </h2>
            <p className="text-stone-gray mb-4 text-sm">
              {t('settings.reportingStandardsDescription', 'Select the reporting standards your organization follows for carbon accounting and emissions reporting.')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {REPORTING_STANDARDS.map(standard => (
                <div 
                  key={standard.id}
                  onClick={() => canEdit && handleStandardToggle(standard.id)}
                  className={`p-4 border rounded-lg transition-all cursor-pointer ${
                    formData.reporting_standards.includes(standard.id)
                      ? 'border-cyan-mist bg-cyan-mist/10'
                      : 'border-carbon-gray hover:border-stone-gray'
                  } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      formData.reporting_standards.includes(standard.id)
                        ? 'border-cyan-mist bg-cyan-mist'
                        : 'border-carbon-gray'
                    }`}>
                      {formData.reporting_standards.includes(standard.id) && (
                        <svg className="w-3 h-3 text-midnight-navy" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-off-white">{standard.name}</div>
                      <div className="text-sm text-stone-gray">{standard.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Organizational Boundary */}
          <div className="bg-midnight-navy-lighter border border-carbon-gray rounded-lg p-6">
            <h2 className="text-xl font-semibold text-off-white mb-2">
              {t('settings.organizationalBoundary', 'Organizational Boundary')}
            </h2>
            <p className="text-stone-gray mb-4">
              {t('settings.boundaryDescription', 'Define your organizational scope, subsidiaries, and consolidation approach for emissions reporting.')}
            </p>
            <button
              type="button"
              onClick={() => navigate('/setup')}
              className="px-6 py-2 bg-midnight-navy border border-cyan-mist text-cyan-mist rounded-lg hover:bg-cyan-mist hover:text-midnight-navy transition-colors font-medium"
            >
              {t('settings.configureBoundary', 'Configure Boundary Questions')}
            </button>
          </div>

          {/* Actions */}
          {canEdit && (
            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={fetchCompanyData}
                className="px-6 py-2 border border-carbon-gray text-off-white rounded-lg hover:bg-midnight-navy transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-cyan-mist text-midnight-navy rounded-lg hover:bg-growth-green transition-colors font-medium disabled:opacity-50"
              >
                {saving ? t('common.saving') : t('common.save')}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CompanySettingsPage;
