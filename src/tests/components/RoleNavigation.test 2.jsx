import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthContext } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import DashboardLayout from '../../layouts/DashboardLayout';

function renderWithUser(user) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          user,
          loading: false,
          isAuthenticated: true,
          logout: () => {},
        }}
      >
        <Navbar />
        <DashboardLayout />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('role-based navigation', () => {
  it.each([
    ['donor', /my donations/i],
    ['ngo', /available food/i],
    ['volunteer', /deliveries/i],
    ['admin', /overview/i],
  ])('shows the %s navigation for the matching role', (role, label) => {
    renderWithUser({ name: 'Test User', role });

    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute(
      'href',
      `/dashboard/${role}`,
    );
  });
});
