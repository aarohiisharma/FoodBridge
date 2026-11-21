process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

jest.mock('../config/database', () => ({
  pool: { end: jest.fn(), connect: jest.fn() }, query: jest.fn(),
}));

const request = require('supertest');
const app = require('../app');
const database = require('../config/database');
const donation = { id: 10, donor_id: 1, food_name: 'Vegetable pasta', status: 'AVAILABLE' };

describe('donation search and filters', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists available unexpired donations', async () => {
    database.query.mockResolvedValueOnce({ rows: [donation] });
    const response = await request(app).get('/api/donations');
    expect(response.status).toBe(200);
    expect(response.body.donations).toEqual([donation]);
  });

  it('searches and filters donations', async () => {
    database.query.mockResolvedValueOnce({ rows: [donation] });
    const response = await request(app).get('/api/donations').query({
      search: 'pasta', food_type: 'COOKED', quantity_min: 2, quantity_max: 10,
      quantity_unit: 'kg', location: 'Central',
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

  it('returns no expired food as available', async () => {
    database.query.mockResolvedValueOnce({ rows: [] });
    const response = await request(app).get('/api/donations');
    expect(response.status).toBe(200);
    expect(response.body.donations).toEqual([]);
  });
});
