import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/common/Loading';

const ProfileSettingsPage = () => {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    language: 'en'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${user.id}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const data = await response.json();
      setFormData({
        firstName: data.first_name || user.firstName || '',
        lastName: data.last_name || user.lastName || '',
        email: data.email || user.email || '',
        language: data.language_preference || 'en'
      });
    } catch (err) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        language: 'en'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          language_preference: formData.language
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      success('Profile updated successfully');
    } catch (err) {
      error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      error('Password must be at least 8 characters');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${user.id}/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (!response.ok) {
        throw new Error('Failed to change password');
      }

      success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      error(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" text={t('common.loading')} />
      </div>
    );
  }

  return (
    <div className="container-custom py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          {t('settings.profile') || 'Profile Settings'}
        </h1>
        <p className="text-gray-300">
          {t('settings.profileSubtitle') || 'Manage your personal information and preferences'}
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Form */}
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">
            {t('settings.personalInfo') || 'Personal Information'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('settings.firstName')}
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('settings.lastName')}
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('settings.email')}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="input w-full bg-midnight-navy-dark text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">{t('settings.emailReadOnly')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('settings.language')}
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="input w-full"
                >
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={loadProfile}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? t('actions.saving') : t('common.save')}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">
            {t('settings.changePassword')}
          </h2>
          <form onSubmit={handlePasswordChange}>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('settings.currentPassword')}
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('settings.newPassword')}
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="input w-full"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('settings.confirmPassword')}
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="input w-full"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? t('actions.updating') : t('settings.updatePassword')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
