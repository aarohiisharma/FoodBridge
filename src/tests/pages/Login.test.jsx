import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { AuthProvider } from '../../context/AuthContext';
import Login from '../../pages/Login';

/**
 * Helper that wraps a component with BrowserRouter + AuthProvider,
 * which Login requires for routing and auth context.
 */
function renderWithProviders(ui) {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>,
  );
}

describe('Login page', () => {
  it('renders the page heading', () => {
    renderWithProviders(<Login />);
    expect(
      screen.getByRole('heading', { name: /welcome back/i }),
    ).toBeInTheDocument();
  });

  it('renders email and password fields', () => {
    renderWithProviders(<Login />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
  });

  it('renders a Log In button', () => {
    renderWithProviders(<Login />);
    expect(
      screen.getByRole('button', { name: /log in/i }),
    ).toBeInTheDocument();
  });

  it('shows a link to the register page', () => {
    renderWithProviders(<Login />);
    const link = screen.getByRole('link', { name: /register here/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/register');
  });
});
