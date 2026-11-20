import axios from 'axios';

/**
 * Centralized Axios instance.
 *
 * - Base URL is read from the VITE_API_URL environment variable.
 * - A request interceptor attaches the JWT token to every outgoing request.
 * - A response interceptor handles 401 (Unauthorized) globally by clearing
 *   stored credentials and redirecting to the login page.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor ─────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fb_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor ────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid — force logout
      localStorage.removeItem('fb_token');
      localStorage.removeItem('fb_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
