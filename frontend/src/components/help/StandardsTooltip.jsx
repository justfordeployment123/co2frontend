import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const StandardsTooltip = ({ topic, children }) => {
  const { i18n } = useTranslation();
  const [showTooltip, setShowTooltip] = useState(false);
  const [helpContent, setHelpContent] = useState(null);
  
  useEffect(() => {
    fetch('/standards-help.json')
      .then(response => response.json())
      .then(data => setHelpContent(data))
      .catch(error => console.error('Error loading help content:', error));
  }, []);
  
  const lang = i18n.language || 'en';
  
  // Navigate through nested object path (e.g., "scopes.scope1")
  const getContent = (path) => {
    if (!helpContent) return null;
    const parts = path.split('.');
    let content = helpContent[lang];
    
    for (const part of parts) {
      if (content && content[part]) {
        content = content[part];
      } else {
        return null;
      }
    }
    
    return content;
  };
  
  const content = getContent(topic);
  
  if (!helpContent || !content) return children;
  
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="cursor-help inline-flex items-center"
      >
        {children}
        <span className="ml-1 text-cyan-mist text-xs">ⓘ</span>
      </div>
      
      {showTooltip && (
        <div className="absolute z-50 w-80 p-4 bg-gray-900 border border-cyan-mist/50 rounded-lg shadow-xl text-sm left-0 top-full mt-2">
          {content.name && (
            <h4 className="font-semibold text-cyan-mist mb-2">{content.name}</h4>
          )}
          {content.term && (
            <h4 className="font-semibold text-cyan-mist mb-2">{content.term}</h4>
          )}
          {content.description && (
            <p className="text-gray-300 mb-2">{content.description}</p>
          )}
          {content.definition && (
            <p className="text-gray-300 mb-2"><span className="font-semibold">Definition:</span> {content.definition}</p>
          )}
          {content.explanation && (
            <p className="text-gray-400 text-xs">{content.explanation}</p>
          )}
          {content.whyImportant && (
            <p className="text-gray-400 text-xs mt-2"><span className="font-semibold">Why it matters:</span> {content.whyImportant}</p>
          )}
          {content.examples && Array.isArray(content.examples) && (
            <div className="mt-2">
              <p className="font-semibold text-gray-300 text-xs">Examples:</p>
              <ul className="list-disc list-inside text-gray-400 text-xs">
                {content.examples.map((example, idx) => (
                  <li key={idx}>{example}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StandardsTooltip;
