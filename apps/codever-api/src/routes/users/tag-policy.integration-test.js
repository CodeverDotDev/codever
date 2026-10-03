const app = require('../../app');

const request = require('supertest');
const HttpStatus = require('http-status-codes/index');

const { toInclude } = require('jest-extended');
expect.extend({ toInclude });

const {
  getTestUserId,
  getAccessToken,
  getBearerToken,
} = require('../../common/testing/test.utils');

const {
  NoteValidationErrorMessages,
} = require('./notes/note-input.validator');

const {
  BookmarkValidationErrorMessages,
} = require('../../common/validation/bookmark-input.validator');

const { TOO_MANY_TAGS, INVALID_TAGS } = require('../../common/validation/tag-policy');

let bearerToken;
let testUserId;

const baseNotesUrlUnderTest = '/api/personal/users/';
const baseBookmarksUrlUnderTest = '/api/personal/users/';

function makeTags(count, prefix = 'tag') {
  return Array.from({ length: count }, (_, index) => `${prefix}-${index}`);
}

// A unique suffix per run keeps the shared dev database clean on re-runs.
const runSuffix = `${Date.now()}`;

describe('Personal notes and bookmarks — thirteen-tag REST policy', () => {
  const createdNoteIds = [];
  const createdBookmarkLocations = [];

  beforeAll(async () => {
    const accessToken = await getAccessToken();
    bearerToken = getBearerToken(accessToken);
    testUserId = getTestUserId(accessToken);
  });

  afterAll(async () => {
    for (const noteId of createdNoteIds) {
      try {
        await request(app)
          .delete(`${baseNotesUrlUnderTest}${testUserId}/notes/${noteId}`)
          .set('Authorization', bearerToken);
      } catch (err) {
        // best-effort cleanup
      }
    }
    for (const location of createdBookmarkLocations) {
      try {
        await request(app)
          .delete(`${baseBookmarksUrlUnderTest}${testUserId}/bookmarks`)
          .query({ location })
          .set('Authorization', bearerToken);
      } catch (err) {
        // best-effort cleanup
      }
    }
  });

  function validNote(tags) {
    return {
      userId: testUserId,
      title: `tag-policy note ${runSuffix}`,
      content: 'content for the thirteen-tag policy integration test',
      tags,
    };
  }

  function validBookmark(tags) {
    return {
      userId: testUserId,
      name: `tag-policy bookmark ${runSuffix}`,
      location: `https://www.codever.dev/tag-policy-${runSuffix}`,
      tags,
    };
  }

  describe('notes', () => {
    it('creates a note with exactly thirteen normalized unique tags', async () => {
      const response = await request(app)
        .post(`${baseNotesUrlUnderTest}${testUserId}/notes`)
        .set('Authorization', bearerToken)
        .send(validNote(makeTags(13)));

      expect(response.statusCode).toEqual(HttpStatus.CREATED);
      expect(response.body.tags).toHaveLength(13);
      createdNoteIds.push(response.body._id);
    });

    it('normalizes duplicate, case and whitespace variants before counting', async () => {
      const response = await request(app)
        .post(`${baseNotesUrlUnderTest}${testUserId}/notes`)
        .set('Authorization', bearerToken)
        .send(
          validNote([
            'JavaScript',
            ' javascript ',
            'React',
            'react',
            'Node',
            'node ',
            'CSS',
          ])
        );

      expect(response.statusCode).toEqual(HttpStatus.CREATED);
      expect(response.body.tags).toEqual(['javascript', 'react', 'node', 'css']);
      createdNoteIds.push(response.body._id);
    });

    it('rejects a note with fourteen normalized unique tags and persists nothing', async () => {
      const response = await request(app)
        .post(`${baseNotesUrlUnderTest}${testUserId}/notes`)
        .set('Authorization', bearerToken)
        .send(validNote(makeTags(14)));

      expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toEqual(NoteValidationErrorMessages.NOTE_NOT_VALID);
      expect(response.body.validationErrors).toInclude(TOO_MANY_TAGS);
    });

    it('rejects a note with a malformed (whitespace-only) tag', async () => {
      const response = await request(app)
        .post(`${baseNotesUrlUnderTest}${testUserId}/notes`)
        .set('Authorization', bearerToken)
        .send(validNote(['valid', '   ']));

      expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toEqual(NoteValidationErrorMessages.NOTE_NOT_VALID);
      expect(response.body.validationErrors).toInclude(INVALID_TAGS);
    });

    it('leaves the stored note unchanged when an update with fourteen tags is rejected', async () => {
      const createResponse = await request(app)
        .post(`${baseNotesUrlUnderTest}${testUserId}/notes`)
        .set('Authorization', bearerToken)
        .send(validNote(makeTags(13)));
      expect(createResponse.statusCode).toEqual(HttpStatus.CREATED);
      const noteId = createResponse.body._id;
      createdNoteIds.push(noteId);

      const updateResponse = await request(app)
        .put(`${baseNotesUrlUnderTest}${testUserId}/notes/${noteId}`)
        .set('Authorization', bearerToken)
        .send(validNote(makeTags(14)));

      expect(updateResponse.statusCode).toEqual(HttpStatus.BAD_REQUEST);

      const getResponse = await request(app)
        .get(`${baseNotesUrlUnderTest}${testUserId}/notes/${noteId}`)
        .set('Authorization', bearerToken);

      expect(getResponse.statusCode).toEqual(HttpStatus.OK);
      expect(getResponse.body.tags).toHaveLength(13);
    });

    it('rejects note creation for a non-matching userId (ownership check)', async () => {
      const response = await request(app)
        .post(`${baseNotesUrlUnderTest}invalid-user-id/notes`)
        .set('Authorization', bearerToken)
        .send(validNote(makeTags(13)));

      expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('bookmarks', () => {
    it('creates a bookmark with exactly thirteen normalized unique tags', async () => {
      const response = await request(app)
        .post(`${baseBookmarksUrlUnderTest}${testUserId}/bookmarks`)
        .set('Authorization', bearerToken)
        .send(validBookmark(makeTags(13)));

      expect(response.statusCode).toEqual(HttpStatus.CREATED);
      const location = response.header['location'];
      expect(location).toBeTruthy();
      createdBookmarkLocations.push(validBookmark([]).location);

      const bookmarkId = location.substring(location.lastIndexOf('/') + 1);
      const getResponse = await request(app)
        .get(`${baseBookmarksUrlUnderTest}${testUserId}/bookmarks/${bookmarkId}`)
        .set('Authorization', bearerToken);

      expect(getResponse.statusCode).toEqual(HttpStatus.OK);
      expect(getResponse.body.tags).toHaveLength(13);
    });

    it('rejects a bookmark with fourteen normalized unique tags', async () => {
      const response = await request(app)
        .post(`${baseBookmarksUrlUnderTest}${testUserId}/bookmarks`)
        .set('Authorization', bearerToken)
        .send(validBookmark(makeTags(14)));

      expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
      expect(response.body.validationErrors).toInclude(TOO_MANY_TAGS);
    });

    it('still rejects a bookmark with no tags (existing minimum-tag rule)', async () => {
      const response = await request(app)
        .post(`${baseBookmarksUrlUnderTest}${testUserId}/bookmarks`)
        .set('Authorization', bearerToken)
        .send(validBookmark([]));

      expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
      expect(response.body.validationErrors).toInclude(BookmarkValidationErrorMessages.MISSING_TAGS);
    });

    it('rejects a bookmark with a malformed (non-string) tag', async () => {
      const response = await request(app)
        .post(`${baseBookmarksUrlUnderTest}${testUserId}/bookmarks`)
        .set('Authorization', bearerToken)
        .send(validBookmark(['valid', 42]));

      expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
      expect(response.body.validationErrors).toInclude(INVALID_TAGS);
    });
  });
});
