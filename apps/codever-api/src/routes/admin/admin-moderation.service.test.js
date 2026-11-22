const leanExec = (result) => ({
  lean: () => ({ exec: () => Promise.resolve(result) }),
});

jest.mock('../../model/bookmark', () => ({
  findOneAndUpdate: jest.fn(),
  findById: jest.fn(),
  exists: jest.fn(),
  collection: {
    findOne: jest.fn(),
    deleteOne: jest.fn(),
    insertOne: jest.fn(),
  },
}));
jest.mock('../../model/note', () => ({
  findOneAndUpdate: jest.fn(),
  findById: jest.fn(),
  exists: jest.fn(),
  collection: {
    findOne: jest.fn(),
    deleteOne: jest.fn(),
    insertOne: jest.fn(),
  },
}));
jest.mock('../../model/user', () => ({ exists: jest.fn() }));
jest.mock('../../model/admin-audit-entry', () => ({
  findById: jest.fn(),
  updateOne: jest.fn(),
}));
jest.mock('../../model/admin-deleted-snapshot', () => ({
  create: jest.fn(),
  findById: jest.fn(),
  deleteOne: jest.fn(),
}));
jest.mock('../../common/resource-cleanup.service', () => ({
  cleanupDeletedBookmarks: jest.fn(),
  cleanupDeletedNotes: jest.fn(),
}));
jest.mock('../../common/validation/bookmark-input.validator', () => ({
  verifyPublicBookmarkExistenceOnCreation: jest.fn(),
}));
jest.mock('./admin-audit.service', () => ({ recordAction: jest.fn() }));

const mongoose = require('mongoose');
const Bookmark = require('../../model/bookmark');
const Note = require('../../model/note');
const User = require('../../model/user');
const AdminAuditEntry = require('../../model/admin-audit-entry');
const AdminDeletedSnapshot = require('../../model/admin-deleted-snapshot');
const Cleanup = require('../../common/resource-cleanup.service');
const BookmarkInputValidator = require('../../common/validation/bookmark-input.validator');
const AdminAuditService = require('./admin-audit.service');
const NotFoundError = require('../../error/not-found.error');
const ValidationError = require('../../error/validation.error');
const AdminRestoreConflictError = require('../../error/admin-restore-conflict.error');
const PublicBookmarkExistingError = require('../../error/public-bookmark-existent.error');

const service = require('./admin-moderation.service');

const ADMIN = { id: 'admin-id', name: 'Admin' };
const BOOKMARK_ID = '5f1d7b3c9d3e2a0017a1b2c3';
const NOTE_ID = '5f1d7b3c9d3e2a0017a1b2c4';
const AUDIT_ID = '5f1d7b3c9d3e2a0017a1b2c5';
const SNAPSHOT_ID = '5f1d7b3c9d3e2a0017a1b2c6';

beforeEach(() => {
  jest.clearAllMocks();
  AdminAuditService.recordAction.mockResolvedValue({ _id: 'restore-log' });
});

describe('unpublishEntry', () => {
  test('makes a public note private without touching updatedAt', async () => {
    Note.findOneAndUpdate.mockReturnValue(
      leanExec({ _id: NOTE_ID, title: 'Spam', userId: 'u1' })
    );

    const result = await service.unpublishEntry('note', NOTE_ID, ADMIN);

    const [filter, update, options] = Note.findOneAndUpdate.mock.calls[0];
    expect(String(filter._id)).toBe(NOTE_ID);
    expect(filter.public).toBe(true);
    expect(update).toEqual({ $set: { public: false } });
    expect(options).toMatchObject({ timestamps: false });
    expect(result).toEqual({ type: 'note', id: NOTE_ID });
    expect(AdminAuditService.recordAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'unpublish', targetType: 'note' })
    );
  });

  test('reports a private or unknown entry as not found, without audit', async () => {
    Bookmark.findOneAndUpdate.mockReturnValue(leanExec(null));

    await expect(
      service.unpublishEntry('bookmark', BOOKMARK_ID, ADMIN)
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(AdminAuditService.recordAction).not.toHaveBeenCalled();
  });

  test('reports a malformed id as not found', async () => {
    await expect(
      service.unpublishEntry('bookmark', 'not-an-id', ADMIN)
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(Bookmark.findOneAndUpdate).not.toHaveBeenCalled();
  });
});

