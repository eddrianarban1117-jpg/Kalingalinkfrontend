import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { dashboardPathForRole } from './role-routes';

export function GuestOnlyRoute({
  children,
  redirectAuthenticated = true,
}: {
  children: ReactNode;
  redirectAuthenticated?: boolean;
}) {
  const { user, loading } = useAuth();

  if (loading) return <main aria-live="polite">Checking your session…</main>;
  if (user && redirectAuthenticated) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }
  return children;
}
