import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSwitcher from '../common/LanguageSwitcher';

/**
 * Header Component
 * Main navigation bar with AURIXON branding
 */
const Header = ({ onMenuClick, showMenuButton }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-midnight-navy text-white shadow-lg sticky top-0 z-50">
      <nav className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 flex-wrap sm:flex-nowrap gap-2">
          
          <div className="flex items-center gap-2">
            {/* Mobile Menu Button */}
            {showMenuButton && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 text-white hover:text-cyan-mist transition-colors rounded-lg hover:bg-white/10"
                aria-label="Toggle menu"
              >
                <span className="text-xl">☰</span>
              </button>
            )}

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity">
              <img 
                src="/aurixon_logo.png" 
                alt="AURIXON" 
                className="h-12 sm:h-14 md:h-16 w-auto object-contain py-1"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <span className="text-xl sm:text-2xl font-heading font-bold">
                AURIX<span className="text-growth-green">ON</span>
              </span>
            </Link>
          </div>

          {/* User Menu - Desktop Only */}
          {isAuthenticated && (
            <div className="hidden lg:flex items-center gap-4">
              {/* Language Switcher */}
              <LanguageSwitcher />
              
              {/* User Info */}
              <div className="flex items-center gap-4 border-l border-white/20 pl-4">
                <div className="text-right">
                  <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-compliance-blue capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium hover:text-compliance-blue transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* Guest Links - Desktop Only */}
          {!isAuthenticated && (
            <div className="hidden lg:flex items-center gap-4">
              {/* Language Switcher */}
              <LanguageSwitcher />
              
              <Link 
                to="/login" 
                className="text-sm font-medium hover:text-compliance-blue transition-colors"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="btn-primary px-6 py-2 text-sm"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
