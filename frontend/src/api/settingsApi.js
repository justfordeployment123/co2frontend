import axios from 'axios';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchCompanyInfo() {
  const res = await axios.get('/api/companies/me', { headers: getAuthHeaders() });
  return res.data;
}

export async function updateCompanyInfo(data) {
  const res = await axios.put('/api/companies/me', data, { headers: getAuthHeaders() });
  return res.data;
}


// User Management
export async function fetchUsers() {
  const res = await axios.get('/api/settings/users', { headers: getAuthHeaders() });
  return res.data;
}

export async function registerUser({ first_name, last_name, email, password, role }) {
  const res = await axios.post('/api/settings/users', { first_name, last_name, email, password, role }, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateUserRole(userId, role) {
  const res = await axios.put(`/api/settings/users/${userId}/role`, { role }, { headers: getAuthHeaders() });
  return res.data;
}

export async function removeUser(userId) {
  const res = await axios.delete(`/api/settings/users/${userId}`, { headers: getAuthHeaders() });
  return res.data;
}

// Profile
export async function fetchProfile() {
  const res = await axios.get('/api/settings/profile', { headers: getAuthHeaders() });
  return res.data;
}

export async function updateProfile(profile) {
  const res = await axios.put('/api/settings/profile', profile, { headers: getAuthHeaders() });
  return res.data;
}
