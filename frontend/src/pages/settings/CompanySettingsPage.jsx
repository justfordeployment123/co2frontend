import React, { useState, useEffect } from 'react';
import { fetchCompanyInfo, updateCompanyInfo } from '../../api/settingsApi';
import { useAuth } from '../../contexts/AuthContext';

export default function CompanySettingsPage() {
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', industry: '', logo: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadCompany();
  }, []);

  async function loadCompany() {
    setLoading(true);
    try {
      const data = await fetchCompanyInfo();
      setCompany(data);
      setForm({ name: data.name || '', address: data.address || '', industry: data.industry || '', logo: data.logo || '' });
      setError(null);
    } catch (err) {
      setError('Failed to load company info');
    }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSuccess(null);
    try {
      await updateCompanyInfo(form);
      setSuccess('Company info updated!');
      loadCompany();
    } catch (err) {
      setError('Failed to update company info');
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4">Company Information</h2>
      {error && <div className="text-red-400 mb-2">{error}</div>}
      {success && <div className="text-green-400 mb-2">{success}</div>}
      {loading ? (
        <div className="text-gray-200">Loading...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-200 mb-1">Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="border rounded px-2 py-1 w-full bg-gray-900 text-white" required />
          </div>
          <div>
            <label className="block text-gray-200 mb-1">Address</label>
            <input name="address" value={form.address} onChange={handleChange} className="border rounded px-2 py-1 w-full bg-gray-900 text-white" />
          </div>
          <div>
            <label className="block text-gray-200 mb-1">Industry</label>
            <input name="industry" value={form.industry} onChange={handleChange} className="border rounded px-2 py-1 w-full bg-gray-900 text-white" />
          </div>
          <div>
            <label className="block text-gray-200 mb-1">Logo URL</label>
            <input name="logo" value={form.logo} onChange={handleChange} className="border rounded px-2 py-1 w-full bg-gray-900 text-white" />
          </div>
          <button type="submit" className="bg-cyan-700 text-white px-4 py-2 rounded">Save</button>
        </form>
      )}
    </div>
  );
}
