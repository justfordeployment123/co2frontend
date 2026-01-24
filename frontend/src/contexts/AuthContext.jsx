import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/authAPI';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, user: userData } = response;

      // Transform user data to include primary role
      const transformedUser = {
        ...userData,
        role: userData.companies?.[0]?.role || 'viewer',
        companyId: userData.companies?.[0]?.companyId,
        companyName: userData.companies?.[0]?.companyName,
      };

      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(transformedUser));

      setUser(transformedUser);
      setIsAuthenticated(true);

      return { success: true, data: transformedUser };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (registrationData) => {
    try {
      const response = await authAPI.register(registrationData);
      const { token, user: userData } = response;

      // Transform user data - company/signup returns 'company' (singular), not 'companies' (array)
      const transformedUser = {
        ...userData,
        role: userData.company?.role || 'company_admin',
        companyId: userData.company?.id,
        companyName: userData.company?.name,
        // Also create companies array for consistency with login response
        companies: userData.company ? [{
          companyId: userData.company.id,
          companyName: userData.company.name,
          role: userData.company.role
        }] : []
      };

      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(transformedUser));

      setUser(transformedUser);
      setIsAuthenticated(true);

      return { success: true, data: transformedUser };
    } catch (error) {
      console.error('Registration failed:', error);
      
      // Extract error message from various possible response structures
      let errorMessage = 'Registration failed';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 409) {
        errorMessage = 'Email or company name already exists. Please use a different one.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid registration data. Please check all fields.';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const logout = () => {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Clear state
    setUser(null);
    setIsAuthenticated(false);

    // Call logout endpoint (optional, for server-side session cleanup)
    authAPI.logout().catch(console.error);
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
