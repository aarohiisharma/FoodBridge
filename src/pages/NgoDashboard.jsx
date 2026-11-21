import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Button from '../components/Button';
import DonationCard from '../components/DonationCard';
import StatusBadge from '../components/StatusBadge';
import '../styles/pages.css';

function NgoDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [donations, setDonations] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minimumQuantity, setMinimumQuantity] = useState('');
  const [maximumQuantity, setMaximumQuantity] = useState('');
  const [location, setLocation] = useState('');
  const [expiryWindow, setExpiryWindow] = useState('');
  const [activeView, setActiveView] = useState('donations');
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [requestingId, setRequestingId] = useState(null);
  const [notes, setNotes] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [donationResponse, pickupResponse] = await Promise.all([
        api.get('/api/donations'),
        api.get('/api/pickups/my'),
      ]);
      setDonations(donationResponse.data.donations || []);
      setPickups(pickupResponse.data.pickups || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load available donations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const filteredDonations = useMemo(() => {
    const now = Date.now();
    return donations.filter((donation) => {
      const status = String(donation.status).toUpperCase();
      const expiry = donation.expiry_time ? new Date(donation.expiry_time).getTime() : Infinity;
      if (status !== 'AVAILABLE' || Number.isNaN(expiry) || expiry <= now) return false;
      if (search && !String(donation.food_name || '').toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (category && String(donation.food_type).toUpperCase() !== category) return false;
      if (minimumQuantity && Number(donation.quantity) < Number(minimumQuantity)) return false;
      if (maximumQuantity && Number(donation.quantity) > Number(maximumQuantity)) return false;
      if (
        location
        && !String(donation.pickup_location || '').toLowerCase().includes(location.toLowerCase())
      ) return false;
      if (expiryWindow) {
        const windowMs = Number(expiryWindow) * 60 * 60 * 1000;
        if (expiry > now + windowMs) return false;
      }
      return true;
    });
  }, [donations, search, category, minimumQuantity, maximumQuantity, location, expiryWindow]);

  async function openDetails(donation) {
    setDetailsLoading(true);
    setError('');
    setNotes('');
    try {
      const response = await api.get(`/api/donations/${donation.id}`);
      setSelectedDonation(response.data.donation || donation);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load donation details.');
    } finally {
      setDetailsLoading(false);
    }
  }

  async function requestPickup(donation) {
    const status = String(donation.status).toUpperCase();
    const expired = donation.expiry_time && new Date(donation.expiry_time).getTime() <= Date.now();
    if (status !== 'AVAILABLE' || expired) {
      setError('This donation is unavailable or has expired.');
      return;
    }

    setRequestingId(donation.id);
    setError('');
    try {
      const response = await api.post('/api/pickups', {
        donation_id: donation.id,
        notes,
      });
      setPickups((current) => [response.data.pickup, ...current]);
      setSelectedDonation(null);
      setNotes('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not request pickup.');
    } finally {
      setRequestingId(null);
    }
  }

  async function cancelPickup(pickup) {
    setRequestingId(pickup.id);
    setError('');
    try {
      await api.delete(`/api/pickups/${pickup.id}`);
      setPickups((current) =>
        current.map((item) =>
          item.id === pickup.id ? { ...item, status: 'CANCELLED' } : item,
        ),
      );
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not cancel the pickup request.');
    } finally {
      setRequestingId(null);
    }
  }

  if (loading) return <LoadingSpinner message="Loading available food..." />;
  const pendingPickups = pickups.filter(
    (pickup) => String(pickup.status).toUpperCase() === 'PENDING',
  );
  const pickupHistory = pickups.filter((pickup) =>
    ['APPROVED', 'ASSIGNED', 'ACCEPTED', 'IN_TRANSIT', 'COMPLETED'].includes(
      String(pickup.status).toUpperCase(),
    ),
  );
  const claimedCount = pickupHistory.filter((pickup) =>
    ['APPROVED', 'ASSIGNED', 'ACCEPTED', 'IN_TRANSIT'].includes(
      String(pickup.status).toUpperCase(),
    ),
  ).length;
  const completedCount = pickupHistory.filter(
    (pickup) => String(pickup.status).toUpperCase() === 'COMPLETED',
  ).length;

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__header">
        <div>
          <h1 className="dashboard-page__title">NGO Dashboard</h1>
          <p className="dashboard-page__welcome">
            Welcome, {user?.name}! Browse and claim available donations.
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadDashboard} />}

      <div className="dashboard-page__cards">
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">Available Food</h3>
          <p className="dashboard-card__value">{filteredDonations.length}</p>
          <p className="dashboard-card__description">Available for your organization.</p>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">Claimed</h3>
          <p className="dashboard-card__value">{claimedCount}</p>
          <p className="dashboard-card__description">Accepted pickups in progress.</p>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">Completed</h3>
          <p className="dashboard-card__value">{completedCount}</p>
          <p className="dashboard-card__description">Successful deliveries.</p>
        </div>
      </div>

      <div className="ngo-dashboard__tabs" role="tablist" aria-label="NGO dashboard views">
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'donations'}
          className={activeView === 'donations' ? 'is-active' : ''}
          onClick={() => setActiveView('donations')}
        >
          Available donations
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'pickups'}
          className={activeView === 'pickups' ? 'is-active' : ''}
          onClick={() => setActiveView('pickups')}
        >
          My pickups
        </button>
      </div>

      {activeView === 'donations' ? (
        <section className="dashboard-section">
          <h2>Available food</h2>
          <div className="ngo-filters">
            <label className="ngo-filters__search">
              <span>Search by food name</span>
              <input
                type="search"
                aria-label="Search by food name"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search food..."
              />
            </label>
            <label>
              <span>Food category</span>
              <select
                aria-label="Food category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">All categories</option>
                <option value="COOKED">Cooked</option>
                <option value="PACKAGED">Packaged</option>
                <option value="RAW">Raw</option>
                <option value="BAKERY">Bakery</option>
                <option value="FRUIT_VEG">Fruit and vegetables</option>
                <option value="DAIRY">Dairy</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <label>
              <span>Minimum quantity</span>
              <input
                type="number"
                min="0"
                aria-label="Minimum quantity"
                value={minimumQuantity}
                onChange={(event) => setMinimumQuantity(event.target.value)}
              />
            </label>
            <label>
              <span>Maximum quantity</span>
              <input
                type="number"
                min="0"
                aria-label="Maximum quantity"
                value={maximumQuantity}
                onChange={(event) => setMaximumQuantity(event.target.value)}
              />
            </label>
            <label>
              <span>Expiry time</span>
              <select
                aria-label="Expiry time"
                value={expiryWindow}
                onChange={(event) => setExpiryWindow(event.target.value)}
              >
                <option value="">Any expiry time</option>
                <option value="24">Next 24 hours</option>
                <option value="48">Next 48 hours</option>
                <option value="168">Next 7 days</option>
              </select>
            </label>
            <label>
              <span>Location</span>
              <input
                type="search"
                aria-label="Search by location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Pickup location..."
              />
            </label>
          </div>

          {filteredDonations.length ? (
            <div className="ngo-donation-grid">
              {filteredDonations.map((donation) => (
                <DonationCard
                  key={donation.id}
                  donation={donation}
                  onDetails={openDetails}
                  onRequestPickup={requestPickup}
                  requestDisabled={requestingId === donation.id}
                />
              ))}
            </div>
          ) : (
            <div className="donation-list__empty">
              <p>No donations match your filters.</p>
            </div>
          )}
        </section>
      ) : (
        <section className="dashboard-section">
          <h2>Pickup requests</h2>
          {pickups.length ? (
            <div className="pickup-request-list">
              {pickups.map((pickup) => (
                <article className="pickup-request-card" key={pickup.id}>
                  <div className="pickup-request-card__header">
                    <div>
                      <h3>Donation #{pickup.donation_id}</h3>
                      {pickup.notes && <p className="pickup-request-card__notes">{pickup.notes}</p>}
                    </div>
                    <StatusBadge status={pickup.status} />
                  </div>
                  {String(pickup.status).toUpperCase() === 'PENDING' && (
                    <div className="pickup-request-card__actions">
                      <Button
                        type="button"
                        size="small"
                        variant="danger"
                        loading={requestingId === pickup.id}
                        onClick={() => cancelPickup(pickup)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="donation-list__empty">
              <p>No pickup requests yet.</p>
            </div>
          )}
        </section>
      )}

      {selectedDonation && (
        <div className="ngo-modal-backdrop" role="presentation">
          <div className="ngo-modal" role="dialog" aria-modal="true" aria-labelledby="donation-details-title">
            <div className="ngo-modal__header">
              <h2 id="donation-details-title">{selectedDonation.food_name}</h2>
              <button type="button" aria-label="Close donation details" onClick={() => setSelectedDonation(null)}>
                ×
              </button>
            </div>
            {detailsLoading ? (
              <LoadingSpinner message="Loading donation details..." />
            ) : (
              <>
                {selectedDonation.image_url && (
                  <img
                    className="ngo-modal__image"
                    src={selectedDonation.image_url}
                    alt={selectedDonation.food_name}
                  />
                )}
                <StatusBadge status={selectedDonation.status} expiryTime={selectedDonation.expiry_time} />
                <p><strong>Category:</strong> {String(selectedDonation.food_type || 'Other').replace('_', ' ')}</p>
                <p><strong>Quantity:</strong> {selectedDonation.quantity} {selectedDonation.quantity_unit}</p>
                <p><strong>Prepared:</strong> {new Date(selectedDonation.preparation_time).toLocaleString()}</p>
                <p><strong>Consume by:</strong> {new Date(selectedDonation.expiry_time).toLocaleString()}</p>
                <p><strong>Pickup location:</strong> {selectedDonation.pickup_location}</p>
                {(selectedDonation.donor_name || selectedDonation.donor) && (
                  <p><strong>Donor:</strong> {selectedDonation.donor_name || selectedDonation.donor.name}</p>
                )}
                {selectedDonation.description && (
                  <p><strong>Pickup instructions:</strong> {selectedDonation.description}</p>
                )}
                <label className="ngo-modal__notes">
                  <span>Pickup note (optional)</span>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows="3"
                  />
                </label>
                <div className="ngo-modal__actions">
                  <Button type="button" variant="outline" onClick={() => setSelectedDonation(null)}>
                    Close
                  </Button>
                  <Button
                    type="button"
                    loading={requestingId === selectedDonation.id}
                    onClick={() => requestPickup(selectedDonation)}
                    disabled={
                      String(selectedDonation.status).toUpperCase() !== 'AVAILABLE'
                      || (selectedDonation.expiry_time
                        && new Date(selectedDonation.expiry_time).getTime() <= Date.now())
                    }
                  >
                    Request pickup
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NgoDashboard;
