import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from './StatusMessage';

/**
 * Renders children only for signed-in users; otherwise redirects to
 * /login. With `role`, users without that role are sent home.
 * (The API enforces roles too - this only controls what is shown.)
 */
export default function RequireAuth({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container pt-36 pb-24">
        <LoadingState label="Checking session…" />
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
