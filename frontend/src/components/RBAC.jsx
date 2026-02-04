import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function RBAC({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || (roles && !roles.includes(user.role))) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}
