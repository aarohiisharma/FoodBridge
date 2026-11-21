import Button from './Button';
import StatusBadge from './StatusBadge';
import '../styles/components.css';

function PickupRequestCard({ pickup, donationName, onUpdateStatus, updating = false }) {
  const pending = String(pickup.status).toUpperCase() === 'PENDING';

  return (
    <article className="pickup-request-card">
      <div className="pickup-request-card__header">
        <div>
          <h3>{donationName || `Donation #${pickup.donation_id}`}</h3>
          {pickup.notes && <p className="pickup-request-card__notes">{pickup.notes}</p>}
        </div>
        <StatusBadge status={pickup.status} />
      </div>
      {pending && (
        <div className="pickup-request-card__actions">
          <Button
            type="button"
            size="small"
            onClick={() => onUpdateStatus(pickup, 'APPROVED')}
            loading={updating}
          >
            Approve
          </Button>
          <Button
            type="button"
            size="small"
            variant="danger"
            onClick={() => onUpdateStatus(pickup, 'REJECTED')}
            loading={updating}
          >
            Reject
          </Button>
        </div>
      )}
    </article>
  );
}

export default PickupRequestCard;
