import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/components.css';

/**
 * Top navigation bar.
 *
 * Shows brand link on the left.
 * Right side:
 *   - Logged out → Login + Register links
 *   - Logged in  → Greeting, Dashboard link, Logout button
 */
function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <Link to="/" className="navbar__brand">
          🍽️ FoodBridge
        </Link>

        <div className="navbar__links">
          {isAuthenticated ? (
            <>
              <span className="navbar__greeting">
                Hi, {user?.name || 'User'}
              </span>
              <Link
                to={`/dashboard/${user?.role}`}
                className="navbar__link"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="navbar__logout-btn"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar__link">
                Login
              </Link>
              <Link to="/register" className="navbar__link navbar__link--cta">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
