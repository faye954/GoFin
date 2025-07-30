const request = require('supertest');
const app = require('../../app');

describe('Server Integration', () => {
  test('responds to health check', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200); // ✅ 实际返回的是 200
  });

  test('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/non-existent-route');
    expect(res.statusCode).toBe(404);
  });
});
