import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { boundariesAPI } from '../../api/boundariesAPI';

const BoundarySettingsPage = () => {
  const { t } = useTranslation();
  const [boundaryQuestions, setBoundaryQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadBoundaryData();
  }, []);

  const loadBoundaryData = async () => {
    try {
      setLoading(true);
      // Load questions
      const questions = await boundariesAPI.getBoundaryQuestions();
      setBoundaryQuestions(questions);

      // Load current answers
      const answersData = await boundariesAPI.getCompanyBoundaryAnswers();
      const answersMap = {};
      answersData.forEach(answer => {
        answersMap[answer.question_id] = answer.answer_boolean;
      });
      setAnswers(answersMap);
    } catch (error) {
      console.error('Error loading boundary data:', error);
      setMessage({ type: 'error', text: t('Failed to load boundary settings') });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (questionId, currentValue) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: !currentValue
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
        question_id: parseInt(questionId),
        answer_boolean: answer
      }));

      await boundariesAPI.saveCompanyBoundaryAnswers(answersArray);
      setMessage({ type: 'success', text: t('Boundary settings saved successfully') });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving boundary settings:', error);
      setMessage({ type: 'error', text: t('Failed to save boundary settings') });
    } finally {
      setSaving(false);
    }
  };

  const getScopeColor = (scope) => {
    switch (scope) {
      case 'SCOPE_1': return 'bg-red-100 text-red-800';
      case 'SCOPE_2': return 'bg-yellow-100 text-yellow-800';
      case 'SCOPE_3': return 'bg-blue-100 text-blue-800';
      case 'OPTIONAL': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('Organizational Boundary Settings')}</h1>
        <p className="text-gray-600 mb-6">
          {t('Configure which emission categories are applicable to your organization. These settings will filter available activity types.')}
        </p>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-200">
            {boundaryQuestions.map((question) => (
              <div key={question.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getScopeColor(question.scope)}`}>
                        {question.scope.replace('_', ' ')}
                      </span>
                      {question.is_required && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {question.question_text}
                    </h3>
                    <div className="text-sm text-gray-600">
                      <p className="mb-1">
                        <span className="font-medium">Activity Type:</span> {question.activity_type_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      {question.notes && (
                        <p className="text-gray-500 italic">
                          {question.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="ml-6">
                    <button
                      onClick={() => handleToggle(question.id, answers[question.id])}
                      disabled={question.is_required}
                      className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                        answers[question.id] 
                          ? 'bg-green-600' 
                          : 'bg-gray-300'
                      } ${question.is_required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          answers[question.id] ? 'translate-x-9' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <div className="text-xs text-center mt-1 text-gray-600">
                      {answers[question.id] ? 'YES' : 'NO'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md transition-colors"
          >
            {saving ? t('Saving...') : t('Save Boundary Settings')}
          </button>
        </div>

        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            ℹ️ {t('How Boundary Settings Work')}
          </h3>
          <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
            <li><strong>Required questions</strong> are always enabled and cannot be changed (Scope 1 & Scope 2)</li>
            <li><strong>Scope 3 questions</strong> can be enabled/disabled based on your organizational boundary</li>
            <li>Activities will only appear in the system if their corresponding boundary question is answered "YES"</li>
            <li>Changes take effect immediately after saving</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BoundarySettingsPage;
