import api from './api';

/**
 * Log in with email and password.
 *
 * Expected backend response shape:
 *   { user: { id, name, email, role }, token: "jwt-string" }
 */
export async function loginUser(email, password) {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get('/auth/me');
  return response.data;
}

/**
 * Register a new user.
 *
 * Expected backend response shape:
 *   { user: { id, name, email, role }, token: "jwt-string" }
 */
export async function registerUser({
  name,
  email,
  password,
  phone,
  role,
  organizationName,
  registrationDetails,
}) {
  const response = await api.post('/auth/register', {
    name,
    email,
    password,
    phone,
    role: role.toUpperCase(),
    ...(role === 'ngo' && {
      organizationName,
      registrationDetails,
    }),
  });
  return response.data;
}

export async function updateProfile(profile) {
  const response = await api.put('/users/profile', profile);
  return response.data;
}
