import '../styles/components.css';

function StatusBadge({ status, expiryTime }) {
  const isExpired = expiryTime && new Date(expiryTime).getTime() <= Date.now();
  const normalized = isExpired ? 'EXPIRED' : String(status || 'UNKNOWN').toUpperCase();
  const label = normalized === 'AVAILABLE'
    ? 'Available'
    : normalized.charAt(0) + normalized.slice(1).toLowerCase();

  return (
    <span className={`status-badge status-badge--${normalized.toLowerCase()}`}>
      {label}
    </span>
  );
}

export default StatusBadge;
