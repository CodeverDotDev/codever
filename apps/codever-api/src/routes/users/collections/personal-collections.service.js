const Collection = require('../../../model/collection');
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

  return collection;
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

