import React, { useEffect, useState } from 'react';
import { fetchUsers, registerUser, updateUserRole, removeUser } from '../../api/settingsApi';
import { useAuth } from '../../contexts/AuthContext';

const roles = [
  { value: 'company_admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
];

export default function UserManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ first_name: '', last_name: '', email: '', password: '', role: 'viewer' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError('Failed to load users');
    }
    setLoading(false);
  }

  async function handleAddUser(e) {
    e.preventDefault();
    setSuccess(null);
    try {
      await registerUser(newUser);
      setSuccess('User registered and email sent!');
      setNewUser({ first_name: '', last_name: '', email: '', password: '', role: 'viewer' });
      loadUsers();
    } catch (err) {
      setError('Failed to add user');
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      await updateUserRole(userId, newRole);
      loadUsers();
    } catch (err) {
      setError('Failed to update role');
    }
  }

  async function handleRemove(userId) {
    if (!window.confirm('Remove this user?')) return;
    try {
      await removeUser(userId);
      loadUsers();
    } catch (err) {
      setError('Failed to remove user');
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4">User Management</h2>
      {error && <div className="text-red-400 mb-2">{error}</div>}
      {success && <div className="text-green-400 mb-2">{success}</div>}
      <form onSubmit={handleAddUser} className="flex flex-wrap gap-2 mb-6 items-end">
        <input type="email" required placeholder="Email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="border rounded px-2 py-1 bg-gray-900 text-white" />
        <input type="password" required placeholder="Password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="border rounded px-2 py-1 bg-gray-900 text-white" />
        <input type="text" required placeholder="First Name" value={newUser.first_name} onChange={e => setNewUser({ ...newUser, first_name: e.target.value })} className="border rounded px-2 py-1 bg-gray-900 text-white" />
        <input type="text" required placeholder="Last Name" value={newUser.last_name} onChange={e => setNewUser({ ...newUser, last_name: e.target.value })} className="border rounded px-2 py-1 bg-gray-900 text-white" />
        <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="border rounded px-2 py-1 bg-gray-900 text-white">
          {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <input type="text" value={user.companyName || ''} readOnly className="border rounded px-2 py-1 bg-gray-800 text-gray-400" title="Company" style={{ minWidth: 120 }} />
        <button type="submit" className="bg-cyan-700 text-white px-4 py-1 rounded">Add User</button>
      </form>
      {loading ? <div className="text-gray-200">Loading...</div> : (
        <table className="min-w-full border text-gray-200 bg-gray-900 rounded-lg">
          <thead className="bg-gray-800">
            <tr>
              <th className="border px-2 py-2">Name</th>
              <th className="border px-2 py-2">Email</th>
              <th className="border px-2 py-2">Role</th>
              <th className="border px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-800 transition-colors">
                <td className="border px-2 py-2">{u.first_name} {u.last_name}</td>
                <td className="border px-2 py-2">{u.email}</td>
                <td className="border px-2 py-2">
                  <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)} className="border rounded px-1 bg-gray-900 text-white">
                    {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </td>
                <td className="border px-2 py-2">
                  {u.id !== user.userId && (
                    <button onClick={() => handleRemove(u.id)} className="text-red-400 hover:underline">Remove</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
