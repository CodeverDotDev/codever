const constants = require('./constants');
const ValidationError = require('../error/validation.error');
const PublicBookmarkExistentError = require('../error/public-bookmark-existent.error');
const Bookmark = require('../model/bookmark');

let validateBookmarkInput = function(userId, bookmark) {

  let validationErrorMessages = validateInputExceptUserId(bookmark);

  if (bookmark.userId !== userId) {
    validationErrorMessages.push("The userId of the bookmark does not match the userId parameter");
  }

  if(validationErrorMessages.length > 0){
    throw new ValidationError(BookmarkValidationErrorMessages.BOOKMARK_NOT_VALID, validationErrorMessages);
  }
}

function validateInputExceptUserId(bookmark) {
  let validationErrorMessages = [];

  if (!bookmark.userId) {
    validationErrorMessages.push(BookmarkValidationErrorMessages.MISSING_USER_ID);
  }

  if (!bookmark.name) {
    validationErrorMessages.push(BookmarkValidationErrorMessages.MISSING_TITLE);
  }
  if (!bookmark.location) {
    validationErrorMessages.push(BookmarkValidationErrorMessages.MISSING_LOCATION);
  }
  if (!bookmark.tags || bookmark.tags.length === 0) {
    validationErrorMessages.push(BookmarkValidationErrorMessages.MISSING_TAGS);
  } else if (bookmark.tags.length > BookmarkValidationRules.MAX_NUMBER_OF_TAGS) {
    validationErrorMessages.push(BookmarkValidationErrorMessages.TOO_MANY_TAGS);
  }

  let blockedTags = '';
  for (let i = 0; i < bookmark.tags?.length; i++) {
    const tag = bookmark.tags[i];
    if (tag.startsWith('awesome')) {
      blockedTags = blockedTags.concat(' ' + tag);
    }
  }

  if (blockedTags) {
    validationErrorMessages.push('The following tags are blocked:' + blockedTags);
  }

  if (bookmark.description) {
    const descriptionIsTooLong = bookmark.description.length > BookmarkValidationRules.MAX_NUMBER_OF_CHARS_FOR_DESCRIPTION;
    if (descriptionIsTooLong) {
      validationErrorMessages.push(BookmarkValidationErrorMessages.DESCRIPTION_TOO_LONG);
    }

    const descriptionHasTooManyLines = bookmark.description.split('\n').length > BookmarkValidationRules.MAX_NUMBER_OF_LINES_FOR_DESCRIPTION;
    if (descriptionHasTooManyLines) {
      validationErrorMessages.push(BookmarkValidationErrorMessages.DESCRIPTION_TOO_MANY_LINES);
    }
  }

  return validationErrorMessages;
}

let validateBookmarkInputForAdmin = function(bookmark) {

  let validationErrorMessages = validateInputExceptUserId(bookmark);

  if(validationErrorMessages.length > 0){
    throw new ValidationError('The bookmark you submitted is not valid', validationErrorMessages);
  }
}

let verifyPublicBookmarkExistenceOnCreation = async function(bookmark) {
  if (bookmark.public) {
    const existingBookmark = await Bookmark.findOne({
      public: true,
      location: bookmark.location
    }).lean().exec();
    if (existingBookmark) {
      throw new PublicBookmarkExistentError(`Create: A public bookmark with this location is already present - location: ${bookmark.location}`);
    }
  }

  return 1;
}

let verifyPublicBookmarkExistenceOnUpdate = async function(bookmark, userId) {
  if (bookmark.public) {
    const existingBookmark = await Bookmark.findOne({
      public: true,
      location: bookmark.location,
      userId: {$ne: userId}
    }).lean().exec();
    if (existingBookmark) {
      throw new PublicBookmarkExistentError(`Update: A public bookmark with this location is already present - location: ${bookmark.location}`);
    }
  }

  return 1;
}

const BookmarkValidationRules = {
  MAX_NUMBER_OF_CHARS_FOR_DESCRIPTION: 5000,
  MAX_NUMBER_OF_LINES_FOR_DESCRIPTION: 500,
  MAX_NUMBER_OF_TAGS: 8
}

const BookmarkValidationErrorMessages = {
  BOOKMARK_NOT_VALID: 'The bookmark you submitted is not valid',
  MISSING_USER_ID: 'Missing required attribute - userId',
  USER_ID_NOT_MATCHING: 'The userId of the bookmark does not match the userId parameter',
  MISSING_TITLE: 'Missing required attribute - title',
  MISSING_LOCATION: 'Missing required attribute - location',
  MISSING_TAGS: 'Missing required attribute - tags',
  TOO_MANY_TAGS: `Too many tags - max ${BookmarkValidationRules.MAX_NUMBER_OF_TAGS} allowed`,
  DESCRIPTION_TOO_LONG: `The description is too long. Only ${BookmarkValidationRules.MAX_NUMBER_OF_CHARS_FOR_DESCRIPTION} allowed`,
  MISSING_CODE_SNIPPETS: 'Missing required attribute - codeSnippets',
  CODE_SNIPPET_TOO_LONG: `The code snippet is too long. Max ${constants.MAX_NUMBER_OF_CHARS_FOR_CODE_SNIPPET} allowed`,
  DESCRIPTION_TOO_MANY_LINES: `The description has too many lines. Only ${BookmarkValidationRules.MAX_NUMBER_OF_LINES_FOR_DESCRIPTION} allowed`
}

module.exports = {
  validateBookmarkInput: validateBookmarkInput,
  validateBookmarkInputForAdmin: validateBookmarkInputForAdmin,
  verifyPublicBookmarkExistenceOnCreation: verifyPublicBookmarkExistenceOnCreation,
  verifyPublicBookmarkExistenceOnUpdate: verifyPublicBookmarkExistenceOnUpdate,
  BookmarkValidationErrorMessages: BookmarkValidationErrorMessages,
  BookmarkValidationRules: BookmarkValidationRules
};
