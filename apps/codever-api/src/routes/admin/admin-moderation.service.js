const mongoose = require('mongoose');

const Bookmark = require('../../model/bookmark');
const Note = require('../../model/note');
const User = require('../../model/user');
const AdminAuditEntry = require('../../model/admin-audit-entry');
const AdminDeletedSnapshot = require('../../model/admin-deleted-snapshot');

const NotFoundError = require('../../error/not-found.error');
const ValidationError = require('../../error/validation.error');
const AdminRestoreConflictError = require('../../error/admin-restore-conflict.error');
const PublicBookmarkExistingError = require('../../error/public-bookmark-existent.error');

const BookmarkInputValidator = require('../../common/validation/bookmark-input.validator');
const {
  cleanupDeletedBookmarks,
  cleanupDeletedNotes,
} = require('../../common/resource-cleanup.service');
const AdminAuditService = require('./admin-audit.service');

const MODELS = { bookmark: Bookmark, note: Note };
const CLEANUP = { bookmark: cleanupDeletedBookmarks, note: cleanupDeletedNotes };
const BULK_ACTIONS = ['unpublish', 'delete'];
const MAX_BULK_ENTRIES = 100;

const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

const notFound = (type, id) =>
  new NotFoundError(`Public ${type} NOT_FOUND with id: ${id}`);

/**
 * Returns the ObjectId for a valid id, or throws the same not-found error
 * as for a missing or private entry.
 */
const toObjectId = (type, id) => {
  if (typeof id !== 'string' || !OBJECT_ID_PATTERN.test(id)) {
    throw notFound(type, id);
  }
  return new mongoose.Types.ObjectId(id);
};

const getModel = (type) => {
  const model = MODELS[type];
  if (!model) {
    throw new ValidationError('Invalid entry type', [
      'type must be one of: bookmark, note',
    ]);
  }
  return model;
};

/**
 * Makes a public entry private. Private and unknown entries are reported as
 * not found. The owner's `updatedAt` is left unchanged.
 */
const unpublishEntry = async (type, id, admin) => {
  const Model = getModel(type);
  const _id = toObjectId(type, id);

  const document = await Model.findOneAndUpdate(
    { _id, public: true },
    { $set: { public: false } },
    { new: true, timestamps: false }
  )
    .lean()
    .exec();

  if (!document) {
    throw notFound(type, id);
  }

  await AdminAuditService.recordAction({
    action: 'unpublish',
    targetType: type,
    document,
    admin,
  });

  return { type, id: String(document._id) };
};

/**
 * Deletes a public entry, keeps a full copy for restore (90 days), removes
 * every reference to it and records the delete in the audit log.
 */
const deleteEntry = async (type, id, admin) => {
  const Model = getModel(type);
  const _id = toObjectId(type, id);

  // raw read, so fields hidden from API responses are kept in the copy
  const document = await Model.collection.findOne({ _id, public: true });
  if (!document) {
    throw notFound(type, id);
  }

  const snapshot = await AdminDeletedSnapshot.create({
    targetType: type,
    document,
  });

  const deleted = await Model.collection.deleteOne({ _id, public: true });
  if (deleted.deletedCount !== 1) {
    // deleted or unpublished meanwhile
    await AdminDeletedSnapshot.deleteOne({ _id: snapshot._id });
    throw notFound(type, id);
  }

  await CLEANUP[type]([_id]);

  await AdminAuditService.recordAction({
    action: 'delete',
    targetType: type,
    document,
    admin,
    snapshotId: snapshot._id,
  });
};

/**
 * Re-creates an entry deleted by an admin from its copy, with its original
 * id and dates. Share links, favorites and other users' references are not
 * brought back.
 */
