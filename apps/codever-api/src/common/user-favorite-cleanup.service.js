const User = require('../model/user');

const FAVORITE_FIELDS = {
  bookmark: 'favorites',
  note: 'favoriteNotes',
};

const removeFavoriteReferences = async (resourceType, resourceIds) => {
  const favoriteField = FAVORITE_FIELDS[resourceType];
  if (!favoriteField) {
    throw new TypeError(`Unsupported favorite resource type: ${resourceType}`);
  }

  const ids = [...new Set(resourceIds.map((resourceId) => String(resourceId)))];
  if (ids.length === 0) {
    return;
  }

  await User.updateMany(
    { [favoriteField]: { $in: ids } },
    { $pull: { [favoriteField]: { $in: ids } } }
  );
};

module.exports = {
  removeBookmarkFavoriteReferences: (bookmarkIds) =>
    removeFavoriteReferences('bookmark', bookmarkIds),
  removeNoteFavoriteReferences: (noteIds) =>
    removeFavoriteReferences('note', noteIds),
};
