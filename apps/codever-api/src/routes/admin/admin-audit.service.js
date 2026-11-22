const AdminAuditEntry = require('../../model/admin-audit-entry');
const AdminDeletedSnapshot = require('../../model/admin-deleted-snapshot');
const ValidationError = require('../../error/validation.error');

const { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } = AdminAuditEntry;

/**
 * Builds the summary kept in the audit log: what the administrator saw.
 */
const toSummary = (targetType, document) => ({
  title: targetType === 'bookmark' ? document.name : document.title,
  location: targetType === 'bookmark' ? document.location : undefined,
});

/**
 * Records one admin action.
 *
 * @param admin {{id: string, name: string}}
 */
const recordAction = async ({
  action,
  targetType,
  document,
  admin,
  snapshotId,
  restoredAsPrivate,
}) => {
  return AdminAuditEntry.create({
    action,
    targetType,
    targetId: String(document._id),
    ownerId: document.userId,
    adminId: admin.id,
    adminName: admin.name,
    summary: toSummary(targetType, document),
    snapshotId,
    restoredAsPrivate,
  });
};

const validateFilter = (name, value, allowed) => {
  if (value !== undefined && value !== '' && !allowed.includes(value)) {
    throw new ValidationError(`Invalid ${name} filter`, [
      `${name} must be one of: ${allowed.join(', ')}`,
    ]);
  }
};

/**
 * Lists audit entries newest first. Each entry gets `restorable: true` when
 * it is a delete that was not restored yet and whose copy still exists.
 */
const listAuditEntries = async ({ action, type, page, limit }) => {
  validateFilter('action', action, AUDIT_ACTIONS);
  validateFilter('type', type, AUDIT_TARGET_TYPES);

  const filter = {};
  if (action) {
    filter.action = action;
  }
  if (type) {
    filter.targetType = type;
  }

  const entries = await AdminAuditEntry.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
    .exec();

  const snapshotIds = entries
    .filter((entry) => entry.action === 'delete' && !entry.restoredAt)
    .map((entry) => entry.snapshotId)
    .filter(Boolean);
  const existingSnapshots = snapshotIds.length
    ? await AdminDeletedSnapshot.find({ _id: { $in: snapshotIds } })
        .select('_id')
        .lean()
        .exec()
    : [];
  const existingIds = new Set(existingSnapshots.map((s) => String(s._id)));

  return entries.map((entry) => ({
    ...entry,
    restorable:
      entry.action === 'delete' &&
      !entry.restoredAt &&
      Boolean(entry.snapshotId) &&
      existingIds.has(String(entry.snapshotId)),
  }));
};

module.exports = {
  recordAction,
  listAuditEntries,
  toSummary,
};
