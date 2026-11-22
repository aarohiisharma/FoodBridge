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

const user = {
  id: 1, name: 'Test Donor', email: 'donor@example.com', role: 'DONOR',
  password_hash: '$2b$10$hashed-password', phone: null, address: null,
};

describe('user login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('logs in with valid credentials', async () => {
    database.query.mockResolvedValueOnce({ rows: [user] });
    bcrypt.compare.mockResolvedValueOnce(true);
    const response = await request(app).post('/api/auth/login').send({
      email: 'donor@example.com', password: 'password123',
    });
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  it('rejects an incorrect password', async () => {
    database.query.mockResolvedValueOnce({ rows: [user] });
    bcrypt.compare.mockResolvedValueOnce(false);
    const response = await request(app).post('/api/auth/login').send({
      email: 'donor@example.com', password: 'wrong-password',
    });
    expect(response.status).toBe(401);
  });
});
