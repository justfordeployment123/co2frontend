// ========================================================================
// NEW REPORTING PERIOD MODAL
// Modal for creating new reporting periods with standards selection
// ========================================================================

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import StandardsComparisonModal from '../help/StandardsComparisonModal';

const NewReportingPeriodModal = ({ isOpen, onClose, onSuccess, companyId }) => {
  const { t } = useTranslation();
  const [showStandardsHelp, setShowStandardsHelp] = useState(false);

  const [formData, setFormData] = useState({
    label: '',
    startDate: '',
    endDate: '',
    type: 'annual',
    reportingStandard: 'CSRD',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const reportingStandards = [
    {
      value: 'CSRD',
      label: 'CSRD (Corporate Sustainability Reporting Directive)',
      description: t('standards.csrd.shortDesc', 'Mandatory for EU companies meeting size criteria'),
    },
    {
      value: 'GHG_PROTOCOL',
      label: 'GHG Protocol',
      description: t('standards.ghg.shortDesc', 'Global voluntary standard for emissions reporting'),
    },
    {
      value: 'ISO_14064',
      label: 'ISO 14064-1',
      description: t('standards.iso.shortDesc', 'International standard for GHG quantification'),
    },
  ];

  const periodTypes = [
    { value: 'annual', label: t('period.types.annual', 'Annual') },
    { value: 'quarterly', label: t('period.types.quarterly', 'Quarterly') },
    { value: 'monthly', label: t('period.types.monthly', 'Monthly') },
    { value: 'custom', label: t('period.types.custom', 'Custom') },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.label.trim()) {
      newErrors.label = t('validation.required', 'This field is required');
    }

    if (!formData.startDate) {
      newErrors.startDate = t('validation.required', 'This field is required');
    }

    if (!formData.endDate) {
      newErrors.endDate = t('validation.required', 'This field is required');
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (start >= end) {
        newErrors.endDate = t('validation.endDateAfterStart', 'End date must be after start date');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/companies/${companyId}/reporting-periods`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            label: formData.label,
            startDate: formData.startDate,
            endDate: formData.endDate,
            type: formData.type,
            reportingStandard: formData.reportingStandard,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to create reporting period';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Not JSON, use the text directly
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
        }
        
        console.error('Reporting period creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          url: response.url
        });
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      onSuccess(result.reportingPeriod);
      handleClose();
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      label: '',
      startDate: '',
      endDate: '',
      type: 'annual',
      reportingStandard: 'CSRD',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {t('reportingPeriod.createNew', 'Create New Report')}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Period Label */}
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-2">
                {t('reportingPeriod.label', 'Report Label')} *
              </label>
              <input
                type="text"
                id="label"
                name="label"
                value={formData.label}
                onChange={handleChange}
                placeholder={t('reportingPeriod.labelPlaceholder', 'e.g., FY 2024')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                  errors.label ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.label && <p className="mt-1 text-sm text-red-600">{errors.label}</p>}
            </div>

            {/* Period Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                {t('reportingPeriod.type', 'Report Type')} *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              >
                {periodTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('reportingPeriod.startDate', 'Start Date')} *
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('reportingPeriod.endDate', 'End Date')} *
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
              </div>
            </div>

            {/* Reporting Standard */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="reportingStandard" className="block text-sm font-medium text-gray-700">
                  {t('reportingPeriod.standard', 'Reporting Standard')} *
                </label>
                <button
                  type="button"
                  onClick={() => setShowStandardsHelp(true)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <InformationCircleIcon className="h-4 w-4" />
                  {t('standards.compareStandards', 'Compare Standards')}
                </button>
              </div>

              <div className="space-y-3">
                {reportingStandards.map((standard) => (
                  <label
                    key={standard.value}
                    className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.reportingStandard === standard.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportingStandard"
                      value={standard.value}
                      checked={formData.reportingStandard === standard.value}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{standard.label}</div>
                      <div className="text-sm text-gray-500 mt-1">{standard.description}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Info about CSRD */}
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{t('standards.csrd.note', 'Note:')}</strong>{' '}
                  {t(
                    'standards.csrd.mandatoryInfo',
                    'CSRD is mandatory for EU companies with ≥250 employees, ≥€50M revenue, or ≥€25M assets. Non-EU companies can use GHG Protocol or ISO 14064.'
                  )}
                </p>
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading
                  ? t('common.creating', 'Creating...')
                  : t('reportingPeriod.create', 'Create Report')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Standards Comparison Modal */}
      {showStandardsHelp && (
        <StandardsComparisonModal
          isOpen={showStandardsHelp}
          onClose={() => setShowStandardsHelp(false)}
        />
      )}
    </>
  );
};

export default NewReportingPeriodModal;
