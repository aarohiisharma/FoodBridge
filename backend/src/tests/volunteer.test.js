process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const mockVolunteerClient = { query: jest.fn(), release: jest.fn() };
jest.mock('../config/database', () => ({
  pool: { end: jest.fn(), connect: jest.fn().mockResolvedValue(mockVolunteerClient) },
  query: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../app');
const database = require('../config/database');
const token = (role, id) => jwt.sign({ id, role }, process.env.JWT_SECRET);

describe('volunteer assignments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVolunteerClient.query.mockReset();
  });

  it('shows available volunteer assignments', async () => {
    database.query.mockResolvedValueOnce({ rows: [{ id: 20, status: 'APPROVED', volunteer_id: null }] });
    const response = await request(app).get('/api/volunteers/tasks')
      .set('Authorization', `Bearer ${token('VOLUNTEER', 3)}`);
    expect(response.status).toBe(200);
    expect(response.body.tasks).toHaveLength(1);
  });

  it('allows an available task volunteer to accept', async () => {
    mockVolunteerClient.query.mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ id: 20, donation_id: 10, status: 'APPROVED', volunteer_id: null }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 20, status: 'ASSIGNED', volunteer_id: 3 }] })
      .mockResolvedValueOnce({});
    const response = await request(app).patch('/api/volunteers/tasks/20/accept')
      .set('Authorization', `Bearer ${token('VOLUNTEER', 3)}`);
    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe('ASSIGNED');
  });

  it('rejects a duplicate volunteer assignment', async () => {
    mockVolunteerClient.query.mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ id: 20, donation_id: 10, status: 'APPROVED', volunteer_id: null }] })
      .mockResolvedValueOnce({ rows: [{ id: 21 }] });
    const response = await request(app).patch('/api/volunteers/tasks/20/accept')
      .set('Authorization', `Bearer ${token('VOLUNTEER', 3)}`);
    expect(response.status).toBe(409);
  });

  it('marks accepted pickup as collected', async () => {
    database.query.mockResolvedValueOnce({ rows: [{ id: 20, status: 'ACCEPTED', volunteer_id: 3 }] })
      .mockResolvedValueOnce({ rows: [{ id: 20, status: 'COLLECTED', volunteer_id: 3 }] });
    const response = await request(app).patch('/api/volunteers/tasks/20/status')
      .set('Authorization', `Bearer ${token('VOLUNTEER', 3)}`).send({ status: 'COLLECTED' });
    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe('COLLECTED');
  });

  it('marks collected food as delivered', async () => {
    database.query.mockResolvedValueOnce({ rows: [{ id: 20, status: 'COLLECTED', volunteer_id: 3 }] })
      .mockResolvedValueOnce({ rows: [{ id: 20, status: 'DELIVERED', volunteer_id: 3 }] });
    const response = await request(app).patch('/api/volunteers/tasks/20/status')
      .set('Authorization', `Bearer ${token('VOLUNTEER', 3)}`).send({ status: 'DELIVERED' });
    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe('DELIVERED');
  });

  it('rejects invalid volunteer status transitions', async () => {
    database.query.mockResolvedValueOnce({ rows: [{ id: 20, status: 'ASSIGNED', volunteer_id: 3 }] });
    const response = await request(app).patch('/api/volunteers/tasks/20/status')
      .set('Authorization', `Bearer ${token('VOLUNTEER', 3)}`).send({ status: 'DELIVERED' });
    expect(response.status).toBe(422);
  });
});
