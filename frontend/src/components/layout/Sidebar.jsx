import { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../common/LanguageSwitcher';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  User,
  Settings,
  Shield,
  HelpCircle,
  LogOut,
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, hasAnyRole, logout } = useAuth();
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

  const menuItems = useMemo(
    () => [
      {
        name: t('nav.dashboard', 'Dashboard'),
        path: '/dashboard',
        icon: LayoutDashboard,
        roles: ['company_admin', 'editor', 'viewer', 'internal_admin'],
      },
      {
        name: t('nav.activeReports', 'Active Reports'),
        path: '/reporting-periods',
        icon: FolderOpen,
        roles: ['company_admin', 'editor', 'viewer'],
      },
      {
        name: t('nav.reports', 'Reports'),
        path: '/reports',
        icon: FileText,
        roles: ['company_admin', 'editor', 'viewer'],
      },
      {
        name: t('nav.profile', 'Profile'),
        path: '/settings/profile',
        icon: User,
        roles: ['company_admin', 'editor', 'viewer', 'internal_admin'],
      },
      {
        name: t('nav.settings', 'Settings'),
        path: '/settings/company',
        icon: Settings,
        roles: ['company_admin'],
      },
      {
        name: t('nav.admin', 'Admin'),
        path: '/admin',
        icon: Shield,
        roles: ['internal_admin'],
      },
      {
        name: t('nav.help', 'Help'),
        path: '/help',
        icon: HelpCircle,
        roles: ['company_admin', 'editor', 'viewer', 'internal_admin'],
      },
    ],
    [t, ready]
  );

  const visibleMenuItems = menuItems.filter((item) => hasAnyRole(item.roles));

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] bg-midnight-navy/95 backdrop-blur-lg border-r border-white/10
          transition-all duration-300 ease-in-out z-[45]
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-64 flex-shrink-0
        `}
      >
        <nav className="h-full overflow-y-auto py-6 px-3 scrollbar-custom">
          {/* User Info */}
          <div className="mb-6 pb-6 border-b border-white/10 px-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-mist to-growth-green text-midnight-navy flex items-center justify-center font-bold text-sm">
                {user?.firstName?.charAt(0)}
                {user?.lastName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-400 truncate capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <ul className="space-y-1">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                      ${
                        active
                          ? 'bg-gradient-to-r from-cyan-mist/20 to-growth-green/20 text-white border border-cyan-mist/30'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }
                    `}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        setIsOpen(false);
                      }
                    }}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        active ? 'text-cyan-mist' : 'text-gray-500'
                      }`}
                    />
                    <span className="font-medium">{item.name}</span>
                    {active && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-growth-green" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Bottom Section */}
          <div className="mt-8 pt-6 border-t border-white/10 space-y-3 px-2">
            {/* Language Switcher - Mobile Only (Desktop has it in Header) */}
            <div className="lg:hidden">
              <LanguageSwitcher />
            </div>
            {/* Logout Button - Mobile Only */}
            <button
              onClick={handleLogout}
              className="lg:hidden w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{t('nav.logout', 'Logout')}</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[35] top-16"
          onClick={() => setIsOpen(false)}
          aria-label="Close menu"
        />
      )}
    </>
  );
};

export default Sidebar;
