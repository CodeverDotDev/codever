const User = require('../model/user');
const ShareLinkService = require('../routes/users/share-link.service');
const {
  removeBookmarkFavoriteReferences,
  removeNoteFavoriteReferences,
} = require('./user-favorite-cleanup.service');

/**
 * Removes everything that points to deleted resources: their share links,
 * favorites, and the entries in users' pinned, history (and for bookmarks
 * likes and read-later) lists. Used by both the owner's and the admin delete
 * so they leave the same state behind.
 *
 * When ownerUserId is given, only that owner's share links are revoked (the
 * owner delete path); otherwise all links of the resources are revoked.
 */
const revokeLinks = async (resourceType, ids, ownerUserId) => {
  if (ownerUserId) {
    await ShareLinkService.revokeResourceLinks(ownerUserId, resourceType, ids);
  } else {
    await ShareLinkService.revokeDeletedResourceLinks(resourceType, ids);
  }
};

const toIdStrings = (ids) => [...new Set((ids || []).map((id) => String(id)))];

const cleanupDeletedBookmarks = async (bookmarkIds, ownerUserId) => {
  const ids = toIdStrings(bookmarkIds);
  if (ids.length === 0) {
    return;
  }
  await revokeLinks('bookmark', ids, ownerUserId);
  await removeBookmarkFavoriteReferences(ids);
  await User.updateMany(
    {},
    {
      $pull: {
        readLater: { $in: ids },
        likes: { $in: ids },
        pinned: { id: { $in: ids }, type: 'bookmark' },
        history: { $in: ids },
      },
    }
  );
};

const cleanupDeletedNotes = async (noteIds, ownerUserId) => {
  const ids = toIdStrings(noteIds);
  if (ids.length === 0) {
    return;
  }
  await revokeLinks('note', ids, ownerUserId);
  await removeNoteFavoriteReferences(ids);
  await User.updateMany(
    {},
    {
      $pull: {
        pinned: { id: { $in: ids }, type: 'note' },
        history: { $in: ids },
      },
    }
  );
};

module.exports = {
  cleanupDeletedBookmarks,
  cleanupDeletedNotes,
};
