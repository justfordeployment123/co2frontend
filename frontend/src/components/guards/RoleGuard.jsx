import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * RoleGuard Component
 * Restricts access to routes based on user roles
 * 
 * @param {string[]} allowedRoles - Array of roles that can access this route
 * @param {React.ReactNode} children - Child components to render if authorized
 */
const RoleGuard = ({ children, allowedRoles = [] }) => {
  const { user, hasAnyRole } = useAuth();

  // If no user, redirect to login (should not happen if behind AuthGuard)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has any of the allowed roles
  if (!hasAnyRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RoleGuard;
