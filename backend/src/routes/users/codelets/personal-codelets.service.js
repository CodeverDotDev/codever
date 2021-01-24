const Codelet = require('../../../model/codelet');

const NotFoundError = require('../../../error/not-found.error');

const CodeletInputValidator = require('./codelet-input.validator');

/**
 * CREATE codelet for user
 */
let createCodelet = async function (userId, codeletData) {
  CodeletInputValidator.validateCodeletInput(userId, codeletData);

  const codelet = new Codelet(codeletData);
  let newCodelet = await codelet.save();

  return newCodelet;
}

/* GET bookmark of user by bookmarkId */
let getCodeletById = async (userId, codeletId) => {

  const codelet = await Codelet.findOne({
    _id: codeletId,
    userId: userId
  });

  if ( !codelet ) {
    throw new NotFoundError(`Codelet NOT_FOUND the userId: ${userId} AND id: ${codeletId}`);
  } else {
    return codelet;
  }
};

/* GET last created snippets of the user */
let getLatestSnippets = async (userId, limit) => {
  const snippets = await Codelet.find({userId: userId})
    .sort({createdAt: -1})
    .limit(limit);

  return snippets;
};

/**
 * full UPDATE via PUT - that is the whole document is required and will be updated
 * the descriptionHtml parameter is only set in backend, if only does not come front-end (might be an API call)
 */
let updateCodelet = async (userId, codeletId, codeletData) => {

  CodeletInputValidator.validateCodeletInput(userId, codeletData);

  const updatedCodelet = await Codelet.findOneAndUpdate(
    {
      _id: codeletId,
      userId: userId
    },
    codeletData,
    {new: true}
  );

  const codeletNotFound = !updatedCodelet;
  if ( codeletNotFound ) {
    throw new NotFoundError('Codelet NOT_FOUND with id: ' + codeletId + ' AND title: ' + codeletData.title);
  } else {
    return updatedCodelet;
  }
};

/*
* DELETE codelet for user
*/
let deleteCodeletById = async (userId, codeletId) => {
  const codelet = await Codelet.findOneAndRemove({
    _id: codeletId,
    userId: userId
  });

  if ( !codelet ) {
    throw new NotFoundError('Codelet NOT_FOUND with id: ' + codeletId);
  }
};

/* GET suggested tags used for user */
let getSuggestedCodeletTags = async (userId) => {

  const tags = await Codelet.distinct("tags",
    {userId: userId}
  ); // sort does not work with distinct in mongoose - https://mongoosejs.com/docs/api.html#query_Query-sort

  return tags;
};


module.exports = {
  createCodelet: createCodelet,
  getSuggestedCodeletTags: getSuggestedCodeletTags,
  getCodeletById: getCodeletById,
  getLatestSnippets: getLatestSnippets,
  updateCodelet: updateCodelet,
  deleteCodeletById: deleteCodeletById,
};
