const app = require('../../app');
const chai = require('chai');
const request = require('supertest');
const HttpStatus = require('http-status-codes');
const expect = chai.expect;

const common = require('../../common/config');
const config = common.config();
const testData = require('../../common/test-data');
const superagent = require('superagent');

describe('Admin API Tests', function () {

  let bearerToken;
  const adminClientId = config.integration_tests.admin.client_id;
  const baseApiUnderTestUrl = '/api/admin/bookmarks/';

  let createdBookmarkId;

  let bookmarkExample = testData.bookmarkExample;


  before(function (done) {
    superagent
      .post(config.integration_tests.token_endpoint)
      .send('client_id=' + config.integration_tests.admin.client_id)
      .send('client_secret=' + config.integration_tests.admin.client_secret)
      .send('grant_type=client_credentials')
      .set('Accept', 'application/json')
      .then(response => {
        bearerToken = 'Bearer ' + response.body.access_token;
        console.log(bearerToken);
        done();
      });
  });

  describe('Get bookmarks functionality', function () {

    it('should find some bookmarks', function (done) {
      request(app)
        .get(baseApiUnderTestUrl)
        .set('Authorization', bearerToken)
        .end(function (err, response) {
          expect(response.statusCode).to.equal(HttpStatus.OK);
          const bookmarks = response.body;
          expect(bookmarks.length).to.be.above(1);

          done();
        });
    });


    it('should find some public bookmarks', function (done) {
      request(app)
        .get(baseApiUnderTestUrl)
        .set('Authorization', bearerToken)
        .query({public: true}) //difference to previous test
        .end(function (err, response) {
          expect(response.statusCode).to.equal(HttpStatus.OK);
          const bookmarks = response.body;
          expect(bookmarks.length).to.be.above(1);

          done();
        });
    });

  });

  describe('get latest bookmarks function tests', function () {
    const latestEntriesApiBaseUrl = '/api/admin/bookmarks/latest-entries';

    it('should return the latest bookmarks - without query parameters', function (done) {
      request(app)
        .get(latestEntriesApiBaseUrl)
        .set('Authorization', bearerToken)
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.OK);
          done();
        });
    });

    it('should return the latest bookmarks - "since" parameter', function (done) {
      let oneMonthBeforeNow = new Date();
      oneMonthBeforeNow.setMonth(oneMonthBeforeNow.getMonth() - 1);
      request(app)
        .get(latestEntriesApiBaseUrl)
        .query({since: oneMonthBeforeNow.getTime()})
        .set('Authorization', bearerToken)
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.OK);
          done();
        });
    });

    it('should return the latest bookmarks - "since" and "to" parameter', function (done) {
      let sevenDaysBeforeNow = new Date();
      sevenDaysBeforeNow.setDate(sevenDaysBeforeNow.getDate() - 7);

      let twoDaysBeforeNow = new Date();
      twoDaysBeforeNow.setDate(twoDaysBeforeNow.getDate() - 7);

      request(app)
        .get(latestEntriesApiBaseUrl)
        .query({since: sevenDaysBeforeNow.getTime()})
        .query({to: twoDaysBeforeNow.getTime()})
        .set('Authorization', bearerToken)
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.OK);
          done();
        });
    });

    it('should return bad request - invalid "since" and "to" parameter', function (done) {
      let sevenDaysBeforeNow = new Date();
      sevenDaysBeforeNow.setDate(sevenDaysBeforeNow.getDate() - 7);

      let twoDaysBeforeNow = new Date();
      twoDaysBeforeNow.setDate(twoDaysBeforeNow.getDate() - 2);

      request(app)
        .get(latestEntriesApiBaseUrl)
        .query({since: twoDaysBeforeNow.getTime()})
        .query({to: sevenDaysBeforeNow.getTime()})
        .set('Authorization', bearerToken)
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          done();
        });
    });
  });

  describe('invalid bookmark attributes at CREATION' , function () {
    it('should fail trying to CREATE bookmark without a name', function (done) {
      let invalidBookmark = JSON.parse(JSON.stringify(bookmarkExample));
      invalidBookmark.name = '';
      request(app)
        .post(`${baseApiUnderTestUrl}`)
        .set('Authorization', bearerToken)
        .send(invalidBookmark)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          expect(response.body.title).to.equal('Missing required attributes');
          done();
        });
    });

    it('should fail trying to CREATE bookmark without a location', function (done) {
      let invalidBookmark = JSON.parse(JSON.stringify(bookmarkExample));
      invalidBookmark.location = '';
      request(app)
        .post(`${baseApiUnderTestUrl}`)
        .set('Authorization', bearerToken)
        .send(invalidBookmark)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          expect(response.body.title).to.equal('Missing required attributes');
          done();
        });
    });

    it('should fail trying to CREATE bookmark without tags', function (done) {
      let invalidBookmark = JSON.parse(JSON.stringify(bookmarkExample));
      invalidBookmark.tags = [];
      request(app)
        .post(`${baseApiUnderTestUrl}`)
        .set('Authorization', bearerToken)
        .send(invalidBookmark)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          expect(response.body.title).to.equal('Missing required attributes');
          done();
        });
    });

    it('should fail trying to CREATE bookmark with too many tags', function (done) {
      let invalidBookmark = JSON.parse(JSON.stringify(bookmarkExample));
      invalidBookmark.tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9'];
      request(app)
        .post(`${baseApiUnderTestUrl}`)
        .set('Authorization', bearerToken)
        .send(invalidBookmark)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          expect(response.body.title).to.equal('Too many tags have been submitted');

          done();
        });
    });

    it('should fail trying to CREATE bookmark with a too big description', function (done) {
      let invalidBookmark = JSON.parse(JSON.stringify(bookmarkExample));
      const textSnippet = "long text in the making";
      let longText = textSnippet;
      for (var i = 0; i < 100; i++) {
        longText += textSnippet;
      }
      invalidBookmark.description = longText;

      request(app)
        .post(`${baseApiUnderTestUrl}`)
        .set('Authorization', bearerToken)
        .send(invalidBookmark)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          expect(response.body.title).to.contain('The description is too long.');
          done();
        });
    });

    it('should fail trying to CREATE bookmark with a description with too many lines', function (done) {
      let invalidBookmark = JSON.parse(JSON.stringify(bookmarkExample));
      const line = "oneline\n";
      let longText = line;
      for (var i = 0; i < 101; i++) {
        longText += line;
      }
      invalidBookmark.description = longText;

      request(app)
        .post(`${baseApiUnderTestUrl}`)
        .set('Authorization', bearerToken)
        .send(invalidBookmark)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          expect(response.body.title).to.contain('The description hast too many lines.');
          done();
        });
    });

  });
});
