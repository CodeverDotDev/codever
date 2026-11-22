const AdminAuditEntry = require('./admin-audit-entry');
const AdminDeletedSnapshot = require('./admin-deleted-snapshot');

describe('AdminDeletedSnapshot schema', () => {
  test('expires snapshots 90 days after the delete', () => {
    const ttlIndex = AdminDeletedSnapshot.schema
      .indexes()
      .find(([fields]) => fields.deletedAt === 1);

    expect(ttlIndex[1]).toMatchObject({
      expireAfterSeconds: 90 * 24 * 60 * 60,
    });
    expect(AdminDeletedSnapshot.SNAPSHOT_RETENTION_DAYS).toBe(90);
  });

  test('uses its own collection', () => {
    expect(AdminDeletedSnapshot.collection.collectionName).toBe(
      'admin_deleted_snapshots'
    );
  });
});

describe('AdminAuditEntry schema', () => {
  test('has no expiry and indexes for newest-first and filtered listing', () => {
    const indexes = AdminAuditEntry.schema.indexes();

    expect(indexes.some(([, options]) => options.expireAfterSeconds)).toBe(
      false
    );
    expect(indexes.map(([fields]) => fields)).toEqual(
      expect.arrayContaining([
        { createdAt: -1 },
        { action: 1, targetType: 1, createdAt: -1 },
      ])
    );
  });

  test('limits actions and target types', () => {
    expect(AdminAuditEntry.schema.path('action').enumValues).toEqual([
      'unpublish',
      'delete',
      'restore',
    ]);
    expect(AdminAuditEntry.schema.path('targetType').enumValues).toEqual([
      'bookmark',
      'note',
    ]);
  });
});
