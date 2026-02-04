import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { Menu, LogOut, ChevronDown } from 'lucide-react';

const Header = ({ onMenuClick, showMenuButton }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-midnight-navy/95 backdrop-blur-lg text-white border-b border-white/10 sticky top-0 z-50">
      <nav className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 flex-wrap sm:flex-nowrap gap-2">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            {showMenuButton && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <img
                src="/aurixon_logo.png"
                alt="AURIXON"
                className="h-10 sm:h-12 w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </Link>
          </div>

          {/* User Menu - Desktop Only */}
          {isAuthenticated && (
            <div className="hidden lg:flex items-center gap-4">
              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* User Info */}
              <div className="flex items-center gap-4 border-l border-white/10 pl-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-mist to-growth-green flex items-center justify-center text-midnight-navy font-semibold text-sm">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
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
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 bg-gradient-to-r from-cyan-mist to-growth-green text-midnight-navy text-sm font-semibold rounded-lg hover:shadow-lg hover:shadow-growth-green/20 transition-all"
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
