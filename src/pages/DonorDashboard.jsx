import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Button from '../components/Button';
import DonationForm from '../components/DonationForm';
import DonationList from '../components/DonationList';
import PickupRequestCard from '../components/PickupRequestCard';
import '../styles/pages.css';

function DonorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [donations, setDonations] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDonation, setEditingDonation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [updatingPickupId, setUpdatingPickupId] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [donationResponse, pickupResponse] = await Promise.all([
        api.get('/api/donations/my'),
        api.get('/api/pickups/my'),
      ]);
      setDonations(donationResponse.data.donations || []);
      setPickups(pickupResponse.data.pickups || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  function openCreateForm() {
    setEditingDonation(null);
    setShowForm(true);
  }

  function openEditForm(donation) {
    setEditingDonation(donation);
    setShowForm(true);
  }

  async function handleDonationSubmit(payload) {
    setSubmitting(true);
    setError('');
    try {
      if (editingDonation) {
        const response = await api.put(`/api/donations/${editingDonation.id}`, payload);
        const updated = response.data.donation;
        setDonations((current) =>
          current.map((donation) => (donation.id === editingDonation.id ? updated : donation)),
        );
      } else {
        const response = await api.post('/api/donations', payload);
        setDonations((current) => [response.data.donation, ...current]);
      }
      setShowForm(false);
      setEditingDonation(null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save the donation.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(donation) {
    if (!window.confirm(`Delete ${donation.food_name}?`)) return;
    setError('');
    try {
      await api.delete(`/api/donations/${donation.id}`);
      setDonations((current) => current.filter((item) => item.id !== donation.id));
      setPickups((current) => current.filter((item) => item.donation_id !== donation.id));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not delete the donation.');
    }
  }

  async function handlePickupStatus(pickup, status) {
    setUpdatingPickupId(pickup.id);
    setError('');
    try {
      const response = await api.patch(`/api/pickups/${pickup.id}/status`, { status });
      const updated = response.data.pickup;
      setPickups((current) =>
        current.map((item) => (item.id === pickup.id ? { ...item, ...updated } : item)),
      );
      if (status === 'APPROVED') {
        setDonations((current) =>
          current.map((donation) =>
            donation.id === pickup.donation_id ? { ...donation, status: 'CLAIMED' } : donation,
          ),
        );
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update the pickup request.');
    } finally {
      setUpdatingPickupId(null);
    }
  }

  if (loading) return <LoadingSpinner message="Loading your donations..." />;
  const now = Date.now();
  const activeDonations = donations.filter(
    (donation) =>
      String(donation.status).toUpperCase() === 'AVAILABLE'
      && (!donation.expiry_time || new Date(donation.expiry_time).getTime() > now),
  );
  const completedCount = donations.filter(
    (donation) => String(donation.status).toUpperCase() === 'COMPLETED'
      || String(donation.status).toUpperCase() === 'DELIVERED',
  ).length;
  const pendingRequests = pickups.filter(
    (pickup) => String(pickup.status).toUpperCase() === 'PENDING',
  ).length;
  const donationNames = Object.fromEntries(
    donations.map((donation) => [String(donation.id), donation.food_name]),
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__header">
        <div>
          <h1 className="dashboard-page__title">Donor Dashboard</h1>
          <p className="dashboard-page__welcome">
            Welcome, {user?.name}! Manage your food donations here.
          </p>
        </div>
        <Button type="button" onClick={openCreateForm}>
          Post Donation
        </Button>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadDashboard} />}

      {showForm && (
        <section className="dashboard-section">
          <h2>{editingDonation ? 'Edit donation' : 'Create new donation'}</h2>
          <DonationForm
            donation={editingDonation}
            onSubmit={handleDonationSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingDonation(null);
            }}
            submitting={submitting}
          />
        </section>
      )}

      <div className="dashboard-page__cards">
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">Active Donations</h3>
          <p className="dashboard-card__value">{activeDonations.length}</p>
          <p className="dashboard-card__description">Currently available for pickup.</p>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">Pending Requests</h3>
          <p className="dashboard-card__value">{pendingRequests}</p>
          <p className="dashboard-card__description">Waiting for your decision.</p>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">Completed</h3>
          <p className="dashboard-card__value">{completedCount}</p>
          <p className="dashboard-card__description">Donations successfully delivered.</p>
        </div>
      </div>

      <section className="dashboard-section">
        <h2>My donations</h2>
        <DonationList
          donations={donations}
          onEdit={openEditForm}
          onDelete={handleDelete}
        />
      </section>

      <section className="dashboard-section">
        <h2>Pickup requests</h2>
        {pickups.length ? (
          <div className="pickup-request-list">
            {pickups.map((pickup) => (
              <PickupRequestCard
                key={pickup.id}
                pickup={pickup}
                donationName={donationNames[String(pickup.donation_id)]}
                onUpdateStatus={handlePickupStatus}
                updating={updatingPickupId === pickup.id}
              />
            ))}
          </div>
        ) : (
          <div className="donation-list__empty">
            <p>No pickup requests have been received.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default DonorDashboard;
