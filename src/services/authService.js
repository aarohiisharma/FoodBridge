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

/**
 * Register a new user.
 *
 * Expected backend response shape:
 *   { user: { id, name, email, role }, token: "jwt-string" }
 */
export async function registerUser({ name, email, password, role }) {
  const response = await api.post('/auth/register', {
    name,
    email,
    password,
    role,
  });
  return response.data;
}

/**
 * Log out the current user (server-side session invalidation).
 */
export async function logoutUser() {
  const response = await api.post('/auth/logout');
  return response.data;
}
