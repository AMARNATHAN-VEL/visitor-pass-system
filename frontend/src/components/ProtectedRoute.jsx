import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * Route guard that checks authentication and role authorization.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The protected page content.
 * @param {string[]} [props.allowedRoles] - Roles permitted to access the route.
 * @returns {React.ReactElement}
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  // While a login request is in flight, show a spinner.
  if (loading) {
    return <LoadingSpinner text="Authenticating..." />;
  }

  const isAuthenticated = Boolean(token && user);

  // Not logged in -> redirect to login, preserving the intended destination.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Logged in but role not permitted -> send to login as well.
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}