const restoreEntry = async (auditEntryId, admin) => {
  const restoreNotFound = () =>
    new NotFoundError(
      `No restorable delete found for audit entry ${auditEntryId}`
    );
  if (
    typeof auditEntryId !== 'string' ||
    !OBJECT_ID_PATTERN.test(auditEntryId)
  ) {
    throw restoreNotFound();
  }

  const deleteEntryLog = await AdminAuditEntry.findById(auditEntryId);
  if (!deleteEntryLog || deleteEntryLog.action !== 'delete') {
    throw restoreNotFound();
  }
  if (deleteEntryLog.restoredAt) {
    throw new AdminRestoreConflictError('This delete was already restored');
  }

  const snapshot = deleteEntryLog.snapshotId
    ? await AdminDeletedSnapshot.findById(deleteEntryLog.snapshotId)
        .lean()
        .exec()
    : null;
  if (!snapshot) {
    // the copy expired after 90 days
    throw restoreNotFound();
  }

  const type = deleteEntryLog.targetType;
  const Model = getModel(type);
  const document = { ...snapshot.document };

  const ownerExists = await User.exists({ userId: document.userId });
  if (!ownerExists) {
    throw new AdminRestoreConflictError('The owner of the entry no longer exists');
  }
  const sameIdExists = await Model.collection.findOne(
    { _id: document._id },
    { projection: { _id: 1 } }
  );
  if (sameIdExists) {
    throw new AdminRestoreConflictError('An entry with the same id exists');
  }

  let restoredAsPrivate = false;
  if (type === 'bookmark') {
    const ownerHasLocation = await Bookmark.exists({
      userId: document.userId,
      location: document.location,
    });
    if (ownerHasLocation) {
      throw new AdminRestoreConflictError(
        'The owner has saved a bookmark with the same URL again'
      );
    }
    try {
      await BookmarkInputValidator.verifyPublicBookmarkExistenceOnCreation(
        document
      );
    } catch (error) {
      if (!(error instanceof PublicBookmarkExistingError)) {
        throw error;
      }
      document.public = false;
      restoredAsPrivate = true;
    }
  }

  await Model.collection.insertOne(document);
  await AdminDeletedSnapshot.deleteOne({ _id: snapshot._id });

  const restoreLog = await AdminAuditService.recordAction({
    action: 'restore',
    targetType: type,
    document,
    admin,
    restoredAsPrivate,
  });
  await AdminAuditEntry.updateOne(
    { _id: deleteEntryLog._id },
    { $set: { restoredAt: new Date(), restoreEntryId: restoreLog._id } }
  );

  const restored = await Model.findById(document._id).lean().exec();

  return { type, restoredAsPrivate, entry: restored };
};

const validateBulkRequest = (action, entries) => {
  const errors = [];
  if (!BULK_ACTIONS.includes(action)) {
    errors.push('action must be one of: unpublish, delete');
  }
  if (!Array.isArray(entries) || entries.length === 0) {
    errors.push('entries must list at least one entry');
  } else if (entries.length > MAX_BULK_ENTRIES) {
    errors.push(`entries must not list more than ${MAX_BULK_ENTRIES} entries`);
  } else if (
    entries.some(
      (entry) =>
        !entry || !MODELS[entry.type] || typeof entry.id !== 'string'
    )
  ) {
    errors.push('each entry needs a type (bookmark or note) and an id');
  }

  if (errors.length > 0) {
    throw new ValidationError('Invalid bulk moderation request', errors);
  }
};

/**
 * Unpublishes or deletes several entries. Each entry is processed on its own;
 * a failing entry does not stop the others.
 */
const bulkModerate = async (action, entries, admin) => {
  validateBulkRequest(action, entries);

  const succeeded = [];
  const failed = [];
  for (const { type, id } of entries) {
    try {
      if (action === 'unpublish') {
        await unpublishEntry(type, id, admin);
      } else {
        await deleteEntry(type, id, admin);
      }
      succeeded.push({ type, id });
    } catch (error) {
      failed.push({
        type,
        id,
        reason: error instanceof NotFoundError ? 'not found' : 'error',
      });
    }
  }

  return { succeeded, failed };
};

module.exports = {
  unpublishEntry,
  deleteEntry,
  restoreEntry,
  bulkModerate,
  MAX_BULK_ENTRIES,
};
