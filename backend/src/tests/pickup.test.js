process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const mockQuery = jest.fn();
const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};
const mockPool = {
  end: jest.fn(),
  connect: jest.fn().mockResolvedValue(mockClient),
};

jest.mock('../config/database', () => ({
  pool: mockPool,
  query: (...args) => mockQuery(...args),
}));

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../app');

const pickup = {
  id: 20,
  donation_id: 10,
  ngo_id: 2,
  donor_id: 1,
  volunteer_id: null,
  status: 'PENDING',
  notes: 'Please prepare pickup',
  created_at: '2026-11-21T11:00:00.000Z',
  updated_at: '2026-11-21T11:00:00.000Z',
};

const availableDonation = {
  id: 10,
  donor_id: 1,
  status: 'AVAILABLE',
  expiry_time: '2026-12-21T16:00:00.000Z',
};

function token(role, id) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET);
}

describe('pickup request management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows an NGO to request an available, unexpired donation', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 2, role: 'NGO', verification_status: 'VERIFIED' }] })
      .mockResolvedValueOnce({ rows: [availableDonation] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [pickup] });

    const response = await request(app)
      .post('/api/pickups')
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

    const response = await request(app)
      .post('/api/pickups')
      .set('Authorization', `Bearer ${token('NGO', 2)}`)
      .send({ donation_id: 10 });

    expect(response.status).toBe(409);
  });

  it('rejects unavailable or expired donations', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 2, role: 'NGO', verification_status: 'VERIFIED' }] })
      .mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .post('/api/pickups')
      .set('Authorization', `Bearer ${token('NGO', 2)}`)
      .send({ donation_id: 10 });

    expect(response.status).toBe(404);
  });

  it('rejects pickup requests from an unverified NGO', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 2, role: 'NGO', verification_status: 'PENDING' }],
    });

    const response = await request(app)
      .post('/api/pickups')
      .set('Authorization', `Bearer ${token('NGO', 2)}`)
      .send({ donation_id: 10 });

    expect(response.status).toBe(403);
  });

  it('allows the donor to approve a pending request and reserves the donation', async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ ...pickup, status: 'PENDING' }] })
      .mockResolvedValueOnce({ rows: [availableDonation] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ ...pickup, status: 'APPROVED' }] })
      .mockResolvedValueOnce({}); // UPDATE donation status

    mockClient.query.mockResolvedValueOnce({}); // COMMIT

    const response = await request(app)
      .patch('/api/pickups/20/status')
      .set('Authorization', `Bearer ${token('DONOR', 1)}`)
      .send({ status: 'APPROVED' });

    expect(response.status).toBe(200);
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
  });

  it('allows the donor to reject a pending request', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [pickup] })
      .mockResolvedValueOnce({ rows: [{ ...pickup, status: 'REJECTED' }] });

    const response = await request(app)
      .patch('/api/pickups/20/status')
      .set('Authorization', `Bearer ${token('DONOR', 1)}`)
      .send({ status: 'REJECTED' });

    expect(response.status).toBe(200);
    expect(response.body.pickup.status).toBe('REJECTED');
  });

  it('allows the NGO to cancel a pending request', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [pickup] })
      .mockResolvedValueOnce({ rows: [{ ...pickup, status: 'CANCELLED' }] });

    const response = await request(app)
      .delete('/api/pickups/20')
      .set('Authorization', `Bearer ${token('NGO', 2)}`);

    expect(response.status).toBe(200);
    expect(response.body.pickup.status).toBe('CANCELLED');
  });

  it('allows the donor to assign an approved pickup to a volunteer', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ ...pickup, status: 'APPROVED' }] })
      .mockResolvedValueOnce({ rows: [{ id: 3, role: 'VOLUNTEER' }] })
      .mockResolvedValueOnce({ rows: [{ ...pickup, status: 'ASSIGNED', volunteer_id: 3 }] });

    const response = await request(app)
      .patch('/api/pickups/20/status')
      .set('Authorization', `Bearer ${token('DONOR', 1)}`)
      .send({ status: 'ASSIGNED', volunteer_id: 3 });

    expect(response.status).toBe(200);
    expect(response.body.pickup.volunteer_id).toBe(3);
  });

  it('allows only the assigned volunteer to accept the task', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ ...pickup, status: 'ASSIGNED', volunteer_id: 3 }] })
      .mockResolvedValueOnce({ rows: [{ ...pickup, status: 'ACCEPTED', volunteer_id: 3 }] });

    const response = await request(app)
      .patch('/api/pickups/20/status')
      .set('Authorization', `Bearer ${token('VOLUNTEER', 3)}`)
      .send({ status: 'ACCEPTED' });

    expect(response.status).toBe(200);
    expect(response.body.pickup.status).toBe('ACCEPTED');
  });

  it('rejects approval when another pickup request already reserved the donation', async () => {
    mockClient.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ ...pickup, status: 'PENDING' }] })
      .mockResolvedValueOnce({ rows: [availableDonation] })
      .mockResolvedValueOnce({ rows: [{ id: 21 }] });

    const response = await request(app)
      .patch('/api/pickups/20/status')
      .set('Authorization', `Bearer ${token('DONOR', 1)}`)
      .send({ status: 'APPROVED' });

    expect(response.status).toBe(409);
  });

  it('rejects invalid status transitions', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [pickup] });

    const response = await request(app)
      .patch('/api/pickups/20/status')
      .set('Authorization', `Bearer ${token('NGO', 2)}`)
      .send({ status: 'COMPLETED' });

    expect(response.status).toBe(422);
  });
});
