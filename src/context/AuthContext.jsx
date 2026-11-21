import { createContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser } from '../services/authService';

export const AuthContext = createContext(null);
export const TOKEN_KEY = 'fb_token';
export const USER_KEY = 'fb_user';

function normalizeUser(user) {
  return user
    ? { ...user, role: user.role?.toLowerCase() }
    : null;
}

/**
 * AuthProvider wraps the app and manages authentication state.
 *
 * Provides: user, token, loading, isAuthenticated, login(), logout()
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);

      if (!savedToken) {
        if (active) setLoading(false);
        return;
      }

      try {
        const data = await getCurrentUser();
        const currentUser = normalizeUser(data.user || data);
        if (active) {
          setToken(savedToken);
          setUser(currentUser);
          localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  /**
   * Save user data and token after a successful login or registration.
   */
  const login = useCallback((userData, authToken) => {
    const currentUser = normalizeUser(userData);
    setUser(currentUser);
    setToken(authToken);
    localStorage.setItem(TOKEN_KEY, authToken);
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
  }, []);

  /**
   * Update the cached user profile without storing sensitive credentials.
   */
  const updateUser = useCallback((userData) => {
    const currentUser = normalizeUser(userData);
    setUser(currentUser);
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const isAuthenticated = !!token && !!user;

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    updateUser,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
