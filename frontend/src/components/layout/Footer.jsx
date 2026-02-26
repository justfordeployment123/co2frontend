import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Footer Component
 * AURIXON footer with brand colors
 */
const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-midnight-navy/60 backdrop-blur-xl border-t border-white/5 text-white mt-auto overflow-hidden">
      <div className="container-custom py-10 relative">
        {/* Abstract Glow Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-24 bg-cyan-mist/10 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Logo & Brand Name */}
          <div className="flex items-center gap-3">
            <img 
              src={import.meta.env.BASE_URL + 'aurixon_logo.png'} 
              alt="CalculateCO2" 
              className="h-10 w-auto object-contain brightness-110"
            />
            <span className="text-2xl font-heading font-black tracking-tighter uppercase">
              Calculate<span className="text-growth-green">CO2</span>
            </span>
          </div>

          {/* Tagline and Year integrated */}
          <div className="text-center space-y-2">
            <p className="text-base text-cyan-mist/80 font-medium tracking-wide">
              {t('app.tagline')}
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-stone-gray font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-growth-green/40"></span>
              <span>© {currentYear} CalculateCO2</span>
              <span className="w-1.5 h-1.5 rounded-full bg-growth-green/40"></span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
