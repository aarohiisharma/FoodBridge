process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const jwt = require('jsonwebtoken');

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
const express = require('express');
const app = require('../app');
const database = require('../config/database');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const publicUser = {
  id: 1,
  name: 'Test Donor',
  email: 'donor@example.com',
  role: 'DONOR',
  phone: null,
  address: null,
  created_at: '2026-01-01T00:00:00.000Z',
};

describe('authentication and authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a valid user', async () => {
    database.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ ...publicUser, password_hash: '$2b$10$hashed-password' }] });

    const response = await request(app).post('/api/auth/register').send({
      name: 'Test Donor',
      email: 'donor@example.com',
      password: 'password123',
      role: 'DONOR',
    });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({ email: 'donor@example.com', role: 'DONOR' });
    expect(response.body.token).toBeDefined();
    expect(response.body.user.password_hash).toBeUndefined();
  });

  it('rejects duplicate email registrations', async () => {
    database.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const response = await request(app).post('/api/auth/register').send({
      name: 'Test Donor',
      email: 'donor@example.com',
      password: 'password123',
      role: 'DONOR',
    });

    expect(response.status).toBe(409);
  });

  it('rejects missing required fields', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      role: 'UNKNOWN',
    });

    expect(response.status).toBe(422);
  });

  it('requires NGO organization and registration details', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'NGO Contact',
      email: 'ngo@example.com',
      password: 'password123',
      role: 'NGO',
    });

    expect(response.status).toBe(422);
  });

  it('logs in with valid credentials', async () => {
    database.query.mockResolvedValueOnce({
      rows: [{ ...publicUser, password_hash: '$2b$10$hashed-password' }],
    });
    bcrypt.compare.mockResolvedValueOnce(true);

    const response = await request(app).post('/api/auth/login').send({
      email: 'donor@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  it('rejects an incorrect password', async () => {
    database.query.mockResolvedValueOnce({
      rows: [{ ...publicUser, password_hash: '$2b$10$hashed-password' }],
    });
    bcrypt.compare.mockResolvedValueOnce(false);

    const response = await request(app).post('/api/auth/login').send({
      email: 'donor@example.com',
      password: 'wrong-password',
    });

    expect(response.status).toBe(401);
  });

  it('protects private endpoints when the token is missing', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
  });

  it('rejects an invalid token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
  });

  it('returns the logged-in user profile', async () => {
    database.query.mockResolvedValueOnce({ rows: [publicUser] });
    const token = jwt.sign(
      { id: publicUser.id, email: publicUser.email, role: publicUser.role },
      process.env.JWT_SECRET,
    );

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      id: publicUser.id,
      email: publicUser.email,
      role: 'DONOR',
    });
  });

  it('updates the logged-in user profile', async () => {
    database.query.mockResolvedValueOnce({
      rows: [{ ...publicUser, name: 'Updated Donor', phone: '1234567890' }],
    });
    const token = jwt.sign(
      { id: publicUser.id, email: publicUser.email, role: publicUser.role },
      process.env.JWT_SECRET,
    );

    const response = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Donor', phone: '1234567890' });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      name: 'Updated Donor',
      phone: '1234567890',
    });
  });

  it('rejects a role that is not authorized', async () => {
    const roleApp = express();
    roleApp.get('/admin', authenticate, authorize('ADMIN'), (request, response) => {
      response.status(200).json({ success: true });
    });
    roleApp.use((error, request, response, next) => {
      response.status(error.statusCode || 500).json({ message: error.message });
    });
    const token = jwt.sign({ id: 1, role: 'DONOR' }, process.env.JWT_SECRET);
    const response = await request(roleApp)
      .get('/admin')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  it('allows an ADMIN for an authorized route', async () => {
    const roleApp = express();
    roleApp.get('/admin', authenticate, authorize('ADMIN'), (request, response) => {
      response.status(200).json({ success: true });
    });
    const token = jwt.sign({ id: 1, role: 'ADMIN' }, process.env.JWT_SECRET);
    const response = await request(roleApp)
      .get('/admin')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
  });
});
