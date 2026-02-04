import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function SettingsDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const navItems = [
    { label: t('settings.companySettings'), path: '/settings/company', roles: ['company_admin'] },
    { label: t('users.title'), path: '/settings/users', roles: ['company_admin'] },
    { label: t('settings.profile'), path: '/settings/profile', roles: ['company_admin', 'editor', 'viewer', 'internal_admin'] },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">{t('nav.settings')}</h1>
      <nav className="flex gap-4 mb-8">
        {navItems.filter(item => item.roles.includes(user.role)).map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `px-4 py-2 rounded font-medium transition-colors ${isActive ? 'bg-cyan-700 text-white' : 'bg-gray-800 text-gray-200 hover:bg-cyan-900'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="bg-gray-900 rounded-lg shadow-lg p-6">
        <Outlet />
      </div>
    </div>
  );
}
