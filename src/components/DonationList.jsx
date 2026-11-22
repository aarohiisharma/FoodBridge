import DonationCard from './DonationCard';
import '../styles/components.css';

function DonationList({ donations, onEdit, onDelete }) {
  if (!donations.length) {
    return (
      <div className="donation-list__empty">
        <p>You have not posted any donations yet.</p>
      </div>
    );
  }

  return (
    <div className="donation-list">
      {donations.map((donation) => (
        <DonationCard
          key={donation.id}
          donation={donation}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default DonationList;