describe('deleteEntry', () => {
  const stored = {
    _id: new mongoose.Types.ObjectId(BOOKMARK_ID),
    name: 'Spam',
    location: 'https://spam',
    userId: 'u1',
    public: true,
  };

  test('keeps a copy, deletes, cleans up and records the delete', async () => {
    Bookmark.collection.findOne.mockResolvedValue(stored);
    AdminDeletedSnapshot.create.mockResolvedValue({ _id: SNAPSHOT_ID });
    Bookmark.collection.deleteOne.mockResolvedValue({ deletedCount: 1 });

    await service.deleteEntry('bookmark', BOOKMARK_ID, ADMIN);

    expect(Bookmark.collection.findOne.mock.calls[0][0].public).toBe(true);
    expect(AdminDeletedSnapshot.create).toHaveBeenCalledWith({
      targetType: 'bookmark',
      document: stored,
    });
    expect(Cleanup.cleanupDeletedBookmarks).toHaveBeenCalledWith([
      stored._id,
    ]);
    expect(AdminAuditService.recordAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'delete',
        targetType: 'bookmark',
        snapshotId: SNAPSHOT_ID,
      })
    );
  });

  test('reports a private entry as not found and changes nothing', async () => {
    Note.collection.findOne.mockResolvedValue(null);

    await expect(
      service.deleteEntry('note', NOTE_ID, ADMIN)
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(AdminDeletedSnapshot.create).not.toHaveBeenCalled();
    expect(Note.collection.deleteOne).not.toHaveBeenCalled();
  });

  test('drops the copy when the entry disappeared meanwhile', async () => {
    Bookmark.collection.findOne.mockResolvedValue(stored);
    AdminDeletedSnapshot.create.mockResolvedValue({ _id: SNAPSHOT_ID });
    Bookmark.collection.deleteOne.mockResolvedValue({ deletedCount: 0 });

    await expect(
      service.deleteEntry('bookmark', BOOKMARK_ID, ADMIN)
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(AdminDeletedSnapshot.deleteOne).toHaveBeenCalledWith({
      _id: SNAPSHOT_ID,
    });
    expect(Cleanup.cleanupDeletedBookmarks).not.toHaveBeenCalled();
    expect(AdminAuditService.recordAction).not.toHaveBeenCalled();
  });
});

