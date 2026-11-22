const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AUDIT_ACTIONS = ['unpublish', 'delete', 'restore'];
const AUDIT_TARGET_TYPES = ['bookmark', 'note'];

/**
 * One moderation action done by an administrator. Kept permanently; only a
 * delete entry is changed later, to mark it as restored.
 */
const adminAuditEntrySchema = new Schema(
  {
    action: { type: String, enum: AUDIT_ACTIONS, required: true },
    targetType: { type: String, enum: AUDIT_TARGET_TYPES, required: true },
    targetId: { type: String, required: true },
    ownerId: String,
    adminId: { type: String, required: true },
    adminName: String,
    summary: {
      title: String,
      location: String,
    },
    // delete entries only
    snapshotId: { type: Schema.Types.ObjectId },
    restoredAt: Date,
    restoreEntryId: { type: Schema.Types.ObjectId },
    // restore entries only
    restoredAsPrivate: Boolean,
    __v: { type: Number, select: false },
  },
  { timestamps: true, collection: 'admin_audit_entries' }
);

adminAuditEntrySchema.index({ createdAt: -1 });
adminAuditEntrySchema.index({ action: 1, targetType: 1, createdAt: -1 });

module.exports = mongoose.model('AdminAuditEntry', adminAuditEntrySchema);
module.exports.AUDIT_ACTIONS = AUDIT_ACTIONS;
module.exports.AUDIT_TARGET_TYPES = AUDIT_TARGET_TYPES;
