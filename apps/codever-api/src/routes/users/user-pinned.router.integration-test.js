const app = require('../../app');
const request = require('supertest');
const HttpStatus = require('http-status-codes/index');

const {
  getAccessToken,
  getBearerToken,
  getTestUserId,
  getBookmarkId,
} = require('../../common/testing/test.utils');

describe('User pinned resources tests', () => {
  const baseApiUrlUnderTest = '/api/personal/users';
  const bookmarkLocation =
    'http://www.codepedia.org/pinned-resources-integration-tests';
  const collectionName = 'Pinned resources integration collection';

  let bearerToken;
  let testUserId;
  let bookmarkId;
  let noteId;
  let collectionId;

  beforeAll(async () => {
    const accessToken = await getAccessToken();
    bearerToken = getBearerToken(accessToken);
    testUserId = getTestUserId(accessToken);

    // Clean up leftovers from a previous interrupted run.
    await request(app)
      .delete(`${baseApiUrlUnderTest}/${testUserId}/bookmarks`)
      .query({ location: bookmarkLocation })
      .set('Authorization', bearerToken);
    await request(app)
      .delete(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken);

    // Pinned updates require an existing user-data document.
    const createUserDataResponse = await request(app)
      .post(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken)
      .send({
        userId: testUserId,
        searches: [],
        readLater: [],
        likes: [],
        watchedTags: [],
        ignoredTags: [],
        pinned: [],
        favorites: [],
        history: [],
      });
    expect(createUserDataResponse.statusCode).toEqual(HttpStatus.CREATED);

    // Create one resource of each pinnable type.
    const bookmarkResponse = await request(app)
      .post(`${baseApiUrlUnderTest}/${testUserId}/bookmarks`)
      .set('Authorization', bearerToken)
      .send({
        name: 'Pinned resources integration bookmark',
        location: bookmarkLocation,
        tags: ['pinned-integration-test'],
        userId: testUserId,
        public: false,
      });
    bookmarkId = getBookmarkId(bookmarkResponse);

    const noteResponse = await request(app)
      .post(`${baseApiUrlUnderTest}/${testUserId}/notes`)
      .set('Authorization', bearerToken)
      .send({
        userId: testUserId,
        title: 'Pinned resources integration note',
        content: 'Content used to verify pinned note resolution.',
        contentType: 'markdown',
        tags: ['pinned-integration-test'],
      });
    expect(noteResponse.statusCode).toEqual(HttpStatus.CREATED);
    noteId = noteResponse.body._id;

    const collectionResponse = await request(app)
      .post(`${baseApiUrlUnderTest}/${testUserId}/collections`)
      .set('Authorization', bearerToken)
      .send({ name: collectionName });
    expect(collectionResponse.statusCode).toEqual(HttpStatus.CREATED);
    collectionId = collectionResponse.body._id;
  });

  afterAll(async () => {
    if (collectionId) {
      await request(app)
        .delete(
          `${baseApiUrlUnderTest}/${testUserId}/collections/${collectionId}`
        )
        .set('Authorization', bearerToken);
    }
    if (noteId) {
      await request(app)
        .delete(`${baseApiUrlUnderTest}/${testUserId}/notes/${noteId}`)
        .set('Authorization', bearerToken);
    }
    if (bookmarkId) {
      await request(app)
        .delete(`${baseApiUrlUnderTest}/${testUserId}/bookmarks/${bookmarkId}`)
        .set('Authorization', bearerToken);
    }
    await request(app)
      .delete(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken);
  });

  it('should reject a pinned entry with an unsupported type', async () => {
    const response = await request(app)
      .patch(`${baseApiUrlUnderTest}/${testUserId}/pinned`)
      .set('Authorization', bearerToken)
      .send({ pinned: [{ type: 'bogus', id: bookmarkId }] });

    expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
  });

  it('should store typed pinned entries and return mixed resources in order', async () => {
    const pinnedEntries = [
      { type: 'bookmark', id: bookmarkId },
      { type: 'note', id: noteId },
      { type: 'collection', id: collectionId },
    ];

    const patchResponse = await request(app)
      .patch(`${baseApiUrlUnderTest}/${testUserId}/pinned`)
      .set('Authorization', bearerToken)
      .send({ pinned: pinnedEntries });

    expect(patchResponse.statusCode).toEqual(HttpStatus.OK);
    expect(patchResponse.body).toEqual({ userDataPinnedUpdated: true });

    const getResponse = await request(app)
      .get(`${baseApiUrlUnderTest}/${testUserId}/pinned`)
      .set('Authorization', bearerToken)
      .query({ page: 1, limit: 10 });

    expect(getResponse.statusCode).toEqual(HttpStatus.OK);

    const pinnedResources = getResponse.body;
    expect(pinnedResources).toHaveLength(3);
    expect(pinnedResources[0]._id).toEqual(bookmarkId);
    expect(pinnedResources[1]._id).toEqual(noteId);

    // Collections come back "light" - typed, without populated items.
    const collectionResource = pinnedResources[2];
    expect(collectionResource._id).toEqual(collectionId);
    expect(collectionResource.type).toEqual('collection');
    expect(collectionResource.name).toEqual(collectionName);
    expect(collectionResource.items).toBeUndefined();
  });
});
