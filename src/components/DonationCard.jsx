import Button from './Button';
import StatusBadge from './StatusBadge';
import '../styles/components.css';

function formatDate(value) {
  if (!value) return 'Not specified';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not specified' : date.toLocaleString();
}

function DonationCard({ donation, onEdit, onDelete }) {
  const expired = donation.expiry_time && new Date(donation.expiry_time) <= new Date();

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
          <Button
            type="button"
            size="small"
            variant="outline"
            onClick={() => onEdit(donation)}
            aria-label={`Edit ${donation.food_name}`}
          >
            Edit
          </Button>
          <Button
            type="button"
            size="small"
            variant="danger"
            onClick={() => onDelete(donation)}
            aria-label={`Delete ${donation.food_name}`}
          >
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
}

export default DonationCard;
