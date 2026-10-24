jest.mock('keycloak-connect', () =>
  class {
    middleware() {
      return (request, response, next) => next();
    }

    protect() {
      return (request, response, next) => {
        const subject = request.headers.authorization?.replace(/^Bearer /, '');
        if (!subject) return response.sendStatus(401);
        request.kauth = {
          grant: { access_token: { content: { sub: subject } } },
        };
        next();
      };
    }
  }
);
jest.mock('../../common/config', () => ({
  config: () => ({ keycloak: {} }),
}));

require('express-async-errors');
const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const Bookmark = require('../../model/bookmark');
const Note = require('../../model/note');
const ShareLink = require('../../model/share-link');
const ValidationError = require('../../error/validation.error');
const NotFoundError = require('../../error/not-found.error');
const UserIdError = require('./userid-validation.error');

const app = express();
app.use(express.json());
app.use(
  '/api/personal/users/:userId/share-links',
  require('./share-links.router')
);
app.use(
  '/api/personal/users/:userId/bookmarks',
  require('./bookmarks/personal-bookmarks.router')
);
app.use(
  '/api/personal/users/:userId/notes',
  require('./notes/personal-notes.router')
);
app.use('/api/public/bookmarks', require('../public/public-bookmarks.router'));
app.use('/api/public/notes', require('../public/public-notes.router'));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status =
    error instanceof ValidationError
      ? 400
      : error instanceof UserIdError
        ? 401
        : error instanceof NotFoundError
          ? 404
          : 500;
  res.status(status).json({ message: error.message });
});

const databaseName = `share_links_test_${process.pid}_${Date.now()}`;
let bookmarkId;
let noteId;
const auth = (userId = 'owner') => `Bearer ${userId}`;
const base = '/api/personal/users';
const getStatus = (type, id, userId = 'owner') =>
  request(app)
    .get(`${base}/${userId}/share-links/${type}/${id}`)
    .set('Authorization', auth(userId));
const createLink = (type, id, userId = 'owner') =>
  request(app)
    .post(`${base}/${userId}/share-links/${type}/${id}`)
    .set('Authorization', auth(userId));

beforeAll(async () => {
  await mongoose.connect(
    process.env.COPYABLE_TEST_MONGO_URI ||
      'mongodb://mongoadmin:secret@127.0.0.1:27017/?authSource=admin',
    { dbName: databaseName, serverSelectionTimeoutMS: 5000 }
  );
  await Promise.all([
    Bookmark.createCollection(),
    Note.createCollection(),
    ShareLink.createCollection(),
  ]);
  await ShareLink.createIndexes();
}, 20000);

beforeEach(async () => {
  await Promise.all([
    Bookmark.deleteMany({}),
    Note.deleteMany({}),
    ShareLink.deleteMany({}),
  ]);
  bookmarkId = new mongoose.Types.ObjectId();
  noteId = new mongoose.Types.ObjectId();
  await Promise.all([
    Bookmark.create({
      _id: bookmarkId,
      userId: 'owner',
      name: 'Shared bookmark',
      location: 'https://example.com',
      public: false,
    }),
    Note.create({
      _id: noteId,
      userId: 'owner',
      title: 'Shared note',
      content: 'Content',
      public: false,
    }),
  ]);
});

