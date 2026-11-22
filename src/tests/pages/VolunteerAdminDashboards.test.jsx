import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { name: 'Volunteer One', role: 'volunteer' } }),
}));

import api from '../../services/api';
import VolunteerDashboard from '../../pages/VolunteerDashboard';
import AdminDashboard from '../../pages/AdminDashboard';
import ProtectedRoute from '../../components/ProtectedRoute';
import { AuthContext } from '../../context/AuthContext';

describe('VolunteerDashboard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('accepts an available assignment', async () => {
    const user = userEvent.setup();
    api.get.mockImplementation((url) => {
      if (url === '/api/volunteers/tasks') {
        return Promise.resolve({
          data: {
            tasks: [{
              id: 20,
              donation_id: 10,
              ngo_id: 7,
              donor_id: 2,
              status: 'APPROVED',
              notes: 'Call recipient on arrival',
            }],
          },
        });
      }
      if (url === '/api/volunteers/tasks/assigned') return Promise.resolve({ data: { tasks: [] } });
      return Promise.resolve({ data: {} });
    });
    api.patch.mockResolvedValue({
      data: { task: { id: 20, donation_id: 10, ngo_id: 7, donor_id: 2, status: 'ASSIGNED' } },
    });
    render(<VolunteerDashboard />);

    await user.click(await screen.findByRole('button', { name: /accept assignment/i }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith(
      '/api/volunteers/tasks/20/accept',
    ));
  });

  it('changes an accepted assignment to collected and delivered', async () => {
    const user = userEvent.setup();
    const task = {
      id: 21,
      donation_id: 11,
      ngo_id: 8,
      donor_id: 3,
      status: 'ASSIGNED',
      notes: 'Use the side entrance',
    };
    api.get.mockImplementation((url) => {
      if (url === '/api/volunteers/tasks') return Promise.resolve({ data: { tasks: [] } });
      if (url === '/api/volunteers/tasks/assigned') return Promise.resolve({ data: { tasks: [task] } });
      return Promise.resolve({ data: {} });
    });
    api.patch
      .mockResolvedValueOnce({ data: { task: { ...task, status: 'ACCEPTED' } } })
      .mockResolvedValueOnce({ data: { task: { ...task, status: 'COLLECTED' } } })
      .mockResolvedValueOnce({ data: { task: { ...task, status: 'DELIVERED' } } });
    render(<VolunteerDashboard />);

    await user.click(await screen.findByRole('tab', { name: /my assignments/i }));
    await user.click(await screen.findByRole('button', { name: /accept task/i }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith(
      '/api/volunteers/tasks/21/status',
      { status: 'ACCEPTED' },
    ));

    await user.click(await screen.findByRole('button', { name: /mark collected/i }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith(
      '/api/volunteers/tasks/21/status',
      { status: 'COLLECTED' },
    ));

    await user.click(await screen.findByRole('button', { name: /mark delivered/i }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith(
      '/api/volunteers/tasks/21/status',
      { status: 'DELIVERED' },
    ));
  });
});

describe('AdminDashboard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders real dashboard statistics and verification requests', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/admin/stats') {
        return Promise.resolve({ data: { stats: { users: 10, donations: 6, pickups: 4 } } });
      }
      if (url === '/api/admin/users') {
        return Promise.resolve({
          data: {
            users: [
              { id: 1, role: 'DONOR' },
              { id: 2, role: 'NGO' },
              { id: 3, role: 'VOLUNTEER' },
            ],
          },
        });
      }
      if (url === '/api/admin/ngos') {
        return Promise.resolve({
          data: {
            ngos: [{
              id: 2,
              name: 'Helping Hands',
              organization_name: 'Helping Hands',
              verification_status: 'PENDING',
            }],
          },
        });
      }
      if (url === '/api/admin/donations') {
        return Promise.resolve({
          data: {
            donations: [
              { id: 10, status: 'AVAILABLE' },
              { id: 11, status: 'COMPLETED' },
            ],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
    api.patch = vi.fn().mockResolvedValue({
      data: { ngo: { id: 2, verification_status: 'VERIFIED' } },
    });
    render(<AdminDashboard />);

    expect(await screen.findByText('Total users')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    expect(screen.getByText('Helping Hands')).toBeInTheDocument();
  });

  it('approves and rejects NGO verification through role-protected API actions', async () => {
    const user = userEvent.setup();
    api.get.mockImplementation((url) => {
      if (url === '/api/admin/stats') return Promise.resolve({ data: { stats: { users: 2, donations: 1, pickups: 1 } } });
      if (url === '/api/admin/users') return Promise.resolve({ data: { users: [{ role: 'NGO' }] } });
      if (url === '/api/admin/ngos') {
        return Promise.resolve({
          data: { ngos: [
            { id: 5, name: 'Approved NGO', verification_status: 'PENDING' },
            { id: 6, name: 'Rejected NGO', verification_status: 'PENDING' },
          ] },
        });
      }
      if (url === '/api/admin/donations') return Promise.resolve({ data: { donations: [] } });
      return Promise.resolve({ data: {} });
    });
    api.patch.mockResolvedValue({ data: { ngo: { id: 5, verification_status: 'VERIFIED' } } });
    render(<AdminDashboard />);

    await user.click(await screen.findByRole('button', { name: /approve approved ngo/i }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith(
      '/api/admin/ngos/5/verification',
      { status: 'APPROVED' },
    ));

    api.patch.mockResolvedValue({ data: { ngo: { id: 6, verification_status: 'REJECTED' } } });
    await user.click(screen.getByRole('button', { name: /reject rejected ngo/i }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith(
      '/api/admin/ngos/6/verification',
      { status: 'REJECTED' },
    ));
  });

  it('redirects a non-admin away from the admin dashboard', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            user: { role: 'volunteer' },
            loading: false,
            isAuthenticated: true,
          }}
        >
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.queryByText(/admin dashboard/i)).not.toBeInTheDocument();
  });
});
