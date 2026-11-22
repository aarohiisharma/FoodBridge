import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { name: 'Aarohi', role: 'donor' } }),
}));

import api from '../../services/api';
import DonorDashboard from '../../pages/DonorDashboard';

const donation = {
  id: 10,
  food_name: 'Vegetable Pasta',
  food_type: 'COOKED',
  quantity: 12,
  quantity_unit: 'meals',
  preparation_time: '2026-11-21T10:00:00.000Z',
  expiry_time: '2026-11-22T18:00:00.000Z',
  pickup_location: '123 Green Street',
  description: 'Fresh vegetarian pasta',
  image_url: '',
  status: 'AVAILABLE',
};

describe('DonorDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { donations: [], pickups: [] } });
  });

  it('validates required and time-related donation fields', async () => {
    const user = userEvent.setup();
    render(<DonorDashboard />);

    await user.click(await screen.findByRole('button', { name: /post donation/i }));
    await user.click(screen.getByRole('button', { name: /create donation/i }));
    expect(await screen.findByText('Food name is required')).toBeInTheDocument();
    expect(screen.getByText('Pickup address is required')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/food name/i), 'Rice');
    await user.clear(screen.getByLabelText(/^quantity$/i));
    await user.type(screen.getByLabelText(/^quantity$/i), '-2');
    await user.type(screen.getByLabelText(/preparation date and time/i), '2026-11-22T12:00');
    await user.type(screen.getByLabelText(/safe consumption deadline/i), '2026-11-22T10:00');
    await user.type(screen.getByLabelText(/pickup address/i), '42 Main Road');
    await user.click(screen.getByRole('button', { name: /create donation/i }));

    expect(await screen.findByText('Quantity must be positive')).toBeInTheDocument();
    expect(screen.getByText('Expiry time must be later than preparation time')).toBeInTheDocument();
  });

  it('submits a valid new donation', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValue({ data: { donation: { ...donation, id: 11 } } });
    render(<DonorDashboard />);

    await user.click(await screen.findByRole('button', { name: /post donation/i }));
    await user.type(screen.getByLabelText(/food name/i), 'Vegetable Pasta');
    await user.selectOptions(screen.getByLabelText(/food category/i), 'COOKED');
    await user.type(screen.getByLabelText(/^quantity$/i), '12');
    await user.type(screen.getByLabelText(/quantity unit/i), 'meals');
    await user.type(screen.getByLabelText(/preparation date and time/i), '2026-11-21T10:00');
    await user.type(screen.getByLabelText(/safe consumption deadline/i), '2026-11-22T18:00');
    await user.type(screen.getByLabelText(/pickup address/i), '123 Green Street');
    await user.type(screen.getByLabelText(/description/i), 'Fresh vegetarian pasta');
    await user.click(screen.getByRole('button', { name: /create donation/i }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/donations', expect.objectContaining({
      food_name: 'Vegetable Pasta',
      food_type: 'COOKED',
      quantity: 12,
      pickup_location: '123 Green Street',
    })));
  });

  it('lists previously posted donations', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/donations/my') return Promise.resolve({ data: { donations: [donation] } });
      if (url === '/api/pickups/my') return Promise.resolve({ data: { pickups: [] } });
      return Promise.resolve({ data: {} });
    });
    render(<DonorDashboard />);

    expect(await screen.findByText('Vegetable Pasta')).toBeInTheDocument();
    expect(screen.getByText('12 meals')).toBeInTheDocument();
  });

  it('edits an existing donation', async () => {
    const user = userEvent.setup();
    api.get.mockImplementation((url) => {
      if (url === '/api/donations/my') return Promise.resolve({ data: { donations: [donation] } });
      if (url === '/api/pickups/my') return Promise.resolve({ data: { pickups: [] } });
      return Promise.resolve({ data: {} });
    });
    api.put.mockResolvedValue({ data: { donation: { ...donation, food_name: 'Rice Bowls' } } });
    render(<DonorDashboard />);

    await user.click(await screen.findByRole('button', { name: /edit vegetable pasta/i }));
    const foodName = screen.getByLabelText(/food name/i);
    await user.clear(foodName);
    await user.type(foodName, 'Rice Bowls');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(api.put).toHaveBeenCalledWith(
      '/api/donations/10',
      expect.objectContaining({ food_name: 'Rice Bowls' }),
    ));
  });

  it('approves and rejects pickup requests', async () => {
    const user = userEvent.setup();
    const pickup = { id: 4, donation_id: 10, ngo_id: 7, status: 'PENDING', notes: 'For our community kitchen' };
    const rejectedPickup = { id: 5, donation_id: 10, ngo_id: 8, status: 'PENDING', notes: 'Second pantry request' };
    api.get.mockImplementation((url) => {
      if (url === '/api/donations/my') return Promise.resolve({ data: { donations: [donation] } });
      if (url === '/api/pickups/my') return Promise.resolve({ data: { pickups: [pickup, rejectedPickup] } });
      return Promise.resolve({ data: {} });
    });
    api.patch.mockResolvedValue({ data: { pickup: { ...pickup, status: 'APPROVED' } } });
    render(<DonorDashboard />);

    const requestCard = await screen.findByText('For our community kitchen');
    const card = requestCard.closest('.pickup-request-card');
    await user.click(within(card).getByRole('button', { name: /approve/i }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith(
      '/api/pickups/4/status',
      { status: 'APPROVED' },
    ));

    const rejectedCard = (await screen.findByText('Second pantry request')).closest('.pickup-request-card');
    api.patch.mockResolvedValue({ data: { pickup: { ...rejectedPickup, status: 'REJECTED' } } });
    await user.click(within(rejectedCard).getByRole('button', { name: /reject/i }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith(
      '/api/pickups/5/status',
      { status: 'REJECTED' },
    ));
  });
});