afterAll(async () => {
  if (mongoose.connection.name === databaseName) {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
});

test('creates a reusable link only on explicit owner action and revokes it', async () => {
  const statusBeforeCreate = await getStatus('note', noteId);
  expect(statusBeforeCreate.status).toBe(200);
  expect(statusBeforeCreate.body).toEqual({ active: false });
  expect(statusBeforeCreate.headers['cache-control']).toBe('no-store');
  expect(await ShareLink.countDocuments({})).toBe(0);

  const created = await createLink('note', noteId);
  expect(created.status).toBe(201);
  expect(created.body).toMatchObject({
    active: true,
    resourceType: 'note',
    resourceId: noteId.toString(),
  });
  expect(created.body.token).toMatch(/^[A-Za-z0-9_-]{43}$/);

  const repeated = await createLink('note', noteId);
  expect(repeated.status).toBe(200);
  expect(repeated.body.token).toBe(created.body.token);
  expect(repeated.body.shareLinkId).toBe(created.body.shareLinkId);

  const listed = await request(app)
    .get(`${base}/owner/share-links`)
    .set('Authorization', auth());
  expect(listed.status).toBe(200);
  expect(listed.body).toMatchObject({
    page: 1,
    limit: 55,
    total: 1,
    items: [
      {
        resourceType: 'note',
        resourceId: noteId.toString(),
        title: 'Shared note',
        public: false,
      },
    ],
  });
  expect(listed.body.items[0]).not.toHaveProperty('token');

  const revoked = await request(app)
    .delete(
      `${base}/owner/share-links/${created.body.shareLinkId}`
    )
    .set('Authorization', auth());
  expect(revoked.status).toBe(204);
  const repeatedRevoke = await request(app)
    .delete(
      `${base}/owner/share-links/${created.body.shareLinkId}`
    )
    .set('Authorization', auth());
  expect(repeatedRevoke.status).toBe(204);

  const statusAfterRevoke = await getStatus('note', noteId);
  expect(statusAfterRevoke.body).toEqual({ active: false });

  const replacement = await createLink('note', noteId);
  expect(replacement.status).toBe(201);
  expect(replacement.body.token).not.toBe(created.body.token);
  expect(
    await ShareLink.countDocuments({
      resourceType: 'note',
      resourceId: noteId,
      active: true,
    })
  ).toBe(1);

  const staleRevoke = await request(app)
    .delete(
      `${base}/owner/share-links/${created.body.shareLinkId}`
    )
    .set('Authorization', auth());
  expect(staleRevoke.status).toBe(204);
  expect((await getStatus('note', noteId)).body.token).toBe(
    replacement.body.token
  );
});

test('concurrent creation converges for bookmarks and notes', async () => {
  for (const [type, id] of [
    ['bookmark', bookmarkId],
    ['note', noteId],
  ]) {
    const results = await Promise.all([
      createLink(type, id),
      createLink(type, id),
      createLink(type, id),
    ]);

    expect(results.map((result) => result.status).sort()).toEqual([
      200, 200, 201,
    ]);
    expect(new Set(results.map((result) => result.body.shareLinkId)).size).toBe(
      1
    );
    expect(new Set(results.map((result) => result.body.token)).size).toBe(1);
  }
});

test('lists active owned resources with strict pagination and no tokens', async () => {
  const bookmarkLink = await createLink('bookmark', bookmarkId);
  const noteLink = await createLink('note', noteId);
  const foreignNoteId = new mongoose.Types.ObjectId();
  await Note.create({
    _id: foreignNoteId,
    userId: 'other',
    title: 'Foreign note',
    content: 'Private',
  });
  await ShareLink.create({
    resourceType: 'note',
    resourceId: foreignNoteId,
    ownerUserId: 'owner',
    token: 'foreign-resource-link',
  });
  await ShareLink.create({
    resourceType: 'note',
    resourceId: new mongoose.Types.ObjectId(),
    ownerUserId: 'owner',
    token: 'orphan-resource-link',
  });
  await ShareLink.updateOne(
    { _id: bookmarkLink.body.shareLinkId },
    { $set: { createdAt: new Date('2026-01-01T00:00:00Z') } }
  );
  await ShareLink.updateOne(
    { _id: noteLink.body.shareLinkId },
    { $set: { createdAt: new Date('2026-01-02T00:00:00Z') } }
  );

  const firstPage = await request(app)
    .get(`${base}/owner/share-links?page=1&limit=1`)
    .set('Authorization', auth());
  expect(firstPage.status).toBe(200);
  expect(firstPage.body).toMatchObject({
    page: 1,
    limit: 1,
    total: 2,
    items: [{ resourceType: 'note', title: 'Shared note' }],
  });
  expect(firstPage.body.items[0]).not.toHaveProperty('token');

  const secondPage = await request(app)
    .get(`${base}/owner/share-links?page=2&limit=1`)
    .set('Authorization', auth());
  expect(secondPage.body.items).toMatchObject([
    { resourceType: 'bookmark', title: 'Shared bookmark' },
  ]);

  const invalid = await request(app)
    .get(`${base}/owner/share-links?page=1.5&limit=56`)
    .set('Authorization', auth());
  expect(invalid.status).toBe(400);

  const outOfRange = await request(app)
    .get(`${base}/owner/share-links?page=3&limit=1`)
    .set('Authorization', auth());
  expect(outOfRange.status).toBe(200);
  expect(outOfRange.body).toMatchObject({ total: 2, items: [] });
});

test('does not list a resource deleted before its sharing grant was cleaned up', async () => {
  await createLink('note', noteId);
  await Note.deleteOne({ _id: noteId, userId: 'owner' });

  const listed = await request(app)
    .get(`${base}/owner/share-links`)
    .set('Authorization', auth());

  expect(listed.status).toBe(200);
  expect(listed.body).toMatchObject({ total: 0, items: [] });
  expect(
    await ShareLink.countDocuments({
      resourceType: 'note',
      resourceId: noteId,
      active: true,
    })
  ).toBe(1);
});

test('ordinary resource reads do not project retained legacy credentials', async () => {
  await Promise.all([
    Bookmark.updateOne(
      { _id: bookmarkId },
      { $set: { shareableId: 'legacy-bookmark-token' } }
    ),
    Note.updateOne(
      { _id: noteId },
      { $set: { shareableId: 'legacy-note-token' } }
    ),
  ]);

  const [bookmark, note] = await Promise.all([
    Bookmark.findById(bookmarkId),
    Note.findById(noteId),
  ]);

  expect(bookmark.shareableId).toBeUndefined();
  expect(note.shareableId).toBeUndefined();
});

test('anonymous resolution requires an active matching grant and owned resource', async () => {
  await Note.updateOne(
    { _id: noteId },
    {
      $set: {
        contentType: 'notebook',
        notebookContent: '{"cells":[]}',
        origin: { file: 'private.ipynb' },
      },
    }
  );
  const bookmarkLink = await createLink('bookmark', bookmarkId);
  const noteLink = await createLink('note', noteId);
  const bookmarkPath = `/api/public/bookmarks/shared/${bookmarkLink.body.token}`;
  const notePath = `/api/public/notes/shared/${noteLink.body.token}`;

  const [bookmarkResponse, noteResponse] = await Promise.all([
    request(app).get(bookmarkPath),
    request(app).get(notePath),
  ]);
  expect(bookmarkResponse.status).toBe(200);
  expect(bookmarkResponse.headers['cache-control']).toBe('no-store');
  expect(bookmarkResponse.headers['referrer-policy']).toBe('no-referrer');
  expect(bookmarkResponse.body).toMatchObject({
    _id: bookmarkId.toString(),
    name: 'Shared bookmark',
  });
  expect(bookmarkResponse.body).not.toHaveProperty('public');
  expect(bookmarkResponse.body).not.toHaveProperty('userId');
  expect(bookmarkResponse.body).not.toHaveProperty('shareableId');
  expect(noteResponse.status).toBe(200);
  expect(noteResponse.body).toMatchObject({
    _id: noteId.toString(),
    title: 'Shared note',
    contentType: 'notebook',
    notebookContent: '{"cells":[]}',
  });
  expect(noteResponse.body).not.toHaveProperty('public');
  expect(noteResponse.body).not.toHaveProperty('userId');
  expect(noteResponse.body).not.toHaveProperty('origin');

  const wrongType = await request(app).get(
    `/api/public/notes/shared/${bookmarkLink.body.token}`
  );
  expect(wrongType.status).toBe(404);
  expect(wrongType.headers['cache-control']).toBe('no-store');
  expect(wrongType.headers['referrer-policy']).toBe('no-referrer');

  await Bookmark.updateOne(
    { _id: bookmarkId },
    { $set: { shareableId: 'legacy-bookmark-token' } }
  );
  const legacy = await request(app).get(
    '/api/public/bookmarks/shared/legacy-bookmark-token'
  );
  expect(legacy.status).toBe(404);
  expect(JSON.stringify(legacy.body)).not.toContain('legacy-bookmark-token');

  await request(app)
    .delete(`${base}/owner/share-links/${noteLink.body.shareLinkId}`)
    .set('Authorization', auth())
    .expect(204);
  const revoked = await request(app).get(notePath);
  expect(revoked.status).toBe(404);
  expect(JSON.stringify(revoked.body)).not.toContain(noteLink.body.token);

  await Bookmark.deleteOne({ _id: bookmarkId, userId: 'owner' });
  const deleted = await request(app).get(bookmarkPath);
  expect(deleted.status).toBe(404);
  expect(JSON.stringify(deleted.body)).not.toContain(bookmarkLink.body.token);
});

test('legacy create-on-get endpoints return not-found without creating grants', async () => {
  for (const type of ['bookmarks', 'notes']) {
    const response = await request(app)
      .get(`${base}/owner/${type}/shareable/${type === 'notes' ? noteId : bookmarkId}`)
      .set('Authorization', auth());

    expect(response.status).toBe(404);
  }
  expect(await ShareLink.countDocuments({})).toBe(0);
});

test('rejects unsupported resource types and nonempty creation bodies', async () => {
  const unsupported = await createLink('snippet', noteId);
  expect(unsupported.status).toBe(400);

  const withBody = await request(app)
    .post(`${base}/owner/share-links/note/${noteId}`)
    .set('Authorization', auth())
    .send({ token: 'caller-chosen' });
  expect(withBody.status).toBe(400);
  expect(await ShareLink.countDocuments({})).toBe(0);
});

test('enforces the active-resource index and keeps the token excluded by default', async () => {
  const first = await ShareLink.create({
    resourceType: 'bookmark',
    resourceId: bookmarkId,
    ownerUserId: 'owner',
    token: 'first-token',
  });

  await expect(
    ShareLink.create({
      resourceType: 'bookmark',
      resourceId: bookmarkId,
      ownerUserId: 'owner',
      token: 'second-token',
    })
  ).rejects.toMatchObject({ code: 11000 });

  const ordinaryQuery = await ShareLink.findById(first._id);
  expect(ordinaryQuery.token).toBeUndefined();
  const credentialQuery = await ShareLink.findById(first._id).select('+token');
  expect(credentialQuery.token).toBe('first-token');
});

test('does not disclose foreign resources and rejects malformed inputs', async () => {
  const foreign = await getStatus('note', noteId, 'other');
  expect(foreign.status).toBe(404);

  const unauthenticated = await request(app).get(
    `${base}/owner/share-links/note/${noteId}`
  );
  expect(unauthenticated.status).toBe(401);
  expect(unauthenticated.headers['cache-control']).toBe('no-store');

  const mismatchedOwner = await request(app)
    .get(`${base}/owner/share-links/note/${noteId}`)
    .set('Authorization', auth('other'));
  expect(mismatchedOwner.status).toBe(401);

  const malformed = await getStatus('note', 'not-an-id');
  expect(malformed.status).toBe(400);
});
