process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const mockQuery = jest.fn();
const mockClient = { query: jest.fn(), release: jest.fn() };
jest.mock('../config/database', () => ({
  pool: { end: jest.fn(), connect: jest.fn().mockResolvedValue(mockClient) },
  query: (...args) => mockQuery(...args),
}));

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../app');
const pickup = { id: 20, donation_id: 10, ngo_id: 2, donor_id: 1, volunteer_id: null, status: 'PENDING' };
const availableDonation = { id: 10, donor_id: 1, status: 'AVAILABLE', expiry_time: '2026-12-21T16:00:00.000Z' };
const token = (role, id) => jwt.sign({ id, role }, process.env.JWT_SECRET);

describe('pickup approval and status transitions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('allows donor approval and reserves the donation', async () => {
    mockClient.query
      .mockResolvedValueOnce({}).mockResolvedValueOnce({ rows: [pickup] })
      .mockResolvedValueOnce({ rows: [availableDonation] }).mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ ...pickup, status: 'APPROVED' }] }).mockResolvedValueOnce({});
    mockClient.query.mockResolvedValueOnce({});
    const response = await request(app).patch('/api/pickups/20/status')
      .set('Authorization', `Bearer ${token('DONOR', 1)}`).send({ status: 'APPROVED' });
    expect(response.status).toBe(200);
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
  });

  it('allows the donor to reject a pending request', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [pickup] })
      .mockResolvedValueOnce({ rows: [{ ...pickup, status: 'REJECTED' }] });
    const response = await request(app).patch('/api/pickups/20/status')
      .set('Authorization', `Bearer ${token('DONOR', 1)}`).send({ status: 'REJECTED' });
    expect(response.status).toBe(200);
    expect(response.body.pickup.status).toBe('REJECTED');
  });

  it('allows the NGO to cancel a pending request', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [pickup] })
      .mockResolvedValueOnce({ rows: [{ ...pickup, status: 'CANCELLED' }] });
    const response = await request(app).delete('/api/pickups/20')
      .set('Authorization', `Bearer ${token('NGO', 2)}`);
    expect(response.status).toBe(200);
    expect(response.body.pickup.status).toBe('CANCELLED');
  });

  it('allows the donor to assign an approved pickup', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ ...pickup, status: 'APPROVED' }] })
      .mockResolvedValueOnce({ rows: [{ id: 3, role: 'VOLUNTEER' }] })
      .mockResolvedValueOnce({ rows: [{ ...pickup, status: 'ASSIGNED', volunteer_id: 3 }] });
    const response = await request(app).patch('/api/pickups/20/status')
      .set('Authorization', `Bearer ${token('DONOR', 1)}`).send({ status: 'ASSIGNED', volunteer_id: 3 });
    expect(response.status).toBe(200);
    expect(response.body.pickup.volunteer_id).toBe(3);
  });

  it('rejects assignment to a non-volunteer user', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ ...pickup, status: 'APPROVED' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, role: 'DONOR' }] });
    const response = await request(app).patch('/api/pickups/20/status')
      .set('Authorization', `Bearer ${token('DONOR', 1)}`).send({ status: 'ASSIGNED', volunteer_id: 1 });
    expect(response.status).toBe(422);
  });

  it('allows only the assigned volunteer to accept', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ ...pickup, status: 'ASSIGNED', volunteer_id: 3 }] })
      .mockResolvedValueOnce({ rows: [{ ...pickup, status: 'ACCEPTED', volunteer_id: 3 }] });
    const response = await request(app).patch('/api/pickups/20/status')
      .set('Authorization', `Bearer ${token('VOLUNTEER', 3)}`).send({ status: 'ACCEPTED' });
    expect(response.status).toBe(200);
  });

  it('rejects approval when another request reserved the donation', async () => {
    mockClient.query.mockResolvedValueOnce({}).mockResolvedValueOnce({ rows: [pickup] })
      .mockResolvedValueOnce({ rows: [availableDonation] }).mockResolvedValueOnce({ rows: [{ id: 21 }] });
    const response = await request(app).patch('/api/pickups/20/status')
      .set('Authorization', `Bearer ${token('DONOR', 1)}`).send({ status: 'APPROVED' });
    expect(response.status).toBe(409);
  });

  it('rejects invalid status transitions', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [pickup] });
    const response = await request(app).patch('/api/pickups/20/status')
      .set('Authorization', `Bearer ${token('NGO', 2)}`).send({ status: 'COMPLETED' });
    expect(response.status).toBe(422);
  });
});
