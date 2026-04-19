import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { PageLoader } from './UI';

/**
 * AdminRedirectRoute - Redirects admin users to /admin
 * Allows non-admin users (client, freelancer) to access the route
 * Allows unauthenticated users to access the route
 */
function AdminRedirectRoute({ children }) {
  const user = useAuthStore(s => s.user);
  const isLoading = useAuthStore(s => s.isLoading);

  if (isLoading) {
    return <PageLoader />;
  }

  // If user is admin, redirect to /admin
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Otherwise allow access
  return children;
}

export default AdminRedirectRoute;
