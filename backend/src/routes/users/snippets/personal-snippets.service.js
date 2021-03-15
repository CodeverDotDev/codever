const Snippet = require('../../../model/snippet');

const NotFoundError = require('../../../error/not-found.error');

const CodeletInputValidator = require('./snippet-input.validator');

/**
 * CREATE snippet for user
 */
let createSnippet = async function (userId, snippetData) {
  CodeletInputValidator.validateSnippetInput(userId, snippetData);

  const snippet = new Snippet(snippetData);
  let newSnippet = await snippet.save();

  return newSnippet;
}

/* GET bookmark of user by bookmarkId */
let getSnippetById = async (userId, snippetId) => {

  const snippet = await Snippet.findOne({
    _id: snippetId,
    userId: userId
  });

  if ( !snippet ) {
    throw new NotFoundError(`Codelet NOT_FOUND the userId: ${userId} AND id: ${snippetId}`);
  } else {
    return snippet;
  }
};

/* GET last created snippets of the user */
let getLatestSnippets = async (userId, limit) => {
  const snippets = await Snippet.find({userId: userId})
    .sort({createdAt: -1})
    .limit(limit);

  return snippets;
};

/**
 * full UPDATE via PUT - that is the whole document is required and will be updated
 * the descriptionHtml parameter is only set in backend, if only does not come front-end (might be an API call)
 */
let updateSnippet = async (userId, codeletId, codeletData) => {

  CodeletInputValidator.validateSnippetInput(userId, codeletData);

  const updatedCodelet = await Snippet.findOneAndUpdate(
    {
      _id: codeletId,
      userId: userId
    },
    codeletData,
    {new: true}
  );

  const codeletNotFound = !updatedCodelet;
  if ( codeletNotFound ) {
    throw new NotFoundError('Snippet NOT_FOUND with id: ' + codeletId + ' AND title: ' + codeletData.title);
  } else {
    return updatedCodelet;
  }
};

/*
* DELETE snippet for user
*/
let deleteSnippetById = async (userId, codeletId) => {
  const snippet = await Snippet.findOneAndRemove({
    _id: codeletId,
    userId: userId
  });

  if ( !snippet ) {
    throw new NotFoundError('Snippet NOT_FOUND with id: ' + codeletId);
  }
};

/* GET suggested tags used for user */
let getSuggestedSnippetTags = async (userId) => {

  const tags = await Snippet.distinct("tags",
    {userId: userId}
  ); // sort does not work with distinct in mongoose - https://mongoosejs.com/docs/api.html#query_Query-sort

  return tags;
};


module.exports = {
  createCodelet: createSnippet,
  getSuggestedSnippetTags: getSuggestedSnippetTags,
  getSnippetById: getSnippetById,
  getLatestSnippets: getLatestSnippets,
  updateSnippet: updateSnippet,
  deleteCodeletById: deleteSnippetById,
};
