const crypto = require('crypto');
const mongoose = require('mongoose');
const PaginationQueryParamsHelper = require('../../common/pagination-query-params-helper');
const constants = require('../../common/constants');

const Bookmark = require('../../model/bookmark');
const Note = require('../../model/note');
const ShareLink = require('../../model/share-link');
const NotFoundError = require('../../error/not-found.error');
const ValidationError = require('../../error/validation.error');
const ShareLinkConflictError = require('../../error/share-link-conflict.error');

const resourceModels = {
  bookmark: Bookmark,
  note: Note,
};
const validObjectId = /^[a-f\d]{24}$/i;
const validShareToken = /^[A-Za-z0-9_-]{43}$/;
const MAX_CREATE_ATTEMPTS = 3;

const validateResourceType = (resourceType) => {
  if (!Object.prototype.hasOwnProperty.call(resourceModels, resourceType)) {
    throw new ValidationError('Unsupported share-link resource type');
  }
};

const validateObjectId = (value, fieldName) => {
  if (typeof value !== 'string' || !validObjectId.test(value)) {
    throw new ValidationError(`Invalid ${fieldName}`);
  }
};

const toShareLinkResponse = (shareLink) => ({
  active: true,
  shareLinkId: shareLink._id,
  resourceType: shareLink.resourceType,
  resourceId: shareLink.resourceId,
  createdAt: shareLink.createdAt,
  token: shareLink.token,
});

const findOwnedResource = async (ownerUserId, resourceType, resourceId) => {
  const Resource = resourceModels[resourceType];
  const resource = await Resource.findOne({
    _id: resourceId,
    userId: ownerUserId,
  });

  if (!resource) {
    throw new NotFoundError('Resource not found');
  }
  return resource;
};

const findActiveShareLink = (ownerUserId, resourceType, resourceId) =>
  ShareLink.findOne({
    ownerUserId,
    resourceType,
    resourceId,
    active: true,
  }).select('+token');

const isDuplicateFor = (error, field) =>
  error &&
  error.code === 11000 &&
  (error.keyPattern && error.keyPattern[field] === 1
    ? true
    : error.message && error.message.includes(`${field}_1`));

const getShareLinkStatus = async (ownerUserId, resourceType, resourceId) => {
  validateResourceType(resourceType);
  validateObjectId(resourceId, 'resource id');
  await findOwnedResource(ownerUserId, resourceType, resourceId);

  const shareLink = await findActiveShareLink(
    ownerUserId,
    resourceType,
    resourceId
  );
  return shareLink ? toShareLinkResponse(shareLink) : { active: false };
};

const createShareLink = async (ownerUserId, resourceType, resourceId) => {
  validateResourceType(resourceType);
  validateObjectId(resourceId, 'resource id');
  await findOwnedResource(ownerUserId, resourceType, resourceId);

  for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
    const existing = await findActiveShareLink(
      ownerUserId,
      resourceType,
      resourceId
    );
    if (existing) {
      return { ...toShareLinkResponse(existing), created: false };
    }

    const shareLink = new ShareLink({
      ownerUserId,
      resourceType,
      resourceId: new mongoose.Types.ObjectId(resourceId),
      token: crypto.randomBytes(32).toString('base64url'),
      active: true,
    });

    try {
      const savedShareLink = await shareLink.save();
      return { ...toShareLinkResponse(savedShareLink), created: true };
    } catch (error) {
      if (isDuplicateFor(error, 'token')) {
        continue;
      }
      if (isDuplicateFor(error, 'resourceType')) {
        const concurrentLink = await findActiveShareLink(
          ownerUserId,
          resourceType,
          resourceId
        );
        if (concurrentLink) {
          return { ...toShareLinkResponse(concurrentLink), created: false };
        }
        continue;
      }
      throw error;
    }
  }

  throw new ShareLinkConflictError('Unable to create a sharing link');
};

const revokeShareLink = async (ownerUserId, shareLinkId) => {
  validateObjectId(shareLinkId, 'share link id');

  const existing = await ShareLink.findOne({
    _id: shareLinkId,
    ownerUserId,
  });
  if (!existing) {
    throw new NotFoundError('Share link not found');
  }
  if (!existing.active) {
    return;
  }

  const revoked = await ShareLink.findOneAndUpdate(
    { _id: shareLinkId, ownerUserId, active: true },
    { $set: { active: false, revokedAt: new Date() } },
    { new: true }
  );
  if (!revoked) {
    const current = await ShareLink.findOne({
      _id: shareLinkId,
      ownerUserId,
    });
    if (!current) {
      throw new NotFoundError('Share link not found');
    }
  }
};

