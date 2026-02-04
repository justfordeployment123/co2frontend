import React, { useState, useEffect } from 'react';
import { fetchProfile, updateProfile } from '../../api/settingsApi';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileSettingsPage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', language: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const data = await fetchProfile();
      setForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        password: '',
        language: data.language || ''
      });
      setError(null);
    } catch (err) {
      setError('Failed to load profile');
    }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSuccess(null);
    try {
      const updated = await updateProfile(form);
      updateUser(updated);
      setSuccess('Profile updated!');
      setForm(f => ({ ...f, password: '' }));
    } catch (err) {
      setError('Failed to update profile');
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4">Profile Settings</h2>
      {error && <div className="text-red-400 mb-2">{error}</div>}
      {success && <div className="text-green-400 mb-2">{success}</div>}
      {loading ? (
        <div className="text-gray-200">Loading...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-200 mb-1">First Name</label>
            <input name="first_name" value={form.first_name} onChange={handleChange} className="border rounded px-2 py-1 w-full bg-gray-900 text-white" required />
          </div>
          <div>
            <label className="block text-gray-200 mb-1">Last Name</label>
            <input name="last_name" value={form.last_name} onChange={handleChange} className="border rounded px-2 py-1 w-full bg-gray-900 text-white" required />
          </div>
          <div>
            <label className="block text-gray-200 mb-1">Email</label>
            <input name="email" value={form.email} onChange={handleChange} className="border rounded px-2 py-1 w-full bg-gray-900 text-white" required />
          </div>
          <div>
            <label className="block text-gray-200 mb-1">Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} className="border rounded px-2 py-1 w-full bg-gray-900 text-white" placeholder="Leave blank to keep current password" />
          </div>
          <div>
            <label className="block text-gray-200 mb-1">Language</label>
            <input name="language" value={form.language} onChange={handleChange} className="border rounded px-2 py-1 w-full bg-gray-900 text-white" />
          </div>
          <button type="submit" className="bg-cyan-700 text-white px-4 py-2 rounded">Save</button>
        </form>
      )}
    </div>
  );
}
