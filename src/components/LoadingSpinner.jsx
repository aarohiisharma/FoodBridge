import '../styles/components.css';

/**
 * Centered loading spinner with an optional message.
 *
 * Props:
 *   message — Text shown below the spinner (default: 'Loading...')
 */
function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="loading-spinner" role="status">
      <div className="loading-spinner__circle" />
      <p className="loading-spinner__message">{message}</p>
    </div>
  );
}

export default LoadingSpinner;
