import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Standards Comparison Modal
 * Shows detailed comparison between CSRD, GHG Protocol, and ISO 14064
 */
export default function StandardsComparisonModal({ isOpen, onClose }) {
  const { t, i18n } = useTranslation();
  const [standardsData, setStandardsData] = useState(null);
  const [activeTab, setActiveTab] = useState('comparison');

  useEffect(() => {
    fetch('/standards-help.json')
      .then(res => res.json())
      .then(data => setStandardsData(data[i18n.language] || data.en))
      .catch(err => console.error('Failed to load standards help:', err));
  }, [i18n.language]);

  if (!isOpen || !standardsData) return null;

  const standards = standardsData.standards;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">
                {t('help.standards.title', 'Reporting Standards Comparison')}
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('comparison')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'comparison'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('help.standards.comparison', 'Quick Comparison')}
              </button>
              <button
                onClick={() => setActiveTab('csrd')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'csrd'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                CSRD
              </button>
              <button
                onClick={() => setActiveTab('ghg')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'ghg'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                GHG Protocol
              </button>
              <button
                onClick={() => setActiveTab('iso')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'iso'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ISO 14064
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-96 overflow-y-auto">
            {activeTab === 'comparison' && (
              <ComparisonTable standards={standards} />
            )}
            {activeTab === 'csrd' && (
              <StandardDetail standard={standards.csrd} />
            )}
            {activeTab === 'ghg' && (
              <StandardDetail standard={standards.ghgProtocol} />
            )}
            {activeTab === 'iso' && (
              <StandardDetail standard={standards.iso14064} />
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {t('common.actions.close', 'Close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonTable({ standards }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Feature
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              CSRD
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              GHG Protocol
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ISO 14064
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Region</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">EU</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Global</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Global</td>
          </tr>
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Type</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mandatory (EU)</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Voluntary</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Voluntary</td>
          </tr>
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Scope 3 Required</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">Yes</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">Optional</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">Partial</td>
          </tr>
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Assurance</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Required</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Optional</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Recommended</td>
          </tr>
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Best For</td>
            <td className="px-6 py-4 text-sm text-gray-500">EU companies</td>
            <td className="px-6 py-4 text-sm text-gray-500">Global reporting</td>
            <td className="px-6 py-4 text-sm text-gray-500">ISO certification</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Recommendation</h4>
        <p className="text-sm text-blue-800">
          <strong>For EU SMEs:</strong> Start with CSRD as it will be mandatory. AURIXON is designed to meet CSRD requirements by default.
        </p>
        <p className="text-sm text-blue-800 mt-2">
          <strong>For global companies:</strong> GHG Protocol offers maximum flexibility and is widely recognized internationally.
        </p>
      </div>
    </div>
  );
}

function StandardDetail({ standard }) {
  if (!standard) return null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{standard.name}</h3>
        <p className="text-gray-600">{standard.description}</p>
      </div>

      {standard.longDescription && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Overview</h4>
          <p className="text-gray-600">{standard.longDescription}</p>
        </div>
      )}

      {standard.whoMustComply && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Who Must Comply</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            {standard.whoMustComply.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {standard.keyRequirements && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Key Requirements</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            {standard.keyRequirements.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {standard.keyPrinciples && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Key Principles</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            {standard.keyPrinciples.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {standard.timeline && (
        <div className="p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-semibold text-yellow-900 mb-2">⏱️ Timeline</h4>
          <p className="text-sm text-yellow-800">{standard.timeline}</p>
        </div>
      )}
    </div>
  );
}
