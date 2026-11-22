const app = require('../../app');
const request = require('supertest');
const HttpStatus = require('http-status-codes/index');
const superagent = require('superagent');

const common = require('../../common/config');
const config = common.config();
const testUtils = require('../../common/testing/test.utils');

const Bookmark = require('../../model/bookmark');
const Note = require('../../model/note');
const User = require('../../model/user');
const AdminAuditEntry = require('../../model/admin-audit-entry');
const AdminDeletedSnapshot = require('../../model/admin-deleted-snapshot');

const ADMIN_API = '/api/admin';
const OWNER_ID = 'admin-moderation-it-owner';
const OTHER_ID = 'admin-moderation-it-other';
const LOCATION = 'https://www.codever.dev/admin-moderation-it';

const getAdminBearerToken = async () => {
  const response = await superagent
    .post(config.integration_tests.token_endpoint)
    .send('client_id=bookmarks')
    .send('username=admin-integration-tests')
    .send('password=admin-integration-tests')
    .send('grant_type=password')
    .set('Accept', 'application/json');
  return 'Bearer ' + response.body.access_token;
};

const bookmarkData = (overrides) => ({
  name: 'Admin moderation integration test',
  location: LOCATION,
  tags: ['admin-moderation-it'],
  userId: OWNER_ID,
  public: true,
  ...overrides,
});

const TEST_USERS = [OWNER_ID, OTHER_ID];

const removeTestData = async () => {
  await Bookmark.deleteMany({ userId: { $in: TEST_USERS } });
  await Note.deleteMany({ userId: { $in: TEST_USERS } });
  await User.deleteMany({ userId: { $in: TEST_USERS } });
  const auditEntries = await AdminAuditEntry.find({
    ownerId: { $in: TEST_USERS },
  });
  await AdminDeletedSnapshot.deleteMany({
    _id: { $in: auditEntries.map((entry) => entry.snapshotId).filter(Boolean) },
  });
  await AdminAuditEntry.deleteMany({ ownerId: { $in: TEST_USERS } });
};

const noteData = (overrides) => ({
  title: 'Admin moderation integration test note',
  content: 'admin moderation integration test content',
  tags: ['admin-moderation-it'],
  userId: OWNER_ID,
  public: true,
  ...overrides,
});

