process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

jest.mock('../config/database', () => ({
  pool: { end: jest.fn(), connect: jest.fn() },
  query: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const request = require('supertest');
const express = require('express');
const app = require('../app');
const database = require('../config/database');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const publicUser = {
  id: 1, name: 'Test Donor', email: 'donor@example.com', role: 'DONOR',
  phone: null, address: null, created_at: '2026-01-01T00:00:00.000Z',
};

describe('authenticated profile and roles', () => {
  beforeEach(() => jest.clearAllMocks());

  it('protects private endpoints when the token is missing', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
  });

  it('rejects an invalid token', async () => {
    const response = await request(app).get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');
    expect(response.status).toBe(401);
  });

  it('returns the logged-in user profile', async () => {
    database.query.mockResolvedValueOnce({ rows: [publicUser] });
    const token = jwt.sign({ id: 1, role: 'DONOR' }, process.env.JWT_SECRET);
    const response = await request(app).get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ id: 1, email: 'donor@example.com', role: 'DONOR' });
  });

  it('updates the logged-in user profile', async () => {
    database.query.mockResolvedValueOnce({ rows: [{ ...publicUser, name: 'Updated Donor', phone: '1234567890' }] });
    const token = jwt.sign({ id: 1, role: 'DONOR' }, process.env.JWT_SECRET);
    const response = await request(app).put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Donor', phone: '1234567890' });
    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ name: 'Updated Donor', phone: '1234567890' });
  });

  it('rejects a role that is not authorized', async () => {
    const roleApp = express();
    roleApp.get('/admin', authenticate, authorize('ADMIN'), (request, response) => response.status(200).json({ success: true }));
    roleApp.use((error, request, response) => response.status(error.statusCode || 500).json({ message: error.message }));
    const token = jwt.sign({ id: 1, role: 'DONOR' }, process.env.JWT_SECRET);
    expect((await request(roleApp).get('/admin').set('Authorization', `Bearer ${token}`)).status).toBe(403);
  });

  it('allows an ADMIN for an authorized route', async () => {
    const roleApp = express();
    roleApp.get('/admin', authenticate, authorize('ADMIN'), (request, response) => response.status(200).json({ success: true }));
    const token = jwt.sign({ id: 1, role: 'ADMIN' }, process.env.JWT_SECRET);
    expect((await request(roleApp).get('/admin').set('Authorization', `Bearer ${token}`)).status).toBe(200);
  });
});
