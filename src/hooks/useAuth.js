import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom hook to access authentication state and actions.
 *
 * Must be used inside an <AuthProvider>.
 *
 * Returns: { user, token, loading, isAuthenticated, login, logout }
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
