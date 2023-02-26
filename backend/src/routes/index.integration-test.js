const app = require('../app');
const request = require('supertest');

describe('API Tests root', function() {
  it('should return link to swagger documentation', async () => {
    const res = await request(app)
      .get('/api');

    expect(res.statusCode).toEqual(200);
    expect(res.text).toEqual('API Backend supporting Codever.dev - <a href="/api/docs">Swagger Docs</a>');
  });
});
