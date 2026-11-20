import '../styles/components.css';

/**
 * Inline error banner with an optional retry button.
 *
 * Props:
 *   message — Error text to display (renders nothing if empty/falsy)
 *   onRetry — Optional callback; if provided a "Try Again" button is shown
 */
function ErrorMessage({ message, onRetry = null }) {
  if (!message) return null;

  return (
    <div className="error-message" role="alert">
      <p className="error-message__text">⚠️ {message}</p>
      {onRetry && (
        <button onClick={onRetry} className="error-message__retry-btn">
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
