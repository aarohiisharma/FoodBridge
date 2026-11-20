import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import '../styles/pages.css';

/**
 * Donor Dashboard — placeholder page.
 *
 * Shows summary cards for active donations, completed deliveries,
 * and impact metrics. Data will come from the backend API.
 */
function DonorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // TODO: Replace with actual API call (e.g. donorService.getDashboard())
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <LoadingSpinner message="Loading your donations..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-page__title">Donor Dashboard</h1>
      <p className="dashboard-page__welcome">
        Welcome, {user?.name}! Manage your food donations here.
      </p>

      <div className="dashboard-page__cards">
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">📦 Active Donations</h3>
          <p className="dashboard-card__value">—</p>
          <p className="dashboard-card__description">
            Donations currently available for pickup.
          </p>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">✅ Completed</h3>
          <p className="dashboard-card__value">—</p>
          <p className="dashboard-card__description">
            Donations successfully delivered.
          </p>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">📊 Impact</h3>
          <p className="dashboard-card__value">—</p>
          <p className="dashboard-card__description">
            Meals saved from going to waste.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DonorDashboard;
