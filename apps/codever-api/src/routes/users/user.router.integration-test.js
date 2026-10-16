const app = require('../../app');
const request = require('supertest');
const HttpStatus = require('http-status-codes/index');
const mongoose = require('mongoose');
const Bookmark = require('../../model/bookmark');
const Note = require('../../model/note');
const User = require('../../model/user');

const { toInclude } = require('jest-extended');
const {
  getAccessToken,
  getBearerToken,
  getTestUserId,
} = require('../../common/testing/test.utils');
expect.extend({ toInclude });

/**
 * Order of tests is important (example user will be first created/updated to eventually be deleted)
 */
describe('User Data tests', () => {
  let bearerToken;
  let testUserId;
  const baseApiUrlUnderTest = '/api/personal/users';

  const starredBookmarkId = 'bookmarkid-3443';

  const searchTextExample = 'nodejs rocks';
  let userExample;

  beforeAll(async () => {
    try {
      const accessToken = await getAccessToken();
      bearerToken = getBearerToken(accessToken);
      testUserId = getTestUserId(accessToken);

      userExample = {
        userId: testUserId,
        searches: [
          {
            text: searchTextExample,
            lastAccessedAt: '2019-01-28T05:47:47.652Z',
          },
        ],
        readLater: [],
        likes: [],
        watchedTags: [],
        pinned: [],
        history: [],
      };
    } catch (err) {
      console.error('Error when getting user bearer token', err);
    }
  });

  it('should fail trying to GET user details with invalid user id', async function () {
    const response = await request(app)
      .get(baseApiUrlUnderTest + '/invalid-user-id')
      .set('Authorization', bearerToken);

    expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
  });

  it('should fail trying to GET data for not existing user', async function () {
    const response = await request(app)
      .get(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken);

    expect(response.statusCode).toEqual(HttpStatus.NOT_FOUND);
  });

  it('should fail trying to UPDATE user without userId in the body', async function () {
    let invalidUser = JSON.parse(JSON.stringify(userExample));
    delete invalidUser.userId;

    const response = await request(app)
      .put(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken);

    expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
    expect(response.body.validationErrors).toInclude(
      'Missing or invalid userId in provided user data'
    );
  });

  it('should fail trying to UPDATE with invalid user Id in the body', async function () {
    let invalidUser = JSON.parse(JSON.stringify(userExample));
    invalidUser.userId = 'invalid_user_id';

    const response = await request(app)
      .put(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken);

    expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
    expect(response.body.validationErrors).toInclude(
      'Missing or invalid userId in provided user data'
    );
  });

  it('should successfully UPDATE example user without searches', async function () {
    let newUser = JSON.parse(JSON.stringify(userExample));
    newUser.searches = [];

    const response = await request(app)
      .put(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken)
      .send(newUser);

    expect(response.statusCode).toEqual(HttpStatus.OK);
    expect(response.body.userId).toEqual(testUserId);
    expect(response.body.searches).toHaveLength(0);
  });

  it('should fail trying to UPDATE example user with invalid searches', async function () {
    let userWithInvalidSearches = JSON.parse(JSON.stringify(userExample));
    userWithInvalidSearches.searches.push({
      text: '',
      lastAccessedAt: '2019-01-28T05:47:47.652Z',
    });

    const response = await request(app)
      .put(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken)
      .send(userWithInvalidSearches);

    expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
    expect(response.body.validationErrors).toInclude(
      'Searches are not valid - search text is required'
    );
  });

  it('should successfully UPDATE example user with searches', async function () {
    const response = await request(app)
      .put(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken)
      .send(userExample);

    expect(response.statusCode).toEqual(HttpStatus.OK);
    expect(response.body.userId).toEqual(testUserId);
    expect(response.body.searches).toHaveLength(1);
    expect(response.body.searches[0].text).toEqual(searchTextExample);
  });

  it('should mutate favorites only for accessible resources', async function () {
    const bookmarkId = new mongoose.Types.ObjectId();
    const publicNoteId = new mongoose.Types.ObjectId();
    const privateNoteId = new mongoose.Types.ObjectId();
    const missingResourceId = new mongoose.Types.ObjectId();

    try {
      await Bookmark.create({
        _id: bookmarkId,
        name: 'Favorite test bookmark',
        location: 'https://example.com/favorite-test',
        userId: testUserId,
        public: false,
      });
      await Note.create({
        _id: publicNoteId,
        title: 'Favorite test public note',
        userId: 'another-user',
        public: true,
      });
      await Note.create({
        _id: privateNoteId,
        title: 'Favorite test private note',
        userId: 'another-user',
        public: false,
      });

      const addedBookmark = await request(app)
        .patch(`${baseApiUrlUnderTest}/${testUserId}/favorites`)
        .set('Authorization', bearerToken)
        .send({
          resourceType: 'bookmark',
          resourceId: bookmarkId.toString(),
          favorite: true,
        });

      expect(addedBookmark.statusCode).toEqual(HttpStatus.OK);
      expect(addedBookmark.body).toEqual({
        resourceType: 'bookmark',
        resourceId: bookmarkId.toString(),
        favorite: true,
      });

      const addedNote = await request(app)
        .patch(`${baseApiUrlUnderTest}/${testUserId}/favorites`)
        .set('Authorization', bearerToken)
        .send({
          resourceType: 'note',
          resourceId: publicNoteId.toString(),
          favorite: true,
        });

      expect(addedNote.statusCode).toEqual(HttpStatus.OK);
      expect(addedNote.body.favorite).toBe(true);

      const removedNote = await request(app)
        .patch(`${baseApiUrlUnderTest}/${testUserId}/favorites`)
        .set('Authorization', bearerToken)
        .send({
          resourceType: 'note',
          resourceId: publicNoteId.toString(),
          favorite: false,
        });

      expect(removedNote.statusCode).toEqual(HttpStatus.OK);
      expect(removedNote.body.favorite).toBe(false);

      const malformed = await request(app)
        .patch(`${baseApiUrlUnderTest}/${testUserId}/favorites`)
        .set('Authorization', bearerToken)
        .send({
          resourceType: 'note',
          resourceId: 'not-an-object-id',
          favorite: true,
        });
      expect(malformed.statusCode).toEqual(HttpStatus.BAD_REQUEST);

      const inaccessible = await request(app)
        .patch(`${baseApiUrlUnderTest}/${testUserId}/favorites`)
        .set('Authorization', bearerToken)
        .send({
          resourceType: 'note',
          resourceId: privateNoteId.toString(),
          favorite: true,
        });
      expect(inaccessible.statusCode).toEqual(HttpStatus.NOT_FOUND);

      const missing = await request(app)
        .patch(`${baseApiUrlUnderTest}/${testUserId}/favorites`)
        .set('Authorization', bearerToken)
        .send({
          resourceType: 'note',
          resourceId: missingResourceId.toString(),
          favorite: true,
        });
      expect(missing.statusCode).toEqual(HttpStatus.NOT_FOUND);

      const mismatchedUser = await request(app)
        .patch(`${baseApiUrlUnderTest}/another-user/favorites`)
        .set('Authorization', bearerToken)
        .send({
          resourceType: 'note',
          resourceId: publicNoteId.toString(),
          favorite: true,
        });
      expect(mismatchedUser.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
    } finally {
      await Bookmark.deleteOne({ _id: bookmarkId });
      await Note.deleteMany({ _id: { $in: [publicNoteId, privateNoteId] } });
      await User.updateOne(
        { userId: testUserId },
        {
          $pull: {
            favorites: bookmarkId.toString(),
            favoriteNotes: { $in: [publicNoteId.toString(), privateNoteId.toString()] },
          },
        }
      );
    }
  });

  it('cleans deleted bookmarks and notes from every user favorite list', async function () {
    const singleBookmarkId = new mongoose.Types.ObjectId();
    const bulkBookmarkIds = [
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
    ];
    const noteId = new mongoose.Types.ObjectId();
    const unrelatedBookmarkId = 'unrelated-bookmark-id';
    const unrelatedNoteId = 'unrelated-note-id';
    const cleanupUserIds = [
      `favorite-cleanup-${new mongoose.Types.ObjectId()}`,
      `favorite-cleanup-${new mongoose.Types.ObjectId()}`,
    ];
    const bulkTag = `favorite-cleanup-${new mongoose.Types.ObjectId()}`;

    try {
      await Bookmark.create([
        {
          _id: singleBookmarkId,
          name: 'Favorite cleanup single bookmark',
          location: `https://example.com/${singleBookmarkId}`,
          userId: testUserId,
          public: false,
        },
        ...bulkBookmarkIds.map((_id) => ({
          _id,
          name: 'Favorite cleanup bulk bookmark',
          location: `https://example.com/${_id}`,
          userId: testUserId,
          public: false,
          tags: [bulkTag],
        })),
      ]);
      await Note.create({
        _id: noteId,
        title: 'Favorite cleanup note',
        userId: testUserId,
        public: false,
      });
      await User.create(
        cleanupUserIds.map((userId) => ({
          userId,
          favorites: [
            singleBookmarkId.toString(),
            ...bulkBookmarkIds.map((_id) => _id.toString()),
            unrelatedBookmarkId,
          ],
          favoriteNotes: [noteId.toString(), unrelatedNoteId],
        }))
      );

      const singleDeletion = await request(app)
        .delete(
          `${baseApiUrlUnderTest}/${testUserId}/bookmarks/${singleBookmarkId}`
        )
        .set('Authorization', bearerToken);
      expect(singleDeletion.statusCode).toEqual(HttpStatus.NO_CONTENT);

      const bulkDeletion = await request(app)
        .delete(`${baseApiUrlUnderTest}/${testUserId}/bookmarks`)
        .query({ tag: bulkTag, type: 'private' })
        .set('Authorization', bearerToken);
      expect(bulkDeletion.statusCode).toEqual(HttpStatus.OK);
      expect(bulkDeletion.body.deletedCount).toBe(bulkBookmarkIds.length);

      const noteDeletion = await request(app)
        .delete(`${baseApiUrlUnderTest}/${testUserId}/notes/${noteId}`)
        .set('Authorization', bearerToken);
      expect(noteDeletion.statusCode).toEqual(HttpStatus.NO_CONTENT);

      for (const userId of cleanupUserIds) {
        const userData = await User.findOne({ userId });
        expect(userData.favorites).toEqual([unrelatedBookmarkId]);
        expect(userData.favoriteNotes).toEqual([unrelatedNoteId]);
      }
    } finally {
      await Bookmark.deleteMany({
        _id: { $in: [singleBookmarkId, ...bulkBookmarkIds] },
      });
      await Note.deleteOne({ _id: noteId });
      await User.deleteMany({ userId: { $in: cleanupUserIds } });
    }
  });

  it('should successfully UPDATE example user new starred bookmark', async function () {
    let userExampleWithStars = JSON.parse(JSON.stringify(userExample));
    userExampleWithStars.likes = [starredBookmarkId];

    const response = await request(app)
      .put(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken)
      .send(userExampleWithStars);

    expect(response.statusCode).toEqual(HttpStatus.OK);
    expect(response.body.userId).toEqual(testUserId);
    expect(response.body.likes).toHaveLength(1);
    expect(response.body.likes[0]).toEqual(starredBookmarkId);
  });

  it('should now successfully READ created/updated user', async function () {
    const response = await request(app)
      .get(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken);

    expect(response.statusCode).toEqual(HttpStatus.OK);
    expect(response.body.userId).toEqual(testUserId);
    expect(response.body.searches).toHaveLength(1);
    expect(response.body.searches[0].text).toEqual(searchTextExample);
    expect(response.body.likes[0]).toEqual(starredBookmarkId);
  });

  it('should succeed to DELETE the new created user', async function () {
    const response = await request(app)
      .delete(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken);

    expect(response.statusCode).toEqual(HttpStatus.NO_CONTENT);
  });

  it('should fail trying to DELETE the already deleted user', async function () {
    const response = await request(app)
      .delete(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken);

    expect(response.statusCode).toEqual(HttpStatus.NOT_FOUND);
  });
});
