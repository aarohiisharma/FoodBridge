import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import '../styles/pages.css';

/**
 * NGO Dashboard — placeholder page.
 *
 * Shows available food listings, claimed donations, and
 * beneficiary reach. Data will come from the backend API.
 */
function NgoDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // TODO: Replace with actual API call (e.g. ngoService.getDashboard())
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <LoadingSpinner message="Loading available food..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-page__title">NGO Dashboard</h1>
      <p className="dashboard-page__welcome">
        Welcome, {user?.name}! Browse and claim available donations.
      </p>

      <div className="dashboard-page__cards">
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">📋 Available Food</h3>
          <p className="dashboard-card__value">—</p>
          <p className="dashboard-card__description">
            Donations available for your organization.
          </p>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">🤝 Claimed</h3>
          <p className="dashboard-card__value">—</p>
          <p className="dashboard-card__description">
            Donations you have claimed for pickup.
          </p>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">👥 Beneficiaries</h3>
          <p className="dashboard-card__value">—</p>
          <p className="dashboard-card__description">
            People served through FoodBridge.
          </p>
        </div>
      </div>
    </div>
  );
}

export default NgoDashboard;