describe('Admin moderation API', () => {
  let adminToken;
  let userToken;

  beforeAll(async () => {
    adminToken = await getAdminBearerToken();
    userToken = testUtils.getBearerToken(await testUtils.getAccessToken());
    await removeTestData();
  });

  afterAll(async () => {
    await removeTestData();
  });

  describe('admin bookmark API covers public bookmarks only', () => {
    let publicBookmark;
    let privateBookmark;

    beforeEach(async () => {
      await removeTestData();
      publicBookmark = await Bookmark.create(bookmarkData());
      privateBookmark = await Bookmark.create(
        bookmarkData({ userId: OTHER_ID, public: false })
      );
    });

    it('rejects reading a bookmark by id without the admin role', async () => {
      const response = await request(app)
        .get(`${ADMIN_API}/bookmarks/${privateBookmark._id}`)
        .set('Authorization', userToken);

      expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
      expect(response.body.name).toBeUndefined();
    });

    it('returns a public bookmark by id to an admin', async () => {
      const response = await request(app)
        .get(`${ADMIN_API}/bookmarks/${publicBookmark._id}`)
        .set('Authorization', adminToken);

      expect(response.statusCode).toEqual(HttpStatus.OK);
      expect(response.body._id).toEqual(String(publicBookmark._id));
    });

    it('answers 404 to an admin reading a private bookmark', async () => {
      const response = await request(app)
        .get(`${ADMIN_API}/bookmarks/${privateBookmark._id}`)
        .set('Authorization', adminToken);

      expect(response.statusCode).toEqual(HttpStatus.NOT_FOUND);
      expect(response.body.name).toBeUndefined();
    });

    it('lists only public bookmarks without the public parameter', async () => {
      const response = await request(app)
        .get(`${ADMIN_API}/bookmarks`)
        .query({ location: LOCATION })
        .set('Authorization', adminToken);

      expect(response.statusCode).toEqual(HttpStatus.OK);
      expect(response.body.map((bookmark) => bookmark._id)).toEqual([
        String(publicBookmark._id),
      ]);
    });

    it('answers 404 to an admin updating a private bookmark', async () => {
      const update = { ...privateBookmark.toObject(), name: 'changed' };
      const response = await request(app)
        .put(`${ADMIN_API}/bookmarks/${privateBookmark._id}`)
        .set('Authorization', adminToken)
        .send(update);

      expect(response.statusCode).toEqual(HttpStatus.NOT_FOUND);
      const stored = await Bookmark.findById(privateBookmark._id);
      expect(stored.name).toEqual(privateBookmark.name);
    });

    it('deletes by location only the public bookmarks', async () => {
      const response = await request(app)
        .delete(`${ADMIN_API}/bookmarks`)
        .query({ location: LOCATION })
        .set('Authorization', adminToken);

      expect(response.statusCode).toEqual(HttpStatus.NO_CONTENT);
      expect(await Bookmark.findById(publicBookmark._id)).toBeNull();
      expect(await Bookmark.findById(privateBookmark._id)).not.toBeNull();
    });

    it('deletes all bookmarks of a user by userId, private included', async () => {
      const response = await request(app)
        .delete(`${ADMIN_API}/bookmarks`)
        .query({ userId: OTHER_ID })
        .set('Authorization', adminToken);

      expect(response.statusCode).toEqual(HttpStatus.NO_CONTENT);
      expect(await Bookmark.findById(privateBookmark._id)).toBeNull();
    });
  });

  describe('new admin routes require the admin role', () => {
    const id = '5f1d7b3c9d3e2a0017a1b2c3';
    it.each([
      ['get', '/overview'],
      ['get', '/public-entries'],
      ['patch', `/bookmarks/${id}/unpublish`],
      ['patch', `/notes/${id}/unpublish`],
      ['delete', `/notes/${id}`],
      ['delete', `/bookmarks/${id}`],
      ['post', '/moderation/bulk'],
      ['get', '/audit-log'],
      ['post', `/audit-log/${id}/restore`],
    ])('%s %s answers 403 to a non-admin', async (method, path) => {
      const agent = request(app);
      const response = await agent[method](`${ADMIN_API}${path}`).set(
        'Authorization',
        userToken
      );

      expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
    });
  });

  describe('unpublish, delete and restore', () => {
    let publicBookmark;
    let publicNote;
    let privateNote;

    beforeEach(async () => {
      await removeTestData();
      await User.create({ userId: OWNER_ID, profile: { displayName: 'Owner' } });
      publicBookmark = await Bookmark.create(
        bookmarkData({ createdAt: new Date('2026-01-01') })
      );
      publicNote = await Note.create(noteData());
      privateNote = await Note.create(noteData({ public: false }));
      await User.create({
        userId: OTHER_ID,
        readLater: [String(publicBookmark._id)],
        history: [String(publicBookmark._id)],
        likes: [String(publicBookmark._id)],
      });
    });

    it('unpublishes a public note and logs it', async () => {
      const response = await request(app)
        .patch(`${ADMIN_API}/notes/${publicNote._id}/unpublish`)
        .set('Authorization', adminToken);

      expect(response.statusCode).toEqual(HttpStatus.OK);
      expect(response.body).toEqual({ type: 'note', id: String(publicNote._id) });
      const stored = await Note.findById(publicNote._id);
      expect(stored.public).toBe(false);
      expect(stored.content).toEqual(publicNote.content);
      expect(stored.updatedAt).toEqual(publicNote.updatedAt);

      const log = await AdminAuditEntry.findOne({
        targetId: String(publicNote._id),
      });
      expect(log).toMatchObject({
        action: 'unpublish',
        targetType: 'note',
        ownerId: OWNER_ID,
        summary: { title: publicNote.title },
      });
    });

    it('answers 404 for unpublishing or deleting a private note', async () => {
      const unpublish = await request(app)
        .patch(`${ADMIN_API}/notes/${privateNote._id}/unpublish`)
        .set('Authorization', adminToken);
      const remove = await request(app)
        .delete(`${ADMIN_API}/notes/${privateNote._id}`)
        .set('Authorization', adminToken);

      expect(unpublish.statusCode).toEqual(HttpStatus.NOT_FOUND);
      expect(unpublish.body.title).toBeUndefined();
      expect(remove.statusCode).toEqual(HttpStatus.NOT_FOUND);
      expect(await Note.findById(privateNote._id)).not.toBeNull();
      expect(
        await AdminAuditEntry.countDocuments({ ownerId: OWNER_ID })
      ).toBe(0);
    });

    it('deletes a bookmark, cleans other users and restores it with id and dates', async () => {
      const deleteResponse = await request(app)
        .delete(`${ADMIN_API}/bookmarks/${publicBookmark._id}`)
        .set('Authorization', adminToken);
      expect(deleteResponse.statusCode).toEqual(HttpStatus.NO_CONTENT);
      expect(await Bookmark.findById(publicBookmark._id)).toBeNull();

      const other = await User.findOne({ userId: OTHER_ID });
      expect(other.readLater).toEqual([]);
      expect(other.history).toEqual([]);
      expect(other.likes).toEqual([]);

      const log = await request(app)
        .get(`${ADMIN_API}/audit-log`)
        .query({ action: 'delete', type: 'bookmark' })
        .set('Authorization', adminToken);
      const deleteLog = log.body.find(
        (entry) => entry.targetId === String(publicBookmark._id)
      );
      expect(deleteLog.restorable).toBe(true);

      const restoreResponse = await request(app)
        .post(`${ADMIN_API}/audit-log/${deleteLog._id}/restore`)
        .set('Authorization', adminToken);
      expect(restoreResponse.statusCode).toEqual(HttpStatus.CREATED);
      expect(restoreResponse.body.restoredAsPrivate).toBe(false);

      const restored = await Bookmark.findById(publicBookmark._id);
      expect(restored.public).toBe(true);
      expect(restored.createdAt).toEqual(publicBookmark.createdAt);
      expect(restored.updatedAt).toEqual(publicBookmark.updatedAt);
      expect((await User.findOne({ userId: OTHER_ID })).readLater).toEqual([]);

      const again = await request(app)
        .post(`${ADMIN_API}/audit-log/${deleteLog._id}/restore`)
        .set('Authorization', adminToken);
      expect(again.statusCode).toEqual(HttpStatus.CONFLICT);
    });

    it('refuses to restore when the owner saved the URL again', async () => {
      await request(app)
        .delete(`${ADMIN_API}/bookmarks/${publicBookmark._id}`)
        .set('Authorization', adminToken);
      const newer = await Bookmark.create(bookmarkData({ public: false }));
      const deleteLog = await AdminAuditEntry.findOne({
        action: 'delete',
        targetId: String(publicBookmark._id),
      });

      const response = await request(app)
        .post(`${ADMIN_API}/audit-log/${deleteLog._id}/restore`)
        .set('Authorization', adminToken);

      expect(response.statusCode).toEqual(HttpStatus.CONFLICT);
      expect(await Bookmark.findById(publicBookmark._id)).toBeNull();
      expect(await Bookmark.findById(newer._id)).not.toBeNull();
    });

    it('restores as private when another user made the URL public', async () => {
      await request(app)
        .delete(`${ADMIN_API}/bookmarks/${publicBookmark._id}`)
        .set('Authorization', adminToken);
      await Bookmark.create(bookmarkData({ userId: OTHER_ID }));
      const deleteLog = await AdminAuditEntry.findOne({
        action: 'delete',
        targetId: String(publicBookmark._id),
      });

      const response = await request(app)
        .post(`${ADMIN_API}/audit-log/${deleteLog._id}/restore`)
        .set('Authorization', adminToken);

      expect(response.statusCode).toEqual(HttpStatus.CREATED);
      expect(response.body.restoredAsPrivate).toBe(true);
      expect((await Bookmark.findById(publicBookmark._id)).public).toBe(false);
    });

    it('bulk deletes and reports entries that are gone', async () => {
      const response = await request(app)
        .post(`${ADMIN_API}/moderation/bulk`)
        .set('Authorization', adminToken)
        .send({
          action: 'delete',
          entries: [
            { type: 'bookmark', id: String(publicBookmark._id) },
            { type: 'note', id: String(publicNote._id) },
            { type: 'note', id: String(privateNote._id) },
          ],
        });

      expect(response.statusCode).toEqual(HttpStatus.OK);
      expect(response.body.succeeded).toHaveLength(2);
      expect(response.body.failed).toEqual([
        { type: 'note', id: String(privateNote._id), reason: 'not found' },
      ]);
      expect(await Note.findById(privateNote._id)).not.toBeNull();
    });

    it('rejects a bulk request with more than 100 entries', async () => {
      const response = await request(app)
        .post(`${ADMIN_API}/moderation/bulk`)
        .set('Authorization', adminToken)
        .send({
          action: 'delete',
          entries: Array.from({ length: 101 }, () => ({
            type: 'note',
            id: String(publicNote._id),
          })),
        });

      expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
      expect(await Note.findById(publicNote._id)).not.toBeNull();
    });
  });

  describe('public entries and overview', () => {
    beforeEach(async () => {
      await removeTestData();
      await User.create({ userId: OWNER_ID, profile: { displayName: 'Owner' } });
    });

    it('lists only public entries of a user, with the owner name', async () => {
      await Bookmark.create(bookmarkData());
      await Note.create(noteData());
      await Note.create(noteData({ public: false, title: 'secret' }));

      const response = await request(app)
        .get(`${ADMIN_API}/public-entries`)
        .query({ userId: OWNER_ID })
        .set('Authorization', adminToken);

      expect(response.statusCode).toEqual(HttpStatus.OK);
      expect(response.body.map((entry) => entry.type).sort()).toEqual([
        'bookmark',
        'note',
      ]);
      expect(response.body.every((entry) => entry.ownerDisplayName === 'Owner'))
        .toBe(true);
      expect(JSON.stringify(response.body)).not.toContain('secret');
    });

    it('rejects an unknown type filter', async () => {
      const response = await request(app)
        .get(`${ADMIN_API}/public-entries`)
        .query({ type: 'snippet' })
        .set('Authorization', adminToken);

      expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
    });

    it('counts private entries only in the private totals', async () => {
      const before = await request(app)
        .get(`${ADMIN_API}/overview`)
        .set('Authorization', adminToken);
      await Note.create(noteData({ public: false, tags: ['admin-it-secret'] }));
      const after = await request(app)
        .get(`${ADMIN_API}/overview`)
        .set('Authorization', adminToken);

      expect(after.statusCode).toEqual(HttpStatus.OK);
      const [b, a] = [before.body.counts.last24h, after.body.counts.last24h];
      expect(a.notes.private).toBe(b.notes.private + 1);
      expect(a.notes.public).toBe(b.notes.public);
      expect(JSON.stringify(after.body)).not.toContain('admin-it-secret');
      expect(
        after.body.mostActiveUsers.some((user) => user.userId === OWNER_ID)
      ).toBe(false);
    });
  });
});
