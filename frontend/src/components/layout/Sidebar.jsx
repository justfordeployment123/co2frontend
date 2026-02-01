import { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../common/LanguageSwitcher';

/**
 * Sidebar Component
 * Navigation sidebar with role-based menu items
 */
/**
 * Sidebar Component
 * Navigation sidebar with role-based menu items
 */
const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, hasRole, hasAnyRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, ready } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  const menuItems = useMemo(() => [
    {
      name: t('nav.dashboard', 'Dashboard'),
      path: '/dashboard',
      icon: '📊',
      roles: ['company_admin', 'editor', 'viewer', 'internal_admin'],
    },
    {
      name: t('nav.activeReports', 'Active Reports'),
      path: '/reporting-periods',
      icon: '📋',
      roles: ['company_admin', 'editor', 'viewer'],
    },
    {
      name: t('nav.reports', 'Reports'),
      path: '/reports',
      icon: '📄',
      roles: ['company_admin', 'editor', 'viewer'],
    },
    {
      name: t('nav.profile', 'Profile'),
      path: '/settings/profile',
      icon: '👤',
      roles: ['company_admin', 'editor', 'viewer', 'internal_admin'],
    },
    {
      name: t('nav.settings', 'Settings'),
      path: '/settings/company',
      icon: '⚙️',
      roles: ['company_admin'],
    },
    {
      name: t('nav.admin', 'Admin'),
      path: '/admin',
      icon: '👑',
      roles: ['internal_admin'],
    },
    {
      name: t('nav.help', 'Help'),
      path: '/help',
      icon: '❓',
      roles: ['company_admin', 'editor', 'viewer', 'internal_admin'],
    },
  ], [t, ready]);

  const visibleMenuItems = menuItems.filter(item => 
    hasAnyRole(item.roles)
  );

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] bg-midnight-navy border-r border-cyan-mist/20
          transition-all duration-300 ease-in-out z-[45]
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-64 flex-shrink-0
        `}
      >
        <nav className="h-full overflow-y-auto py-6 px-4 scrollbar-custom">
          {/* User Info */}
          <div className="mb-6 pb-6 border-b border-cyan-mist/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-growth-green text-white flex items-center justify-center font-bold">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-compliance-blue truncate capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <ul className="space-y-2">
            {visibleMenuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive(item.path)
                      ? 'bg-growth-green text-white'
                      : 'text-gray-300 hover:bg-white/10'
                    }
                  `}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setIsOpen(false);
                    }
                  }}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Bottom Section */}
          <div className="mt-8 pt-6 border-t border-cyan-mist/20 space-y-3">
            {/* Language Switcher - Mobile Only (Desktop has it in Header) */}
            <div className="px-4 py-2 lg:hidden">
              <LanguageSwitcher />
            </div>            
            {/* Logout Button - Mobile Only */}
            <button
              onClick={handleLogout}
              className="lg:hidden w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-white/10 transition-colors"
            >
              <span className="text-xl">🚪</span>
              <span className="font-medium">{t('nav.logout')}</span>
            </button>          </div>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-[35] top-16"
          onClick={() => setIsOpen(false)}
          aria-label="Close menu"
        />
      )}
    </>
  );
};

export default Sidebar;
