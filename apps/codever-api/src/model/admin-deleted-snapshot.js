const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SNAPSHOT_RETENTION_DAYS = 90;
const SNAPSHOT_RETENTION_SECONDS = SNAPSHOT_RETENTION_DAYS * 24 * 60 * 60;

/**
 * Full copy of a bookmark or note deleted by an administrator, so the delete
 * can be restored. MongoDB removes it 90 days after the delete (TTL index).
 */
const adminDeletedSnapshotSchema = new Schema(
  {
    targetType: { type: String, enum: ['bookmark', 'note'], required: true },
    // the raw stored document, including fields hidden from API responses
    document: { type: Schema.Types.Mixed, required: true },
    deletedAt: { type: Date, required: true, default: Date.now },
    __v: { type: Number, select: false },
  },
  { collection: 'admin_deleted_snapshots', minimize: false }
);

adminDeletedSnapshotSchema.index(
  { deletedAt: 1 },
  { expireAfterSeconds: SNAPSHOT_RETENTION_SECONDS }
);

module.exports = mongoose.model(
  'AdminDeletedSnapshot',
  adminDeletedSnapshotSchema
);
module.exports.SNAPSHOT_RETENTION_DAYS = SNAPSHOT_RETENTION_DAYS;
