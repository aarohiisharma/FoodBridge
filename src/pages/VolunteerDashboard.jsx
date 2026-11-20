import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import '../styles/pages.css';

/**
 * Volunteer Dashboard — placeholder page.
 *
 * Shows active delivery assignments, completed pickups,
 * and distance covered. Data will come from the backend API.
 */
function VolunteerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // TODO: Replace with actual API call (e.g. volunteerService.getDashboard())
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <LoadingSpinner message="Loading your deliveries..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-page__title">Volunteer Dashboard</h1>
      <p className="dashboard-page__welcome">
        Welcome, {user?.name}! Manage your delivery assignments.
      </p>

      <div className="dashboard-page__cards">
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">🚗 Active Deliveries</h3>
          <p className="dashboard-card__value">—</p>
          <p className="dashboard-card__description">
            Pickups assigned to you right now.
          </p>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">✅ Completed</h3>
          <p className="dashboard-card__value">—</p>
          <p className="dashboard-card__description">
            Deliveries you have finished.
          </p>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">🛣️ Distance</h3>
          <p className="dashboard-card__value">—</p>
          <p className="dashboard-card__description">
            Kilometers covered for food rescue.
          </p>
        </div>
      </div>
    </div>
  );
}

export default VolunteerDashboard;