const revokeResourceLinks = async (ownerUserId, resourceType, resourceIds) => {
  const validResourceIds = (resourceIds || []).filter((resourceId) =>
    mongoose.isValidObjectId(resourceId)
  );
  if (validResourceIds.length === 0) {
    return;
  }

  await ShareLink.updateMany(
    {
      ownerUserId,
      resourceType,
      resourceId: { $in: validResourceIds },
      active: true,
    },
    { $set: { active: false, revokedAt: new Date() } }
  );
};

const revokeDeletedResourceLinks = async (resourceType, resourceIds) => {
  const validResourceIds = (resourceIds || []).filter((resourceId) =>
    mongoose.isValidObjectId(resourceId)
  );
  if (validResourceIds.length === 0) {
    return;
  }

  await ShareLink.updateMany(
    {
      resourceType,
      resourceId: { $in: validResourceIds },
      active: true,
    },
    { $set: { active: false, revokedAt: new Date() } }
  );
};

const resolveSharedResource = async (resourceType, token) => {
  if (
    !Object.prototype.hasOwnProperty.call(resourceModels, resourceType) ||
    typeof token !== 'string' ||
    !validShareToken.test(token)
  ) {
    throw new NotFoundError('Shared resource not found');
  }

  const shareLink = await ShareLink.findOne({
    resourceType,
    token,
    active: true,
  });
  if (!shareLink) {
    throw new NotFoundError('Shared resource not found');
  }

  const resource = await resourceModels[resourceType].findOne({
    _id: shareLink.resourceId,
    userId: shareLink.ownerUserId,
  });
  if (!resource) {
    throw new NotFoundError('Shared resource not found');
  }

  return resource;
};

const validatePagination = (request) => {
  for (const key of ['page', 'limit']) {
    const value = request.query[key];
    if (value === undefined) {
      continue;
    }
    if (!/^[1-9]\d*$/.test(String(value))) {
      throw new ValidationError(`Invalid pagination ${key}`);
    }
  }

  const { page, limit } =
    PaginationQueryParamsHelper.getPageAndLimit(request);
  if (
    !Number.isSafeInteger(page) ||
    !Number.isSafeInteger(limit) ||
    page < 1 ||
    limit < 1 ||
    limit > constants.MAX_NUMBER_RETURNED_RESULTS
  ) {
    throw new ValidationError('Invalid sharing-list pagination');
  }
  return { page, limit };
};

const listShareLinks = async (ownerUserId, request) => {
  const { page, limit } = validatePagination(request);
  const filterActiveResources = [
    { $match: { ownerUserId, active: true } },
    {
      $lookup: {
        from: 'bookmarks',
        localField: 'resourceId',
        foreignField: '_id',
        as: 'bookmark',
      },
    },
    {
      $lookup: {
        from: 'notes',
        localField: 'resourceId',
        foreignField: '_id',
        as: 'note',
      },
    },
    {
      $addFields: {
        resource: {
          $cond: [
            { $eq: ['$resourceType', 'bookmark'] },
            { $arrayElemAt: ['$bookmark', 0] },
            { $arrayElemAt: ['$note', 0] },
          ],
        },
      },
    },
    {
      $match: {
        $expr: { $eq: ['$resource.userId', '$ownerUserId'] },
      },
    },
    {
      $addFields: {
        title: {
          $cond: [
            { $eq: ['$resourceType', 'bookmark'] },
            '$resource.name',
            '$resource.title',
          ],
        },
        public: '$resource.public',
      },
    },
    {
      $project: {
        shareLinkId: '$_id',
        resourceType: 1,
        resourceId: 1,
        title: 1,
        public: 1,
        createdAt: 1,
      },
    },
  ];
  const [items, count] = await Promise.all([
    ShareLink.aggregate([
      ...filterActiveResources,
      { $sort: { createdAt: -1, _id: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]),
    ShareLink.aggregate([...filterActiveResources, { $count: 'total' }]),
  ]);

  return {
    items,
    page,
    limit,
    total: count.length ? count[0].total : 0,
  };
};

module.exports = {
  createShareLink,
  getShareLinkStatus,
  listShareLinks,
  revokeDeletedResourceLinks,
  revokeResourceLinks,
  revokeShareLink,
  resolveSharedResource,
  toShareLinkResponse,
};
