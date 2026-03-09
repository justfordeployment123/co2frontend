import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

const loadGoogleAnalytics = () => {
  if (typeof window === 'undefined') return;
  if (!GA_MEASUREMENT_ID) return;
  if (window.gtagInitialized) return;

  // Load GA script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line no-undef
  function gtag(){window.dataLayer.push(arguments);}
  // @ts-ignore
  window.gtag = gtag;
  // @ts-ignore
  window.gtag('js', new Date());
  // @ts-ignore
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });

  // Mark as initialized
  // @ts-ignore
  window.gtagInitialized = true;
};

const CookieConsentBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const consent = localStorage.getItem('cookieConsent');
    if (consent === 'accepted') {
      loadGoogleAnalytics();
      setVisible(false);
    } else if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cookieConsent', 'accepted');
    loadGoogleAnalytics();
    setVisible(false);
  };

  const handleDecline = () => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cookieConsent', 'rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 px-4 flex justify-center">
      <div className="max-w-3xl w-full bg-midnight-navy/95 border border-white/15 rounded-2xl px-5 py-4 shadow-lg backdrop-blur">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <p className="text-sm text-gray-200 leading-relaxed">
            We use cookies to provide essential site functionality and, with your consent, anonymized analytics
            (e.g., Google Analytics) to improve CalculateCO2. You can find more details in our{' '}
            <Link to="/impressum" className="underline underline-offset-2 hover:text-white">
              Imprint
            </Link>{' '}
            and{' '}
            <Link to="/terms" className="underline underline-offset-2 hover:text-white">
              Terms of Service
            </Link>
            .
          </p>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <button
              type="button"
              onClick={handleDecline}
              className="px-3 py-2 rounded-lg border border-gray-500 text-sm text-gray-200 hover:bg-gray-700/60 transition-colors"
            >
              Only necessary
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-mist to-growth-green text-sm font-semibold text-midnight-navy hover:opacity-90 transition-opacity"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;

