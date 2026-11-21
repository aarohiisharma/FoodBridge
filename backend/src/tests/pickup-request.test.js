process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const mockQuery = jest.fn();
jest.mock('../config/database', () => ({
  pool: { end: jest.fn(), connect: jest.fn() },
  query: (...args) => mockQuery(...args),
}));

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../app');
const pickup = { id: 20, donation_id: 10, ngo_id: 2, donor_id: 1, volunteer_id: null, status: 'PENDING' };
const availableDonation = { id: 10, donor_id: 1, status: 'AVAILABLE', expiry_time: '2026-12-21T16:00:00.000Z' };
const token = (role, id) => jwt.sign({ id, role }, process.env.JWT_SECRET);

describe('pickup request creation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('allows an NGO to request an available, unexpired donation', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 2, role: 'NGO', verification_status: 'VERIFIED' }] })
      .mockResolvedValueOnce({ rows: [availableDonation] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [pickup] });
    const response = await request(app).post('/api/pickups')
      .set('Authorization', `Bearer ${token('NGO', 2)}`)
      .send({ donation_id: 10, notes: 'Please prepare pickup' });
    expect(response.status).toBe(201);
    expect(response.body.pickup).toMatchObject({ status: 'PENDING', ngo_id: 2 });
  });

  it('rejects duplicate pending pickup requests', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 2, role: 'NGO', verification_status: 'VERIFIED' }] })
      .mockResolvedValueOnce({ rows: [availableDonation] })
      .mockResolvedValueOnce({ rows: [pickup] });
    const response = await request(app).post('/api/pickups')
      .set('Authorization', `Bearer ${token('NGO', 2)}`).send({ donation_id: 10 });
    expect(response.status).toBe(409);
  });

  it('rejects unavailable or expired donations', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 2, role: 'NGO', verification_status: 'VERIFIED' }] })
      .mockResolvedValueOnce({ rows: [] });
    const response = await request(app).post('/api/pickups')
      .set('Authorization', `Bearer ${token('NGO', 2)}`).send({ donation_id: 10 });
    expect(response.status).toBe(404);
  });

  it('rejects pickup requests from an unverified NGO', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 2, role: 'NGO', verification_status: 'PENDING' }] });
    const response = await request(app).post('/api/pickups')
      .set('Authorization', `Bearer ${token('NGO', 2)}`).send({ donation_id: 10 });
    expect(response.status).toBe(403);
  });
});
