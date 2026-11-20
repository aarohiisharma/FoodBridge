import { Link } from 'react-router-dom';
import '../styles/pages.css';

/**
 * 404 — Not Found page.
 *
 * Displayed for any unmatched route.
 */
function NotFound() {
  return (
    <div className="not-found-page">
      <h1 className="not-found-page__code">404</h1>
      <h2 className="not-found-page__title">Page Not Found</h2>
      <p className="not-found-page__message">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link to="/" className="not-found-page__link">
        ← Back to Home
      </Link>
    </div>
  );
}

export default NotFound;
