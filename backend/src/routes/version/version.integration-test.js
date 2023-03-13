const app = require('../../app');
const request = require('supertest');

describe('API Tests - version', function () {
  it('should return response with version', async () => {
    const res = await request(app)
      .get('/api/version');

    expect(res.body.gitSha1).toBeTruthy();
    expect(res.body.version).toBeDefined();
    expect(res.statusCode).toEqual(200);
  });
});
