//showdown converter - https://github.com/showdownjs/showdown
const showdown = require('showdown'),
  converter = new showdown.Converter();

const Bookmark = require('../../../model/bookmark');
const ValidationError = require('../../../error/validation.error');
const PublicBookmarkExistingError = require('../../../error/public-bookmark-existent.error');
const BookmarkInputValidator = require('../../../common/validation/bookmark-input.validator');

/**
 * Only these string fields are taken from a bookmark in the file. Everything
 * else (ids, owner, likes, share links, internal fields) is ignored, so the
 * file can never decide ownership or fake popularity.
 */
const RESTORED_STRING_FIELDS = [
  'name',
  'location',
  'description',
  'sourceCodeURL',
  'language',
  'youtubeVideoId',
  'stackoverflowQuestionId',
];

/**
 * Restores bookmarks from a Codever JSON export into the account of userId.
 *
 * - bookmarks whose location the user already has (or that repeat a location
 *   earlier in the file) are skipped and the existing bookmark is unchanged
 * - invalid bookmarks are skipped and counted, the rest is still restored
 * - bookmarks are private unless keepPublic is set; a public bookmark whose
 *   location is already public in Codever is restored as private
 * - createdAt / updatedAt from the file are kept
 */
let importCodeverJsonBookmarks = async function (
  userId,
  bookmarks,
  { keepPublic = false, userDisplayName } = {}
) {
  if (!Array.isArray(bookmarks)) {
    throw new ValidationError('The Codever JSON export is not valid', [
      'bookmarks must be the array of bookmarks from a Codever JSON export',
    ]);
  }

  const result = {
    created: [],
    duplicatesSize: 0,
    inErrorSize: 0,
    madePrivateSize: 0,
  };
  if (bookmarks.length === 0) {
    return result;
  }

  const existing = await Bookmark.find({ userId: userId }, { location: 1 })
    .lean()
    .exec();
  const knownLocations = new Set(existing.map((bookmark) => bookmark.location));
  const now = new Date();

  for (const raw of bookmarks) {
    const bookmarkData = toRestoredBookmarkData(
      raw,
      userId,
      userDisplayName,
      keepPublic,
      now
    );

    if (bookmarkData.location && knownLocations.has(bookmarkData.location)) {
      result.duplicatesSize++;
      continue;
    }

    try {
      BookmarkInputValidator.validateBookmarkInput(userId, bookmarkData);
    } catch (error) {
      if (error instanceof ValidationError) {
        result.inErrorSize++;
        continue;
      }
      throw error;
    }
    knownLocations.add(bookmarkData.location);

    if (bookmarkData.public) {
      try {
        await BookmarkInputValidator.verifyPublicBookmarkExistenceOnCreation(
          bookmarkData
        );
      } catch (error) {
        if (!(error instanceof PublicBookmarkExistingError)) {
          throw error;
        }
        bookmarkData.public = false;
        result.madePrivateSize++;
      }
    }

    const bookmark = new Bookmark(bookmarkData);
    // The dates come from the file; automatic timestamps would overwrite them.
    const saved = await bookmark.save({ timestamps: false });
    result.created.push(saved);
  }

  return result;
};

function toRestoredBookmarkData(
  raw,
  userId,
  userDisplayName,
  keepPublic,
  now
) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const data = {
    type: 'bookmark',
    userId: userId,
    userDisplayName: userDisplayName,
    likeCount: 0,
    public: keepPublic === true && source.public === true,
  };

  for (const field of RESTORED_STRING_FIELDS) {
    if (typeof source[field] === 'string') {
      data[field] = source[field];
    }
  }
  data.descriptionHtml = converter.makeHtml(data.description || '');
  data.tags = source.tags;
  // null or missing means "no copyable fields"; anything else is validated
  if (source.copyableFields !== null && source.copyableFields !== undefined) {
    data.copyableFields = source.copyableFields;
  }

  const publishedOn = parseDate(source.publishedOn);
  if (publishedOn) {
    data.publishedOn = publishedOn;
  }

  const createdAt = restoredDate(source.createdAt, now);
  const updatedAt = restoredDate(source.updatedAt, now);
  data.createdAt = createdAt;
  data.updatedAt = updatedAt < createdAt ? createdAt : updatedAt;

  return data;
}

function parseDate(value) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/** The file's date, or now when it is missing, invalid or in the future. */
function restoredDate(value, now) {
  const date = parseDate(value);
  return date && date <= now ? date : now;
}

module.exports = {
  importCodeverJsonBookmarks: importCodeverJsonBookmarks,
};
