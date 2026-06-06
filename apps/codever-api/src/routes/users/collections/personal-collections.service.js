const Collection = require('../../../model/collection');
const Bookmark = require('../../../model/bookmark');
const Note = require('../../../model/note');
const NotFoundError = require('../../../error/not-found.error');
const ValidationError = require('../../../error/validation.error');

let createCollection = async (userId, collectionData) => {
  if (!collectionData.name || collectionData.name.trim().length === 0) {
    throw new ValidationError('Collection name is required');
  }

  const collection = new Collection({
    name: collectionData.name.trim(),
    description: collectionData.description,
    color: collectionData.color,
    userId: userId,
    public: false, // Phase 1: always private
    items: [],
  });

  return await collection.save();
};

let getUserCollections = async (userId, searchText, page, limit) => {
  const filter = { userId };
  if (searchText) {
    filter.name = { $regex: searchText, $options: 'i' };
  }

  const collections = await Collection.find(filter)
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return collections;
};

let getCollectionById = async (userId, collectionId) => {
  const collection = await Collection.findOne({
    _id: collectionId,
    userId: userId,
  });

  if (!collection) {
    throw new NotFoundError(
      `Collection NOT_FOUND for userId: ${userId} AND id: ${collectionId}`
    );
  }

  // Update lastVisitedAt
  collection.lastVisitedAt = new Date();
  await collection.save();

  // Populate items in bulk — two queries instead of N
  const bookmarkIds = collection.items
    .filter((i) => i.resourceType === 'bookmark')
    .map((i) => i.resourceId);
  const noteIds = collection.items
    .filter((i) => i.resourceType === 'note')
    .map((i) => i.resourceId);

  const [bookmarks, notes] = await Promise.all([
    bookmarkIds.length > 0
      ? Bookmark.find({
          _id: { $in: bookmarkIds },
          $or: [{ userId }, { public: true }],
        }).lean()
      : Promise.resolve([]),
    noteIds.length > 0
      ? Note.find({
          _id: { $in: noteIds },
          $or: [{ userId }, { public: true }],
        }).lean()
      : Promise.resolve([]),
  ]);

  // Build a lookup map for O(1) access
  const resourceMap = new Map();
  bookmarks.forEach((b) => resourceMap.set(b._id.toString(), b));
  notes.forEach((n) => resourceMap.set(n._id.toString(), n));

  // Return collection with populated items in their original order
  const collectionObj = collection.toObject();
  collectionObj.populatedItems = collectionObj.items
    .map((item) => {
      const resource = resourceMap.get(item.resourceId.toString());
      if (!resource) return null; // item was deleted
      return {
        ...item,
        resource,
      };
    })
    .filter(Boolean);

  return collectionObj;
};

let updateCollection = async (userId, collectionId, collectionData) => {
  if (!collectionData.name || collectionData.name.trim().length === 0) {
    throw new ValidationError('Collection name is required');
  }

  const updatedCollection = await Collection.findOneAndUpdate(
    { _id: collectionId, userId: userId },
    {
      $set: {
        name: collectionData.name.trim(),
        description: collectionData.description,
        color: collectionData.color,
      },
    },
    { new: true }
  );

  if (!updatedCollection) {
    throw new NotFoundError(
      `Collection NOT_FOUND with id: ${collectionId}`
    );
  }

  return updatedCollection;
};

let deleteCollectionById = async (userId, collectionId) => {
  const collection = await Collection.findOneAndRemove({
    _id: collectionId,
    userId: userId,
  });

  if (!collection) {
    throw new NotFoundError(
      `Collection NOT_FOUND with id: ${collectionId}`
    );
  }
};

let addItemToCollection = async (userId, collectionId, resourceId, resourceType) => {
  if (!['bookmark', 'note'].includes(resourceType)) {
    throw new ValidationError(
      `Invalid resourceType: ${resourceType}. Must be 'bookmark' or 'note'.`
    );
  }

  const collection = await Collection.findOne({
    _id: collectionId,
    userId: userId,
  });

  if (!collection) {
    throw new NotFoundError(
      `Collection NOT_FOUND with id: ${collectionId}`
    );
  }

  // Prevent duplicates
  const alreadyExists = collection.items.some(
    (item) =>
      item.resourceId.toString() === resourceId &&
      item.resourceType === resourceType
  );
  if (alreadyExists) {
    return collection; // Silently skip — item already in collection
  }

  collection.items.push({ resourceId, resourceType, addedAt: new Date() });
  return await collection.save();
};

let removeItemFromCollection = async (userId, collectionId, resourceId) => {
  const updatedCollection = await Collection.findOneAndUpdate(
    { _id: collectionId, userId: userId },
    { $pull: { items: { resourceId: resourceId } } },
    { new: true }
  );

  if (!updatedCollection) {
    throw new NotFoundError(
      `Collection NOT_FOUND with id: ${collectionId}`
    );
  }

  return updatedCollection;
};

/**
 * Get all collections that contain a specific resource (for checkbox state in dialog)
 */
let getCollectionsContainingResource = async (userId, resourceId) => {
  const collections = await Collection.find({
    userId: userId,
    'items.resourceId': resourceId,
  }).select('_id name color');

  return collections;
};

module.exports = {
  createCollection,
  getUserCollections,
  getCollectionById,
  updateCollection,
  deleteCollectionById,
  addItemToCollection,
  removeItemFromCollection,
  getCollectionsContainingResource,
};

