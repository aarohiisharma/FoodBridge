import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { registerUser } from '../services/authService';
import InputField from '../components/InputField';
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';
import '../styles/pages.css';

/** Role options shown in the registration dropdown. */
const ROLE_OPTIONS = [
  { value: 'donor', label: 'Donor (Restaurant, Store, Individual)' },
  { value: 'ngo', label: 'NGO / Charity' },
  { value: 'volunteer', label: 'Volunteer' },
];

/**
 * Registration page.
 *
 * Collects name, email, password, and role, then calls
 * authService.registerUser() to create an account.
 */
function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'donor',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  /** Generic change handler — strips the "register-" prefix from the id. */
  const handleChange = (e) => {
    const { id, value } = e.target;
    const field = id.replace('register-', '');
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRoleChange = (e) => {
    setFormData((prev) => ({ ...prev, role: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { name, email, password, confirmPassword, role } = formData;

    // Client-side validation
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      const data = await registerUser({ name, email, password, role });
      login(data.user, data.token);
      navigate(`/dashboard/${data.user.role}`);
    } catch (err) {
      const message =
        err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__card">
        <h1 className="auth-page__title">Join FoodBridge</h1>
        <p className="auth-page__subtitle">
          Create an account and start making a difference.
        </p>

        <ErrorMessage message={error} />

        <form onSubmit={handleSubmit} className="auth-page__form">
          <InputField
            label="Full Name"
            id="register-name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Jane Doe"
            required
          />
          <InputField
            label="Email"
            id="register-email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />
          <InputField
            label="Password"
            id="register-password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="At least 6 characters"
            required
          />
          <InputField
            label="Confirm Password"
            id="register-confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
            required
          />

          {/* Role selector — uses the same input-field styling */}
          <div className="input-field">
            <label htmlFor="register-role" className="input-field__label">
              I am a...
            </label>
            <select
              id="register-role"
              value={formData.role}
              onChange={handleRoleChange}
              className="input-field__input"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" variant="primary" loading={loading}>
            Create Account
          </Button>
        </form>

        <p className="auth-page__footer-text">
          Already have an account?{' '}
          <Link to="/login" className="auth-page__link">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
