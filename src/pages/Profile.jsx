import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { updateProfile } from '../services/authService';
import InputField from '../components/InputField';
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';
import '../styles/pages.css';

function Profile() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
    });
  }, [user]);

  const handleChange = (event) => {
    const { id, value } = event.target;
    setFormData((current) => ({ ...current, [id.replace('profile-', '')]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError('Name, email, and phone number are required.');
      return;
    }

    try {
      setLoading(true);
      const data = await updateProfile(formData);
      updateUser(data.user || data);
      setSuccess('Your profile was updated successfully.');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to update your profile. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-page__card">
        <h1 className="dashboard-page__title">Your Profile</h1>
        <p className="dashboard-page__welcome">
          Review and update your FoodBridge account details.
        </p>
        <ErrorMessage message={error} />
        {success && (
          <p className="success-message" role="status">
            {success}
          </p>
        )}
        <form onSubmit={handleSubmit} className="auth-page__form">
          <InputField
            label="Full Name"
            id="profile-name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <InputField
            label="Email"
            id="profile-email"
            type="email"
            value={formData.email}
            disabled
            required
          />
          <InputField
            label="Phone Number"
            id="profile-phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <InputField
            label="Address"
            id="profile-address"
            value={formData.address}
            onChange={handleChange}
          />
          <Button type="submit" loading={loading}>
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
