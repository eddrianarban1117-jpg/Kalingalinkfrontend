import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { routePaths } from '../constants/app-constants';
import { useAuth, type UserRole } from './AuthProvider';
import { dashboardPathForRole } from './role-routes';

export function RequireRole({
  allowed,
  children,
}: {
  allowed: UserRole[];
  children: ReactNode;
}) {
  const { user, loading, sessionMessage } = useAuth();
  const location = useLocation();
  if (loading) return <main aria-live="polite">Checking your session…</main>;
  if (!user) {
    return (
      <Navigate
        to={routePaths.login}
        replace
        state={{
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
          message: sessionMessage || 'Please log in to access this page.',
        }}
      />
    );
  }
  if (!allowed.includes(user.role)) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }
  if (
    user.role === 'teacher' &&
    user.is_active !== true
  ) {
    return (
      <Navigate
        to={routePaths.login}
        replace
        state={{
          message: 'Your teacher account must be approved and activated before you can sign in.',
        }}
      />
    );
  }
  return children;
}