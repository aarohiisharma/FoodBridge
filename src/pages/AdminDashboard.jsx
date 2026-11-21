import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import '../styles/pages.css';

function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [donations, setDonations] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsResponse, usersResponse, ngosResponse, donationsResponse] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
        api.get('/api/admin/ngos'),
        api.get('/api/admin/donations'),
      ]);
      setStats(statsResponse.data.stats || {});
      setUsers(usersResponse.data.users || []);
      setNgos(ngosResponse.data.ngos || []);
      setDonations(donationsResponse.data.donations || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load platform data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const roleCounts = useMemo(() => {
    const counts = { DONOR: 0, NGO: 0, VOLUNTEER: 0 };
    users.forEach((registeredUser) => {
      const role = String(registeredUser.role).toUpperCase();
      if (Object.prototype.hasOwnProperty.call(counts, role)) counts[role] += 1;
    });
    return counts;
  }, [users]);

  const availableCount = donations.filter(
    (donation) => String(donation.status).toUpperCase() === 'AVAILABLE',
  ).length;
  const completedCount = donations.filter(
    (donation) => String(donation.status).toUpperCase() === 'COMPLETED',
  ).length;
  const pendingNgos = ngos.filter(
    (ngo) => String(ngo.verification_status).toUpperCase() === 'PENDING',
  );

  async function updateVerification(ngo, status) {
    setUpdatingId(ngo.id);
    setError('');
    try {
      const response = await api.patch(`/api/admin/ngos/${ngo.id}/verification`, { status });
      const updatedNgo = response.data.ngo;
      setNgos((current) =>
        current.map((item) => (item.id === ngo.id ? { ...item, ...updatedNgo } : item)),
      );
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update NGO verification.');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) return <LoadingSpinner message="Loading platform data..." />;

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__header">
        <div>
          <h1 className="dashboard-page__title">Admin Dashboard</h1>
          <p className="dashboard-page__welcome">
            Welcome, {user?.name}! Here is the platform overview.
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadAdminData} />}

      <div className="dashboard-page__cards">
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">Total users</h3>
          <p className="dashboard-card__value">{stats.users ?? users.length}</p>
          <p className="dashboard-card__description">Registered platform users.</p>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">Total donors</h3>
          <p className="dashboard-card__value">{roleCounts.DONOR}</p>
          <p className="dashboard-card__description">Registered donor accounts.</p>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">Total NGOs</h3>
          <p className="dashboard-card__value">{roleCounts.NGO}</p>
          <p className="dashboard-card__description">Registered NGO accounts.</p>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">Total volunteers</h3>
          <p className="dashboard-card__value">{roleCounts.VOLUNTEER}</p>
          <p className="dashboard-card__description">Registered volunteer accounts.</p>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">Total donations</h3>
          <p className="dashboard-card__value">{stats.donations ?? donations.length}</p>
          <p className="dashboard-card__description">All recorded donations.</p>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">Available donations</h3>
          <p className="dashboard-card__value">{availableCount}</p>
          <p className="dashboard-card__description">Currently awaiting pickup.</p>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">Completed donations</h3>
          <p className="dashboard-card__value">{completedCount}</p>
          <p className="dashboard-card__description">Successfully delivered donations.</p>
        </div>
      </div>

      <section className="dashboard-section">
        <h2>Pending NGO verification requests</h2>
        {pendingNgos.length ? (
          <div className="pickup-request-list">
            {pendingNgos.map((ngo) => (
              <article className="pickup-request-card" key={ngo.id}>
                <div className="pickup-request-card__header">
                  <div>
                    <h3>{ngo.organization_name || ngo.name}</h3>
                    {ngo.registration_number && (
                      <p className="pickup-request-card__notes">
                        Registration: {ngo.registration_number}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={ngo.verification_status} />
                </div>
                {ngo.email && <p><strong>Email:</strong> {ngo.email}</p>}
                {ngo.phone && <p><strong>Phone:</strong> {ngo.phone}</p>}
                {ngo.address && <p><strong>Address:</strong> {ngo.address}</p>}
                <div className="pickup-request-card__actions">
                  <Button
                    type="button"
                    size="small"
                    loading={updatingId === ngo.id}
                    aria-label={`Approve ${ngo.organization_name || ngo.name}`}
                    onClick={() => updateVerification(ngo, 'APPROVED')}
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    size="small"
                    variant="danger"
                    loading={updatingId === ngo.id}
                    aria-label={`Reject ${ngo.organization_name || ngo.name}`}
                    onClick={() => updateVerification(ngo, 'REJECTED')}
                  >
                    Reject
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="donation-list__empty">
            <p>No pending NGO verification requests.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;
