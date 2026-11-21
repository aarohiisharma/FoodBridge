process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

jest.mock('../config/database', () => ({
  pool: { end: jest.fn(), connect: jest.fn() },
  query: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../app');
const database = require('../config/database');

const donation = {
  id: 10,
  donor_id: 1,
  food_name: 'Vegetable pasta',
  food_type: 'COOKED',
  quantity: 5,
  quantity_unit: 'kg',
  preparation_time: '2026-11-21T10:00:00.000Z',
  expiry_time: '2026-11-21T16:00:00.000Z',
  description: 'Fresh vegetarian meal',
  pickup_location: 'Central Community Center',
  image_url: null,
  status: 'AVAILABLE',
  created_at: '2026-11-21T10:30:00.000Z',
};

function token(role = 'DONOR', id = 1) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET);
}

describe('food donation management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a valid donation for an authenticated donor', async () => {
    database.query.mockResolvedValueOnce({ rows: [donation] });

    const response = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${token()}`)
      .send({
        food_name: 'Vegetable pasta',
        food_type: 'COOKED',
        quantity: 5,
        quantity_unit: 'kg',
        preparation_time: '2026-11-21T10:00:00.000Z',
        expiry_time: '2026-11-21T16:00:00.000Z',
        description: 'Fresh vegetarian meal',
        pickup_location: 'Central Community Center',
      });

    expect(response.status).toBe(201);
    expect(response.body.donation).toMatchObject({ id: 10, donor_id: 1, status: 'AVAILABLE' });
  });

  it('rejects invalid quantity and expiry inputs', async () => {
    const response = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${token()}`)
      .send({
        food_name: 'Invalid meal',
        food_type: 'COOKED',
        quantity: 0,
        quantity_unit: 'kg',
        preparation_time: '2026-11-21T16:00:00.000Z',
        expiry_time: '2026-11-21T15:00:00.000Z',
        pickup_location: 'Main hall',
      });

    expect(response.status).toBe(422);
  });

  it('rejects creation by a non-donor', async () => {
    const response = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${token('NGO')}`)
      .send({
        food_name: 'Vegetable pasta',
        food_type: 'COOKED',
        quantity: 5,
        quantity_unit: 'kg',
        preparation_time: '2026-11-21T10:00:00.000Z',
        expiry_time: '2026-11-21T16:00:00.000Z',
        pickup_location: 'Central Community Center',
      });

    expect(response.status).toBe(403);
  });

  it('protects donations from unauthenticated access', async () => {
    const response = await request(app)
      .post('/api/donations')
      .send({ food_name: 'Vegetable pasta' });

    expect(response.status).toBe(401);
  });

  it('lists available unexpired donations', async () => {
    database.query.mockResolvedValueOnce({ rows: [donation] });

    const response = await request(app).get('/api/donations');

    expect(response.status).toBe(200);
    expect(response.body.donations).toEqual([donation]);
  });

  it('searches and filters donations with validated query parameters', async () => {
    database.query.mockResolvedValueOnce({ rows: [donation] });

    const response = await request(app)
      .get('/api/donations')
      .query({
        search: 'pasta',
        food_type: 'COOKED',
        quantity_min: 2,
        quantity_max: 10,
        quantity_unit: 'kg',
        location: 'Central',
      });

    expect(response.status).toBe(200);
    expect(response.body.donations).toEqual([donation]);
  });

  it('gets a single available donation by ID', async () => {
    database.query.mockResolvedValueOnce({ rows: [donation] });

    const response = await request(app).get('/api/donations/10');

    expect(response.status).toBe(200);
    expect(response.body.donation.id).toBe(10);
  });

  it("gets the logged-in donor's own donations", async () => {
    database.query.mockResolvedValueOnce({ rows: [donation] });

    const response = await request(app)
      .get('/api/donations/my')
      .set('Authorization', `Bearer ${token()}`);

    expect(response.status).toBe(200);
    expect(response.body.donations).toEqual([donation]);
  });

  it('allows the owner to edit a donation', async () => {
    database.query
      .mockResolvedValueOnce({ rows: [donation] })
      .mockResolvedValueOnce({ rows: [{ ...donation, quantity: 8 }] });

    const response = await request(app)
      .put('/api/donations/10')
      .set('Authorization', `Bearer ${token()}`)
      .send({ quantity: 8 });

    expect(response.status).toBe(200);
    expect(response.body.donation.quantity).toBe(8);
  });

  it('prevents another donor from editing a donation', async () => {
    database.query.mockResolvedValueOnce({ rows: [donation] });

    const response = await request(app)
      .put('/api/donations/10')
      .set('Authorization', `Bearer ${token('DONOR', 2)}`)
      .send({ quantity: 8 });

    expect(response.status).toBe(403);
  });

  it('allows the owner to delete a donation', async () => {
    database.query
      .mockResolvedValueOnce({ rows: [donation] })
      .mockResolvedValueOnce({ rows: [donation] });

    const response = await request(app)
      .delete('/api/donations/10')
      .set('Authorization', `Bearer ${token()}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('prevents another donor from deleting a donation', async () => {
    database.query.mockResolvedValueOnce({ rows: [donation] });

    const response = await request(app)
      .delete('/api/donations/10')
      .set('Authorization', `Bearer ${token('DONOR', 2)}`);

    expect(response.status).toBe(403);
  });

  it('returns no expired food as available', async () => {
    database.query.mockResolvedValueOnce({ rows: [] });

    const response = await request(app).get('/api/donations');

    expect(response.status).toBe(200);
    expect(response.body.donations).toEqual([]);
  });
});
