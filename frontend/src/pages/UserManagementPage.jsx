import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { userAPI } from '../api/userAPI';
import { useAuth } from "../contexts/AuthContext";

const UserManagementPage = () => {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const { user } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserData, setAddUserData] = useState({ 
    firstName: '',
    lastName: '',
    email: '', 
    password: '',
    role: 'viewer' 
  });
  const [isAdding, setIsAdding] = useState(false);

  const canManageUsers = user?.role === 'company_admin';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userAPI.getCompanyUsers(user.companyId);
      setUsers(data || []);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    
    try {
      await userAPI.addUser(user.companyId, addUserData);
      success('User added and credentials sent via email');
      setShowAddUserModal(false);
      setAddUserData({ 
        firstName: '',
        lastName: '',
        email: '', 
        password: '',
        role: 'viewer' 
      });
      fetchUsers();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to add user');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await userAPI.updateUserRole(userId, user.companyId, newRole);
      success(t('users.roleUpdateSuccess', 'User role updated successfully'));
      fetchUsers();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (!confirm(t('users.confirmDeactivate', 'Are you sure you want to deactivate this user?'))) return;
    
    try {
      await userAPI.deactivateUser(userId);
      success(t('users.deactivateSuccess', 'User deactivated successfully'));
      fetchUsers();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to deactivate user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm(t('users.confirmDelete', 'Are you sure you want to permanently remove this user from the company?'))) return;
    
    try {
      await userAPI.deleteUser(user.companyId, userId);
      success(t('users.deleteSuccess', 'User removed successfully'));
      fetchUsers();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleReactivateUser = async (userId) => {
    try {
      await userAPI.reactivateUser(userId);
      success(t('users.reactivateSuccess', 'User reactivated successfully'));
      fetchUsers();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to reactivate user');
    }
  };


  const getRoleBadge = (role) => {
    const styles = {
      company_admin: 'bg-cyan-mist text-midnight-navy',
      editor: 'bg-growth-green text-midnight-navy',
      viewer: 'bg-stone-gray text-off-white',
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[role]}`}>
        {role.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const columns = [
    {
      key: 'name',
      header: t('users.name', 'Name'),
      sortable: true,
      accessor: (row) => row.first_name + ' ' + row.last_name,
    },
    {
      key: 'email',
      header: t('users.email', 'Email'),
      sortable: true,
    },
    {
      key: 'role',
      header: t('users.role', 'Role'),
      sortable: true,
      render: (row) => getRoleBadge(row.role),
    },
    {
      key: 'last_login',
      header: t('users.lastLogin', 'Last Login'),
      sortable: true,
      accessor: (row) => row.last_login ? new Date(row.last_login).toLocaleDateString() : 'Never',
    },
    {
      key: 'actions',
      header: t('common.actions', 'Actions'),
      render: (row) => (
        <div className="flex items-center gap-2">
          {canManageUsers && row.id !== user.id && (
            <>
              <select
                value={row.role}
                onChange={(e) => {
                  e.stopPropagation();
                  handleRoleChange(row.id, e.target.value);
                }}
                className="px-2 py-1 bg-midnight-navy border border-carbon-gray rounded text-off-white text-sm focus:outline-none focus:border-cyan-mist"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="company_admin">Admin</option>
              </select>
              {row.is_active === false ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReactivateUser(row.id);
                  }}
                  className="text-green-500 hover:text-green-400 transition-colors text-sm"
                >
                  {t('common.reactivate', 'Reactivate')}
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeactivateUser(row.id);
                  }}
                  className="text-red-500 hover:text-red-400 transition-colors text-sm"
                >
                  {t('common.deactivate', 'Deactivate')}
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteUser(row.id);
                }}
                className="text-red-500 hover:text-red-400 transition-colors text-sm ml-2"
                title={t('common.delete', 'Delete User')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
          {row.id === user.id && (
            <span className="text-stone-gray text-sm">(You)</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-midnight-navy p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-off-white mb-2">
              {t('users.title', 'User Management')}
            </h1>
            <p className="text-stone-gray">
              {t('users.subtitle', 'Manage team members and their permissions')}
            </p>
          </div>
          {canManageUsers && (
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-4 py-2 bg-cyan-mist text-midnight-navy rounded-lg hover:bg-growth-green transition-colors font-medium"
            >
              + {t('users.addUser', 'Add User')}
            </button>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-midnight-navy-lighter border border-carbon-gray rounded-lg p-6">
          <DataTable
            data={users}
            columns={columns}
            loading={loading}
            searchable
            pagination
            pageSize={15}
            emptyMessage={t('users.noUsers', 'No users found')}
          />
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        title={t('users.addUser', 'Add New User')}
        size="md"
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-off-white mb-2">
                {t('users.firstName', 'First Name')} *
              </label>
              <input
                type="text"
                value={addUserData.firstName}
                onChange={(e) => setAddUserData(prev => ({ ...prev, firstName: e.target.value }))}
                required
                className="w-full px-4 py-2 bg-midnight-navy border border-carbon-gray rounded-lg text-off-white focus:outline-none focus:border-cyan-mist"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-off-white mb-2">
                {t('users.lastName', 'Last Name')} *
              </label>
              <input
                type="text"
                value={addUserData.lastName}
                onChange={(e) => setAddUserData(prev => ({ ...prev, lastName: e.target.value }))}
                required
                className="w-full px-4 py-2 bg-midnight-navy border border-carbon-gray rounded-lg text-off-white focus:outline-none focus:border-cyan-mist"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-off-white mb-2">
              {t('users.email', 'Email')} *
            </label>
            <input
              type="email"
              value={addUserData.email}
              onChange={(e) => setAddUserData(prev => ({ ...prev, email: e.target.value }))}
              required
              className="w-full px-4 py-2 bg-midnight-navy border border-carbon-gray rounded-lg text-off-white focus:outline-none focus:border-cyan-mist"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-off-white mb-2">
              {t('users.password', 'Password')} *
            </label>
            <input
              type="password"
              value={addUserData.password}
              onChange={(e) => setAddUserData(prev => ({ ...prev, password: e.target.value }))}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full px-4 py-2 bg-midnight-navy border border-carbon-gray rounded-lg text-off-white focus:outline-none focus:border-cyan-mist"
              placeholder="********"
            />
            <p className="text-xs text-stone-gray mt-1">Min. 8 characters</p>
          </div>

          <div>
             <label className="block text-sm font-medium text-off-white mb-2">
               {t('users.company', 'Company')}
             </label>
             <input
               type="text"
               value={user.companyName || 'Current Company'} 
               disabled
               className="w-full px-4 py-2 bg-midnight-navy-dark border border-carbon-gray rounded-lg text-stone-gray cursor-not-allowed"
             />
          </div>

          <div>
            <label className="block text-sm font-medium text-off-white mb-2">
              {t('users.role', 'Role')} *
            </label>
            <select
              value={addUserData.role}
              onChange={(e) => setAddUserData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-4 py-2 bg-midnight-navy border border-carbon-gray rounded-lg text-off-white focus:outline-none focus:border-cyan-mist"
            >
              <option value="viewer">Viewer - Read only access</option>
              <option value="editor">Editor - Can add/edit data</option>
              <option value="company_admin">Admin - Full access</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-carbon-gray">
            <button
              type="button"
              onClick={() => setShowAddUserModal(false)}
              className="px-6 py-2 border border-carbon-gray text-off-white rounded-lg hover:bg-midnight-navy transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isAdding}
              className="px-6 py-2 bg-cyan-mist text-midnight-navy rounded-lg hover:bg-growth-green transition-colors font-medium disabled:opacity-50"
            >
              {isAdding ? t('common.adding', 'Adding...') : t('users.addUser', 'Add User')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagementPage;
