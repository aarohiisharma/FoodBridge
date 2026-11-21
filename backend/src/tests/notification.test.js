process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

jest.mock('../config/database', () => ({
  pool: { end: jest.fn(), connect: jest.fn() }, query: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../app');
const database = require('../config/database');
const token = (role, id) => jwt.sign({ id, role }, process.env.JWT_SECRET);

describe('notifications', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists and marks notifications for the logged-in user', async () => {
    database.query.mockResolvedValueOnce({ rows: [{ id: 30, user_id: 2, is_read: false }] })
      .mockResolvedValueOnce({ rows: [{ id: 30, user_id: 2, is_read: true }] });
    const listResponse = await request(app).get('/api/notifications')
      .set('Authorization', `Bearer ${token('NGO', 2)}`);
    expect(listResponse.status).toBe(200);
    const readResponse = await request(app).patch('/api/notifications/30/read')
      .set('Authorization', `Bearer ${token('NGO', 2)}`);
    expect(readResponse.status).toBe(200);
    expect(readResponse.body.notification.is_read).toBe(true);
  });
});