describe('restoreEntry', () => {
  const deletedBookmark = () => ({
    _id: new mongoose.Types.ObjectId(BOOKMARK_ID),
    name: 'Mistake',
    location: 'https://ok',
    userId: 'u1',
    public: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-02-01'),
  });

  const givenDeleteLog = (overrides = {}) => {
    AdminAuditEntry.findById.mockResolvedValue({
      _id: AUDIT_ID,
      action: 'delete',
      targetType: 'bookmark',
      snapshotId: SNAPSHOT_ID,
      ...overrides,
    });
  };
  const givenSnapshot = (document = deletedBookmark()) => {
    AdminDeletedSnapshot.findById.mockReturnValue(
      leanExec({ _id: SNAPSHOT_ID, document })
    );
  };
  const givenNoConflicts = () => {
    User.exists.mockResolvedValue({ _id: 'user' });
    Bookmark.collection.findOne.mockResolvedValue(null);
    Bookmark.exists.mockResolvedValue(null);
    BookmarkInputValidator.verifyPublicBookmarkExistenceOnCreation.mockResolvedValue(
      1
    );
    Bookmark.findById.mockReturnValue(leanExec({ _id: BOOKMARK_ID }));
  };

  test('re-inserts the copy with its id and dates and marks the delete', async () => {
    givenDeleteLog();
    givenSnapshot();
    givenNoConflicts();

    const result = await service.restoreEntry(AUDIT_ID, ADMIN);

    const inserted = Bookmark.collection.insertOne.mock.calls[0][0];
    expect(inserted).toEqual(deletedBookmark());
    expect(AdminDeletedSnapshot.deleteOne).toHaveBeenCalledWith({
      _id: SNAPSHOT_ID,
    });
    expect(AdminAuditService.recordAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'restore', restoredAsPrivate: false })
    );
    expect(AdminAuditEntry.updateOne).toHaveBeenCalledWith(
      { _id: AUDIT_ID },
      {
        $set: {
          restoredAt: expect.any(Date),
          restoreEntryId: 'restore-log',
        },
      }
    );
    expect(result.restoredAsPrivate).toBe(false);
  });

  test('restores as private when the URL is public elsewhere', async () => {
    givenDeleteLog();
    givenSnapshot();
    givenNoConflicts();
    BookmarkInputValidator.verifyPublicBookmarkExistenceOnCreation.mockRejectedValue(
      new PublicBookmarkExistingError('exists')
    );

    const result = await service.restoreEntry(AUDIT_ID, ADMIN);

    expect(Bookmark.collection.insertOne.mock.calls[0][0].public).toBe(false);
    expect(result.restoredAsPrivate).toBe(true);
  });

  test.each([
    ['already restored', () => givenDeleteLog({ restoredAt: new Date() })],
    [
      'owner gone',
      () => {
        givenDeleteLog();
        givenSnapshot();
        givenNoConflicts();
        User.exists.mockResolvedValue(null);
      },
    ],
    [
      'same id exists',
      () => {
        givenDeleteLog();
        givenSnapshot();
        givenNoConflicts();
        Bookmark.collection.findOne.mockResolvedValue({ _id: BOOKMARK_ID });
      },
    ],
    [
      'owner saved the URL again',
      () => {
        givenDeleteLog();
        givenSnapshot();
        givenNoConflicts();
        Bookmark.exists.mockResolvedValue({ _id: 'newer' });
      },
    ],
  ])('answers a conflict when %s', async (name, given) => {
    given();

    await expect(service.restoreEntry(AUDIT_ID, ADMIN)).rejects.toBeInstanceOf(
      AdminRestoreConflictError
    );
    expect(Bookmark.collection.insertOne).not.toHaveBeenCalled();
  });

  test.each([
    ['unknown audit entry', () => AdminAuditEntry.findById.mockResolvedValue(null)],
    ['not a delete', () => givenDeleteLog({ action: 'unpublish' })],
    [
      'copy expired',
      () => {
        givenDeleteLog();
        AdminDeletedSnapshot.findById.mockReturnValue(leanExec(null));
      },
    ],
  ])('answers not found for %s', async (name, given) => {
    given();

    await expect(service.restoreEntry(AUDIT_ID, ADMIN)).rejects.toBeInstanceOf(
      NotFoundError
    );
    expect(Bookmark.collection.insertOne).not.toHaveBeenCalled();
  });
});

describe('bulkModerate', () => {
  test.each([
    ['unknown action', 'publish', [{ type: 'note', id: NOTE_ID }]],
    ['missing action', undefined, [{ type: 'note', id: NOTE_ID }]],
    ['empty list', 'delete', []],
    [
      'more than 100 entries',
      'delete',
      Array.from({ length: 101 }, () => ({ type: 'note', id: NOTE_ID })),
    ],
    ['unknown type', 'delete', [{ type: 'snippet', id: NOTE_ID }]],
  ])('rejects %s before changing anything', async (name, action, entries) => {
    await expect(
      service.bulkModerate(action, entries, ADMIN)
    ).rejects.toBeInstanceOf(ValidationError);
    expect(Note.findOneAndUpdate).not.toHaveBeenCalled();
    expect(Note.collection.findOne).not.toHaveBeenCalled();
  });

  test('processes each entry and reports partial failures', async () => {
    Note.findOneAndUpdate
      .mockReturnValueOnce(leanExec({ _id: NOTE_ID, title: 'a' }))
      .mockReturnValueOnce(leanExec(null));

    const result = await service.bulkModerate(
      'unpublish',
      [
        { type: 'note', id: NOTE_ID },
        { type: 'note', id: AUDIT_ID },
      ],
      ADMIN
    );

    expect(result).toEqual({
      succeeded: [{ type: 'note', id: NOTE_ID }],
      failed: [{ type: 'note', id: AUDIT_ID, reason: 'not found' }],
    });
  });
});
