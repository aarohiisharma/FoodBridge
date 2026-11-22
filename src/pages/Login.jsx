import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { loginUser } from '../services/authService';
import InputField from '../components/InputField';
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';
import '../styles/pages.css';

/**
 * Login page.
 *
 * Calls the backend via authService.loginUser() and stores
 * the returned user + token in AuthContext.
 */
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    try {
      setLoading(true);
      const data = await loginUser(email, password);
      login(data.user, data.token);
      navigate(`/dashboard/${data.user.role.toLowerCase()}`);
    } catch (err) {
      const message =
        err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__card">
        <h1 className="auth-page__title">Welcome Back</h1>
        <p className="auth-page__subtitle">
          Log in to continue reducing food waste.
        </p>

        <ErrorMessage message={error} />

        <form onSubmit={handleSubmit} className="auth-page__form" noValidate>
          <InputField
            label="Email"
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <InputField
            label="Password"
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            showPasswordToggle
          />
          <Button type="submit" variant="primary" loading={loading}>
            Log In
          </Button>
        </form>

        <p className="auth-page__footer-text">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="auth-page__link">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
