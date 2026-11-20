import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

/**
 * Route guard that checks authentication and (optionally) user roles.
 *
 * Props:
 *   children     — The protected page component
 *   allowedRoles — Array of role strings that may access this route
 *                  (e.g. ['donor'], ['admin']). If empty, any
 *                  authenticated user is allowed.
 *
 * Behavior:
 *   1. While auth state is loading → shows a spinner.
 *   2. Not authenticated           → redirects to /login.
 *   3. Authenticated but wrong role → redirects to the user's own dashboard.
 *   4. Authenticated and authorized → renders children.
 */
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to={`/dashboard/${user?.role}`} replace />;
  }

  return children;
}

export default ProtectedRoute;
