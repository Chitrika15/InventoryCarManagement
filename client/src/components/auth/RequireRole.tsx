import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore.js';
import { UserRole } from '../../types/index.js';

interface RequireRoleProps {
  roles: UserRole[];
  children: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({ roles, children }) => {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
