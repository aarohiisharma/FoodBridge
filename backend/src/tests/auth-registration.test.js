process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashed-password'),
  compare: jest.fn(),
}));
jest.mock('../config/database', () => ({
  pool: { end: jest.fn(), connect: jest.fn() },
  query: jest.fn(),
}));

const bcrypt = require('bcrypt');
const request = require('supertest');
const app = require('../app');
const database = require('../config/database');

describe('user registration', () => {
  beforeEach(() => jest.clearAllMocks());

  it('registers a valid user', async () => {
    database.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test Donor', email: 'donor@example.com', role: 'DONOR', phone: null, address: null, created_at: '2026-01-01T00:00:00.000Z' }] });
    const response = await request(app).post('/api/auth/register').send({
      name: 'Test Donor', email: 'donor@example.com', password: 'password123', role: 'DONOR',
    });
    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({ email: 'donor@example.com', role: 'DONOR' });
    expect(response.body.token).toBeDefined();
    expect(response.body.user.password_hash).toBeUndefined();
  });

  it('rejects duplicate email registrations', async () => {
    database.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const response = await request(app).post('/api/auth/register').send({
      name: 'Test Donor', email: 'donor@example.com', password: 'password123', role: 'DONOR',
    });
    expect(response.status).toBe(409);
  });

  it('rejects missing required fields', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'not-an-email', role: 'UNKNOWN',
    });
    expect(response.status).toBe(422);
  });

  it('rejects public ADMIN registration', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Unauthorized Admin', email: 'admin@example.com', password: 'password123', role: 'ADMIN',
    });
    expect(response.status).toBe(422);
  });

  it('requires NGO organization and registration details', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'NGO Contact', email: 'ngo@example.com', password: 'password123', role: 'NGO',
    });
    expect(response.status).toBe(422);
  });
});
