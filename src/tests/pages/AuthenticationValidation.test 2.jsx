import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../../context/AuthContext';
import Login from '../../pages/Login';
import Register from '../../pages/Register';

vi.mock('../../services/authService', () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
}));

function renderWithAuth(ui) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          login: vi.fn(),
          logout: vi.fn(),
          user: null,
          loading: false,
          isAuthenticated: false,
        }}
      >
        {ui}
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('login validation', () => {
  it('rejects an invalid email and short password', async () => {
    const user = userEvent.setup();
    renderWithAuth(<Login />);

    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.type(screen.getByLabelText(/^password/i), 'short');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      /enter a valid email address/i,
    );
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute(
      'type',
      'password',
    );
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderWithAuth(<Login />);

    const password = screen.getByLabelText(/^password/i);
    await user.click(screen.getByRole('button', { name: /show password/i }));

    expect(password).toHaveAttribute('type', 'text');
  });
});

describe('registration validation', () => {
  it('requires phone number and matching password confirmation', async () => {
    const user = userEvent.setup();
    renderWithAuth(<Register />);

    await user.type(screen.getByLabelText(/full name/i), 'Aarohi Sharma');
    await user.type(screen.getByLabelText(/email/i), 'aarohi@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'Password1');
    await user.type(
      screen.getByLabelText(/confirm password/i),
      'DifferentPassword1',
    );
    await user.click(
      screen.getByRole('button', { name: /create account/i }),
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      /passwords do not match/i,
    );
  });

  it('shows NGO fields when the NGO role is selected', async () => {
    const user = userEvent.setup();
    renderWithAuth(<Register />);

    await user.selectOptions(screen.getByLabelText(/role/i), 'ngo');

    expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/registration details/i)).toBeInTheDocument();
  });
});
