process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

jest.mock('../config/database', () => ({
  pool: { end: jest.fn(), connect: jest.fn() },
  query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
}));

const request = require('supertest');
const app = require('../app');

describe('GET /api/health', () => {
  it('returns a successful health status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      status: 'ok',
    });
    expect(response.body.timestamp).toBeDefined();
  });

  it('returns the centralized 404 response for unknown routes', async () => {
    const response = await request(app).get('/api/not-found');

    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
      }),
    );
  });
});
