import { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext(null);

/**
 * AuthProvider wraps the app and manages authentication state.
 *
 * Provides: user, token, loading, isAuthenticated, login(), logout()
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore any saved session from localStorage
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('fb_token');
      const savedUser = localStorage.getItem('fb_user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      // If stored data is corrupted, clear it
      console.error('Failed to restore session:', error);
      localStorage.removeItem('fb_token');
      localStorage.removeItem('fb_user');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save user data and token after a successful login or registration.
   */
  const login = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('fb_token', authToken);
    localStorage.setItem('fb_user', JSON.stringify(userData));
  }, []);

  /**
   * Clear all auth state and remove stored credentials.
   */
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('fb_token');
    localStorage.removeItem('fb_user');
  }, []);

  const isAuthenticated = !!token && !!user;

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
