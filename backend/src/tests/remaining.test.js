process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const mockVolunteerClient = {
  query: jest.fn(),
  release: jest.fn(),
};

jest.mock('../config/database', () => ({
  pool: {
    end: jest.fn(),
    connect: jest.fn().mockResolvedValue(mockVolunteerClient),
  },
  query: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../app');
const database = require('../config/database');

function token(role, id) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET);
}

describe('volunteer, admin, and notification features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVolunteerClient.query.mockReset();
  });

  it('shows available volunteer assignments', async () => {
    database.query.mockResolvedValueOnce({
      rows: [{ id: 20, status: 'APPROVED', volunteer_id: null }],
    });

    const response = await request(app)
      .get('/api/volunteers/tasks')
      .set('Authorization', `Bearer ${token('VOLUNTEER', 3)}`);

    expect(response.status).toBe(200);
    expect(response.body.tasks).toHaveLength(1);
  });

  it('allows an available task volunteer to accept an assignment', async () => {
    mockVolunteerClient.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ id: 20, donation_id: 10, status: 'APPROVED', volunteer_id: null }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 20, status: 'ASSIGNED', volunteer_id: 3 }] })
      .mockResolvedValueOnce({});

    const response = await request(app)
      .patch('/api/volunteers/tasks/20/accept')
      .set('Authorization', `Bearer ${token('VOLUNTEER', 3)}`);

    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe('ASSIGNED');
  });

  it('rejects a duplicate volunteer assignment', async () => {
    mockVolunteerClient.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ id: 20, donation_id: 10, status: 'APPROVED', volunteer_id: null }] })
      .mockResolvedValueOnce({ rows: [{ id: 21 }] });

    const response = await request(app)
      .patch('/api/volunteers/tasks/20/accept')
      .set('Authorization', `Bearer ${token('VOLUNTEER', 3)}`);

    expect(response.status).toBe(409);
  });

  it('marks an accepted pickup as collected', async () => {
    database.query
      .mockResolvedValueOnce({ rows: [{ id: 20, status: 'ACCEPTED', volunteer_id: 3 }] })
      .mockResolvedValueOnce({ rows: [{ id: 20, status: 'COLLECTED', volunteer_id: 3 }] });

    const response = await request(app)
      .patch('/api/volunteers/tasks/20/status')
      .set('Authorization', `Bearer ${token('VOLUNTEER', 3)}`)
      .send({ status: 'COLLECTED' });

    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe('COLLECTED');
  });

  it('marks collected food as delivered', async () => {
    database.query
      .mockResolvedValueOnce({ rows: [{ id: 20, status: 'COLLECTED', volunteer_id: 3 }] })
      .mockResolvedValueOnce({ rows: [{ id: 20, status: 'DELIVERED', volunteer_id: 3 }] });

    const response = await request(app)
      .patch('/api/volunteers/tasks/20/status')
      .set('Authorization', `Bearer ${token('VOLUNTEER', 3)}`)
      .send({ status: 'DELIVERED' });

    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe('DELIVERED');
  });

  it('rejects invalid volunteer status transitions', async () => {
    database.query.mockResolvedValueOnce({
      rows: [{ id: 20, status: 'ASSIGNED', volunteer_id: 3 }],
    });

    const response = await request(app)
      .patch('/api/volunteers/tasks/20/status')
      .set('Authorization', `Bearer ${token('VOLUNTEER', 3)}`)
      .send({ status: 'DELIVERED' });

    expect(response.status).toBe(422);
  });

  it('restricts admin statistics to administrators', async () => {
    const response = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token('VOLUNTEER', 3)}`);

    expect(response.status).toBe(403);
  });

  it('returns platform statistics to an administrator', async () => {
    database.query
      .mockResolvedValueOnce({ rows: [{ users: '12' }] })
      .mockResolvedValueOnce({ rows: [{ donations: '8' }] })
      .mockResolvedValueOnce({ rows: [{ pickups: '5' }] });

    const response = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token('ADMIN', 1)}`);

    expect(response.status).toBe(200);
    expect(response.body.stats).toEqual({ users: 12, donations: 8, pickups: 5 });
  });

  it('approves NGO verification for an administrator', async () => {
    database.query.mockResolvedValueOnce({
      rows: [{ id: 2, role: 'NGO', verification_status: 'VERIFIED' }],
    });

    const response = await request(app)
      .patch('/api/admin/ngos/2/verification')
      .set('Authorization', `Bearer ${token('ADMIN', 1)}`)
      .send({ status: 'APPROVED' });

    expect(response.status).toBe(200);
    expect(response.body.ngo.verification_status).toBe('VERIFIED');
  });

  it('returns and marks notifications for the logged-in user', async () => {
    database.query
      .mockResolvedValueOnce({ rows: [{ id: 30, user_id: 2, is_read: false }] })
      .mockResolvedValueOnce({ rows: [{ id: 30, user_id: 2, is_read: true }] });

    const listResponse = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token('NGO', 2)}`);
    expect(listResponse.status).toBe(200);

    const readResponse = await request(app)
      .patch('/api/notifications/30/read')
      .set('Authorization', `Bearer ${token('NGO', 2)}`);
    expect(readResponse.status).toBe(200);
    expect(readResponse.body.notification.is_read).toBe(true);
  });
});
