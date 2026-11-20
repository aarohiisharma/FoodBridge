import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import '../styles/pages.css';

/**
 * Admin Dashboard — placeholder page.
 *
 * Shows platform-wide stats: total users, active donations,
 * and completed deliveries. Data will come from the backend API.
 */
function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // TODO: Replace with actual API call (e.g. adminService.getDashboard())
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <LoadingSpinner message="Loading platform data..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-page__title">Admin Dashboard</h1>
      <p className="dashboard-page__welcome">
        Welcome, {user?.name}! Here is the platform overview.
      </p>

      <div className="dashboard-page__cards">
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">👤 Total Users</h3>
          <p className="dashboard-card__value">—</p>
          <p className="dashboard-card__description">
            Registered donors, NGOs, and volunteers.
          </p>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">📦 Active Donations</h3>
          <p className="dashboard-card__value">—</p>
          <p className="dashboard-card__description">
            Donations awaiting pickup across the platform.
          </p>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">✅ Deliveries Completed</h3>
          <p className="dashboard-card__value">—</p>
          <p className="dashboard-card__description">
            Successful food redistributions to date.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
