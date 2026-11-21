import Button from './Button';
import StatusBadge from './StatusBadge';
import '../styles/components.css';

function formatDate(value) {
  if (!value) return 'Not specified';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not specified' : date.toLocaleString();
}

function DonationCard({
  donation,
  onEdit,
  onDelete,
  onDetails,
  onRequestPickup,
  requestDisabled = false,
}) {
  const expired = donation.expiry_time && new Date(donation.expiry_time) <= new Date();
  const unavailable = String(donation.status).toUpperCase() !== 'AVAILABLE' || expired;

  return (
    <article className="donation-card">
      {donation.image_url && (
        <img className="donation-card__image" src={donation.image_url} alt={donation.food_name} />
      )}
      <div className="donation-card__body">
        <div className="donation-card__header">
          <h3>{donation.food_name}</h3>
          <StatusBadge status={donation.status} expiryTime={donation.expiry_time} />
        </div>
        <p className="donation-card__quantity">
          {donation.quantity} {donation.quantity_unit}
        </p>
        <p><strong>Category:</strong> {String(donation.food_type || 'Other').replace('_', ' ')}</p>
        <p><strong>Pickup:</strong> {donation.pickup_location}</p>
        <p><strong>Prepared:</strong> {formatDate(donation.preparation_time)}</p>
        <p><strong>Consume by:</strong> {formatDate(donation.expiry_time)}</p>
        {donation.description && <p className="donation-card__description">{donation.description}</p>}
        <div className="donation-card__actions">
          {onDetails && (
            <Button
              type="button"
              size="small"
              variant="outline"
              onClick={() => onDetails(donation)}
              aria-label={`View details for ${donation.food_name}`}
            >
              View details
            </Button>
          )}
          {onRequestPickup && (
            <Button
              type="button"
              size="small"
              onClick={() => onRequestPickup(donation)}
              disabled={requestDisabled || unavailable}
            >
              Request pickup
            </Button>
          )}
          {onEdit && (
            <Button
              type="button"
              size="small"
              variant="outline"
              onClick={() => onEdit(donation)}
              aria-label={`Edit ${donation.food_name}`}
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              size="small"
              variant="danger"
              onClick={() => onDelete(donation)}
              aria-label={`Delete ${donation.food_name}`}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export default DonationCard;
