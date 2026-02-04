import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Language Switcher Component
 * Toggle between English and German
 */
const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language || 'en');

  useEffect(() => {
    setCurrentLang(i18n.language);
  }, [i18n.language]);

  const toggleLanguage = () => {
    const newLang = currentLang === 'en' ? 'de' : 'en';
    i18n.changeLanguage(newLang);
    setCurrentLang(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/10 transition-colors border border-cyan-mist/30"
      title={currentLang === 'en' ? 'Switch to Deutsch' : 'Switch to English'}
    >
      <span className="text-lg">🌐</span>
      <span className="font-semibold uppercase">{currentLang}</span>
    </button>
  );
};

export default LanguageSwitcher;
