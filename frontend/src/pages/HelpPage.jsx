import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const HelpPage = () => {
  const { t, i18n } = useTranslation();
  const [activeSection, setActiveSection] = useState('standards');
  const [activeStandard, setActiveStandard] = useState('csrd');
  const [activeScope, setActiveScope] = useState('scope1');
  const [activeTerm, setActiveTerm] = useState('co2e');
  const [helpContent, setHelpContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/standards-help.json')
      .then(response => response.json())
      .then(data => {
        setHelpContent(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading help content:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading help content...</div>
      </div>
    );
  }

  if (!helpContent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-400">Failed to load help content</div>
      </div>
    );
  }
  
  const lang = i18n.language || 'en';
  const content = helpContent[lang];
  
  const sections = [
    { id: 'standards', label: t('help.standards'), icon: '📋' },
    { id: 'scopes', label: t('help.scopes'), icon: '🎯' },
    { id: 'terms', label: t('help.terms'), icon: '📖' },
    { id: 'activities', label: t('help.activities'), icon: '📝' },
    { id: 'dataQuality', label: t('help.dataQuality'), icon: '✅' }
  ];
  
  return (
    <div className="min-h-screen bg-midnight-navy p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Help & Documentation</h1>
          <p className="text-gray-300">
            Learn about emissions reporting standards, terminology, and best practices
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-primary-light border border-gray-700 rounded-lg p-4 sticky top-6">
              <h2 className="text-lg font-semibold text-white mb-4">Topics</h2>
              <nav className="space-y-2">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                      activeSection === section.id
                        ? 'bg-cyan-mist/20 text-cyan-mist border border-cyan-mist/30'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-xl">{section.icon}</span>
                    <span className="font-medium">{section.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-primary-light border border-gray-700 rounded-lg p-8">
              
              {/* Standards Section */}
              {activeSection === 'standards' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Reporting Standards & Frameworks</h2>
                  
                  <div className="flex gap-2 mb-6">
                    {Object.keys(content.standards).map(key => (
                      <button
                        key={key}
                        onClick={() => setActiveStandard(key)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          activeStandard === key
                            ? 'bg-cyan-mist text-midnight-navy font-semibold'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {content.standards[key].name.split('(')[0].trim()}
                      </button>
                    ))}
                  </div>
                  
                  {content.standards[activeStandard] && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-semibold text-cyan-mist mb-2">
                          {content.standards[activeStandard].name}
                        </h3>
                        <p className="text-gray-300">{content.standards[activeStandard].description}</p>
                      </div>
                      
                      {content.standards[activeStandard].longDescription && (
                        <div className="bg-white/5 border border-cyan-mist/30 rounded-lg p-4">
                          <p className="text-gray-300">{content.standards[activeStandard].longDescription}</p>
                        </div>
                      )}
                      
                      {content.standards[activeStandard].whoMustComply && (
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-3">Who Must Comply?</h4>
                          <ul className="space-y-2">
                            {content.standards[activeStandard].whoMustComply.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-gray-300">
                                <span className="text-cyan-mist mt-1">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {content.standards[activeStandard].keyRequirements && (
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-3">Key Requirements</h4>
                          <ul className="space-y-2">
                            {content.standards[activeStandard].keyRequirements.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-gray-300">
                                <span className="text-green-500 mt-1">✓</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {content.standards[activeStandard].keyPrinciples && (
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-3">Key Principles</h4>
                          <ul className="space-y-2">
                            {content.standards[activeStandard].keyPrinciples.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-gray-300">
                                <span className="text-cyan-mist mt-1">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {content.standards[activeStandard].timeline && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                          <p className="text-yellow-200">
                            <span className="font-semibold">Timeline: </span>
                            {content.standards[activeStandard].timeline}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Scopes Section */}
              {activeSection === 'scopes' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Emission Scopes Explained</h2>
                  
                  <div className="flex gap-2 mb-6">
                    {Object.keys(content.scopes).map(key => (
                      <button
                        key={key}
                        onClick={() => setActiveScope(key)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          activeScope === key
                            ? 'bg-cyan-mist text-midnight-navy font-semibold'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {content.scopes[key].name.split(':')[0]}
                      </button>
                    ))}
                  </div>
                  
                  {content.scopes[activeScope] && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-semibold text-cyan-mist mb-2">
                          {content.scopes[activeScope].name}
                        </h3>
                        <p className="text-gray-300 text-lg">{content.scopes[activeScope].description}</p>
                      </div>
                      
                      {content.scopes[activeScope].categories && (
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-3">Categories</h4>
                          <ul className="space-y-2">
                            {content.scopes[activeScope].categories.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-gray-300">
                                <span className="text-cyan-mist mt-1">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {content.scopes[activeScope].examples && (
                        <div className="bg-white/5 border border-cyan-mist/30 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-white mb-3">Common Examples</h4>
                          <ul className="space-y-2">
                            {content.scopes[activeScope].examples.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-gray-300">
                                <span className="text-green-500 mt-1">→</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {content.scopes[activeScope].whyImportant && (
                        <div className="bg-cyan-mist/10 border border-cyan-mist/30 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-cyan-mist mb-2">Why It Matters</h4>
                          <p className="text-gray-300">{content.scopes[activeScope].whyImportant}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Glossary Section */}
              {activeSection === 'terms' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Glossary of Terms</h2>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
                    {Object.keys(content.terms).map(key => (
                      <button
                        key={key}
                        onClick={() => setActiveTerm(key)}
                        className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                          activeTerm === key
                            ? 'bg-cyan-mist text-midnight-navy font-semibold'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {content.terms[key].term.split('(')[0].trim()}
                      </button>
                    ))}
                  </div>
                  
                  {content.terms[activeTerm] && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold text-cyan-mist mb-2">
                          {content.terms[activeTerm].term}
                        </h3>
                        <p className="text-gray-300 text-lg mb-4">{content.terms[activeTerm].definition}</p>
                      </div>
                      
                      {content.terms[activeTerm].explanation && (
                        <div className="bg-white/5 border border-cyan-mist/30 rounded-lg p-4">
                          <p className="text-gray-300">{content.terms[activeTerm].explanation}</p>
                        </div>
                      )}
                      
                      {content.terms[activeTerm].values && (
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-3">Common GWP Values (100-year)</h4>
                          <div className="bg-gray-800 rounded-lg p-4">
                            {Object.entries(content.terms[activeTerm].values).map(([gas, value]) => (
                              <div key={gas} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                                <span className="text-gray-300 font-mono">{gas}</span>
                                <span className="text-cyan-mist font-semibold">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {content.terms[activeTerm].sources && (
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-3">Trusted Sources</h4>
                          <ul className="space-y-2">
                            {content.terms[activeTerm].sources.map((source, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-gray-300">
                                <span className="text-cyan-mist mt-1">•</span>
                                <span>{source}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Activity Types Section */}
              {activeSection === 'activities' && content.activityTypes && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Activity Types Guide</h2>
                  
                  <div className="space-y-6">
                    {Object.entries(content.activityTypes).map(([key, activity]) => (
                      <div key={key} className="bg-white/5 border border-gray-700 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-semibold text-white">{activity.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            activity.scope === 'Scope 1' ? 'bg-red-500/20 text-red-300' :
                            activity.scope === 'Scope 2' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-green-500/20 text-green-300'
                          }`}>
                            {activity.scope}
                          </span>
                        </div>
                        
                        <p className="text-gray-300 mb-4">{activity.description}</p>
                        
                        {activity.dataNeeded && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-cyan-mist mb-2">Data Needed:</h4>
                            <ul className="space-y-1">
                              {activity.dataNeeded.map((item, idx) => (
                                <li key={idx} className="text-gray-400 text-sm flex items-start gap-2">
                                  <span className="text-cyan-mist mt-0.5">→</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {activity.tips && (
                          <div className="bg-cyan-mist/10 border border-cyan-mist/30 rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-cyan-mist mb-2">Tips:</h4>
                            <ul className="space-y-1">
                              {activity.tips.map((tip, idx) => (
                                <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                                  <span className="text-green-500 mt-0.5">✓</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Data Quality Section */}
              {activeSection === 'dataQuality' && content.dataQuality && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">{content.dataQuality.title}</h2>
                  <p className="text-gray-300 mb-6 text-lg">{content.dataQuality.description}</p>
                  
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white">Data Quality Levels</h3>
                    
                    {Object.entries(content.dataQuality.levels).map(([key, level]) => (
                      <div key={key} className="bg-white/5 border border-gray-700 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-semibold text-white">{level.name}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            level.quality === 'Highest' ? 'bg-green-500/20 text-green-300' :
                            level.quality === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            Quality: {level.quality}
                          </span>
                        </div>
                        
                        <p className="text-gray-300 mb-3">{level.description}</p>
                        
                        <div>
                          <p className="text-sm font-semibold text-cyan-mist mb-2">Examples:</p>
                          <ul className="space-y-1">
                            {level.examples.map((example, idx) => (
                              <li key={idx} className="text-gray-400 text-sm flex items-start gap-2">
                                <span className="text-cyan-mist mt-0.5">•</span>
                                <span>{example}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                    
                    <div className="bg-cyan-mist/10 border border-cyan-mist/30 rounded-lg p-6 mt-8">
                      <h3 className="text-xl font-semibold text-white mb-4">Tips for Improving Data Quality</h3>
                      <ul className="space-y-3">
                        {content.dataQuality.improvementTips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-gray-300">
                            <span className="text-green-500 mt-1 text-lg">✓</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
