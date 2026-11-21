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

describe('admin features', () => {
  beforeEach(() => jest.clearAllMocks());

  it('restricts admin statistics to administrators', async () => {
    const response = await request(app).get('/api/admin/stats')
      .set('Authorization', `Bearer ${token('VOLUNTEER', 3)}`);
    expect(response.status).toBe(403);
  });

  it('returns platform statistics to an administrator', async () => {
    database.query.mockResolvedValueOnce({ rows: [{ users: '12' }] })
      .mockResolvedValueOnce({ rows: [{ donations: '8' }] })
      .mockResolvedValueOnce({ rows: [{ pickups: '5' }] });
    const response = await request(app).get('/api/admin/stats')
      .set('Authorization', `Bearer ${token('ADMIN', 1)}`);
    expect(response.status).toBe(200);
    expect(response.body.stats).toEqual({ users: 12, donations: 8, pickups: 5 });
  });

  it('approves NGO verification for an administrator', async () => {
    database.query.mockResolvedValueOnce({ rows: [{ id: 2, role: 'NGO', verification_status: 'VERIFIED' }] });
    const response = await request(app).patch('/api/admin/ngos/2/verification')
      .set('Authorization', `Bearer ${token('ADMIN', 1)}`).send({ status: 'APPROVED' });
    expect(response.status).toBe(200);
    expect(response.body.ngo.verification_status).toBe('VERIFIED');
  });
});
