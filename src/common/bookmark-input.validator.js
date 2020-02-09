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
    throw new ValidationError('The bookmark you submitted is not valid', validationErrorMessages);
  }
}

function validateInputExceptUserId(bookmark) {
  let validationErrorMessages = [];

  if (!bookmark.userId) {
    validationErrorMessages.push('Missing required attribute - userId');
  }

  if (!bookmark.name) {
    validationErrorMessages.push('Missing required attribute - name');
  }
  if (!bookmark.location) {
    validationErrorMessages.push('Missing required attribute - location');
  }
  if (!bookmark.tags || bookmark.tags.length === 0) {
    validationErrorMessages.push('Missing required attribute - tags');
  } else if (bookmark.tags.length > constants.MAX_NUMBER_OF_TAGS) {
    validationErrorMessages.push('Too many tags have been submitted - max allowed 8');
  }

  let blockedTags = '';
  for (let i = 0; i < bookmark.tags.length; i++) {
    const tag = bookmark.tags[i];
    if (tag.startsWith('awesome')) {
      blockedTags = blockedTags.concat(' ' + tag);
    }
  }

  if (blockedTags) {
    validationErrorMessages.push('The following tags are blocked:' + blockedTags);
  }

  if (bookmark.description) {
    const descriptionIsTooLong = bookmark.description.length > constants.MAX_NUMBER_OF_CHARS_FOR_DESCRIPTION;
    if (descriptionIsTooLong) {
      validationErrorMessages.push('The description is too long. Only ' + constants.MAX_NUMBER_OF_CHARS_FOR_DESCRIPTION + ' allowed');
    }

    const descriptionHasTooManyLines = bookmark.description.split('\n').length > constants.MAX_NUMBER_OF_LINES_FOR_DESCRIPTION;
    if (descriptionHasTooManyLines) {
      validationErrorMessages.push('The description hast too many lines. Only ' + constants.MAX_NUMBER_OF_LINES_FOR_DESCRIPTION + ' allowed');
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
  if (bookmark.shared) {
    const existingBookmark = await Bookmark.findOne({
      shared: true,
      location: bookmark.location
    }).lean().exec();
    if (existingBookmark) {
      throw new PublicBookmarkExistentError(`Create: A public bookmark with this location is already present - location: ${bookmark.location}`);
    }
  }

  return 1;
}

let verifyPublicBookmarkExistenceOnUpdate = async function(bookmark, userId) {
  if (bookmark.shared) {
    const existingBookmark = await Bookmark.findOne({
      shared: true,
      location: bookmark.location,
      userId: {$ne: userId}
    }).lean().exec();
    if (existingBookmark) {
      throw new PublicBookmarkExistentError(`Update: A public bookmark with this location is already present - location: ${bookmark.location}`);
    }
  }

  return 1;
}

module.exports = {
  validateBookmarkInput: validateBookmarkInput,
  validateBookmarkInputForAdmin: validateBookmarkInputForAdmin,
  verifyPublicBookmarkExistenceOnCreation: verifyPublicBookmarkExistenceOnCreation,
  verifyPublicBookmarkExistenceOnUpdate: verifyPublicBookmarkExistenceOnUpdate,
};
