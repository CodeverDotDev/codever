const mockQuery = (result) => {
  const query = {
    sort: jest.fn(() => query),
    skip: jest.fn(() => query),
    limit: jest.fn(() => query),
    select: jest.fn(() => query),
    lean: jest.fn(() => query),
    exec: jest.fn(() => Promise.resolve(result)),
  };
  return query;
};

jest.mock('../../model/admin-audit-entry', () => {
  const model = { find: jest.fn(), create: jest.fn() };
  model.AUDIT_ACTIONS = ['unpublish', 'delete', 'restore'];
  model.AUDIT_TARGET_TYPES = ['bookmark', 'note'];
  return model;
});
jest.mock('../../model/admin-deleted-snapshot', () => ({ find: jest.fn() }));

const AdminAuditEntry = require('../../model/admin-audit-entry');
const AdminDeletedSnapshot = require('../../model/admin-deleted-snapshot');
const ValidationError = require('../../error/validation.error');
const AuditService = require('./admin-audit.service');

const ADMIN = { id: 'admin-id', name: 'Admin' };

beforeEach(() => jest.clearAllMocks());

describe('recordAction', () => {
  test('records bookmark title, URL, owner and admin', async () => {
    await AuditService.recordAction({
      action: 'unpublish',
      targetType: 'bookmark',
      document: { _id: 'b1', name: 'Spam', location: 'https://x', userId: 'u1' },
      admin: ADMIN,
    });

    expect(AdminAuditEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'unpublish',
        targetType: 'bookmark',
        targetId: 'b1',
        ownerId: 'u1',
        adminId: 'admin-id',
        adminName: 'Admin',
        summary: { title: 'Spam', location: 'https://x' },
      })
    );
  });

  test('records the note title without a URL', async () => {
    await AuditService.recordAction({
      action: 'delete',
      targetType: 'note',
      document: { _id: 'n1', title: 'Note', userId: 'u1' },
      admin: ADMIN,
      snapshotId: 's1',
    });

    expect(AdminAuditEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: { title: 'Note', location: undefined },
        snapshotId: 's1',
      })
    );
  });
});

describe('listAuditEntries', () => {
  test('lists newest first with filters and pagination', async () => {
    const query = mockQuery([]);
    AdminAuditEntry.find.mockReturnValue(query);

    await AuditService.listAuditEntries({
      action: 'delete',
      type: 'note',
      page: 2,
      limit: 10,
    });

    expect(AdminAuditEntry.find).toHaveBeenCalledWith({
      action: 'delete',
      targetType: 'note',
    });
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(query.skip).toHaveBeenCalledWith(10);
    expect(query.limit).toHaveBeenCalledWith(10);
    expect(AdminDeletedSnapshot.find).not.toHaveBeenCalled();
  });

  test('flags only unrestored deletes whose copy still exists', async () => {
    AdminAuditEntry.find.mockReturnValue(
      mockQuery([
        { _id: 'a1', action: 'delete', snapshotId: 's1' },
        { _id: 'a2', action: 'delete', snapshotId: 's2' },
        { _id: 'a3', action: 'delete', snapshotId: 's3', restoredAt: new Date() },
        { _id: 'a4', action: 'unpublish' },
      ])
    );
    AdminDeletedSnapshot.find.mockReturnValue(mockQuery([{ _id: 's1' }]));

    const entries = await AuditService.listAuditEntries({ page: 1, limit: 10 });

    expect(AdminDeletedSnapshot.find).toHaveBeenCalledWith({
      _id: { $in: ['s1', 's2'] },
    });
    expect(entries.map((entry) => entry.restorable)).toEqual([
      true,
      false,
      false,
      false,
    ]);
  });

  test.each([
    [{ action: 'publish' }],
    [{ type: 'snippet' }],
  ])('rejects unknown filter values %p', async (filter) => {
    await expect(
      AuditService.listAuditEntries({ ...filter, page: 1, limit: 10 })
    ).rejects.toBeInstanceOf(ValidationError);
    expect(AdminAuditEntry.find).not.toHaveBeenCalled();
  });
});
