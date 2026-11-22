import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { name: 'Helping Hands', role: 'ngo' } }),
}));

import api from '../../services/api';
import NgoDashboard from '../../pages/NgoDashboard';

const availableDonation = {
  id: 10,
  food_name: 'Vegetable Pasta',
  food_type: 'COOKED',
  quantity: 12,
  quantity_unit: 'meals',
  preparation_time: '2026-11-21T10:00:00.000Z',
  expiry_time: '2026-11-22T18:00:00.000Z',
  pickup_location: '123 Green Street',
  description: 'Collect from the kitchen entrance.',
  donor_name: 'Community Kitchen',
  status: 'AVAILABLE',
};

describe('NgoDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searches donations by food name', async () => {
    const user = userEvent.setup();
    api.get.mockImplementation((url) => {
      if (url === '/api/donations') {
        return Promise.resolve({
          data: {
            donations: [
              availableDonation,
              { ...availableDonation, id: 11, food_name: 'Fresh Bread', food_type: 'BAKERY' },
            ],
          },
        });
      }
      if (url === '/api/pickups/my') return Promise.resolve({ data: { pickups: [] } });
      return Promise.resolve({ data: {} });
    });
    render(<NgoDashboard />);

    await user.type(await screen.findByRole('searchbox', { name: /search by food name/i }), 'Bread');

    expect(screen.queryByText('Vegetable Pasta')).not.toBeInTheDocument();
    expect(screen.getByText('Fresh Bread')).toBeInTheDocument();
  });

  it('filters by category, quantity and expiry time', async () => {
    const user = userEvent.setup();
    api.get.mockImplementation((url) => {
      if (url === '/api/donations') {
        return Promise.resolve({
          data: {
            donations: [
              availableDonation,
              {
                ...availableDonation,
                id: 12,
                food_name: 'Rice Bags',
                food_type: 'RAW',
                quantity: 3,
                expiry_time: '2027-01-01T18:00:00.000Z',
              },
            ],
          },
        });
      }
      if (url === '/api/pickups/my') return Promise.resolve({ data: { pickups: [] } });
      return Promise.resolve({ data: {} });
    });
    render(<NgoDashboard />);

    await screen.findByText('Vegetable Pasta');
    await user.selectOptions(screen.getByLabelText(/food category/i), 'RAW');
    expect(screen.getByText('Rice Bags')).toBeInTheDocument();
    expect(screen.queryByText('Vegetable Pasta')).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText(/minimum quantity/i));
    await user.type(screen.getByLabelText(/minimum quantity/i), '5');
    expect(screen.getByText(/no donations match/i)).toBeInTheDocument();
  });

  it('opens donation details and can request a pickup', async () => {
    const user = userEvent.setup();
    api.get.mockImplementation((url) => {
      if (url === '/api/donations') return Promise.resolve({ data: { donations: [availableDonation] } });
      if (url === '/api/donations/10') return Promise.resolve({ data: { donation: availableDonation } });
      if (url === '/api/pickups/my') return Promise.resolve({ data: { pickups: [] } });
      return Promise.resolve({ data: {} });
    });
    api.post.mockResolvedValue({
      data: { pickup: { id: 3, donation_id: 10, status: 'PENDING', notes: 'Please call on arrival' } },
    });
    render(<NgoDashboard />);

    await user.click(await screen.findByRole('button', { name: /view details for vegetable pasta/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).getByText(/collect from the kitchen entrance/i)).toBeInTheDocument();

    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /request pickup/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/pickups', {
      donation_id: 10,
      notes: '',
    }));
  });

  it('cancels a pending pickup and displays accepted and completed requests', async () => {
    const user = userEvent.setup();
    api.get.mockImplementation((url) => {
      if (url === '/api/donations') return Promise.resolve({ data: { donations: [availableDonation] } });
      if (url === '/api/pickups/my') {
        return Promise.resolve({
          data: {
            pickups: [
              { id: 2, donation_id: 10, status: 'PENDING', notes: 'Pending request' },
              { id: 3, donation_id: 11, status: 'APPROVED', notes: 'Accepted request' },
              { id: 4, donation_id: 12, status: 'COMPLETED', notes: 'Completed request' },
            ],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
    api.delete.mockResolvedValue({ data: { success: true } });
    render(<NgoDashboard />);

    await user.click(await screen.findByRole('tab', { name: /my pickups/i }));
    const pendingCard = (await screen.findByText('Pending request')).closest('.pickup-request-card');
    await user.click(within(pendingCard).getByRole('button', { name: /cancel/i }));
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/api/pickups/2'));

    expect(screen.getByText('Accepted request')).toBeInTheDocument();
    expect(screen.getByText('Completed request')).toBeInTheDocument();
  });

  it('does not allow expired or unavailable donations to be requested', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/donations') {
        return Promise.resolve({
          data: {
            donations: [
              { ...availableDonation, id: 20, expiry_time: '2020-01-01T00:00:00.000Z' },
              { ...availableDonation, id: 21, food_name: 'Claimed Soup', status: 'CLAIMED' },
            ],
          },
        });
      }
      if (url === '/api/pickups/my') return Promise.resolve({ data: { pickups: [] } });
      return Promise.resolve({ data: {} });
    });
    render(<NgoDashboard />);

    expect(await screen.findByText(/no donations match/i)).toBeInTheDocument();
  });
});
