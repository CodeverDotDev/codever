const Snippet = require('../../../model/snippet');

const NotFoundError = require('../../../error/not-found.error');

const SnippetInputValidator = require('./snippet-input.validator');
const { v4: uuidv4 } = require('uuid');

/**
 * CREATE snippet for user
 */
let createSnippet = async function (userId, snippetData) {
  SnippetInputValidator.validateSnippetInput(userId, snippetData);
  snippetData.shareableId = undefined;
  const snippet = new Snippet(snippetData);

  let newSnippet = await snippet.save();

  return newSnippet;
};

/* GET bookmark of user by bookmarkId */
let getSnippetById = async (userId, snippetId) => {
  const snippet = await Snippet.findOne({
    _id: snippetId,
    userId: userId,
  });

  if (!snippet) {
    throw new NotFoundError(
      `Codelet NOT_FOUND the userId: ${userId} AND id: ${snippetId}`
    );
  } else {
    return snippet;
  }
};

/* GET last created snippets of the user */
let getLatestSnippets = async (userId, limit) => {
  const snippets = await Snippet.find({ userId: userId })
    .sort({ createdAt: -1 })
    .limit(limit);

  return snippets;
};

/* GET last created snippets of the user */
let getAllMySnippets = async (userId) => {
  const snippets = await Snippet.find({ userId: userId }).sort({
    createdAt: -1,
  });

  return snippets;
};

/**
 * full UPDATE via PUT - that is the whole document is required and will be updated
 * the descriptionHtml parameter is only set in backend, if only does not come front-end (might be an API call)
 */
let updateSnippet = async (userId, codeletId, snippetData) => {
  SnippetInputValidator.validateSnippetInput(userId, snippetData);

  const updatedSnippet = await Snippet.findOneAndUpdate(
    {
      _id: codeletId,
      userId: userId,
    },
    snippetData,
    { new: true }
  );

  const snippetNotFound = !updatedSnippet;
  if (snippetNotFound) {
    throw new NotFoundError(
      'Snippet NOT_FOUND with id: ' +
        codeletId +
        ' AND title: ' +
        snippetData.title
    );
  } else {
    return updatedSnippet;
  }
};

/*
 * DELETE snippet for user
 */
let deleteSnippetById = async (userId, codeletId) => {
  const snippet = await Snippet.findOneAndRemove({
    _id: codeletId,
    userId: userId,
  });

  if (!snippet) {
    throw new NotFoundError('Snippet NOT_FOUND with id: ' + codeletId);
  }
};

/* GET suggested tags used for user */
let getSuggestedSnippetTags = async (userId) => {
  const tags = await Snippet.distinct('tags', { userId: userId }); // sort does not work with distinct in mongoose - https://mongoosejs.com/docs/api.html#query_Query-sort

  return tags;
};

let getUserSnippetTags = async (userId) => {
  const aggregatedTags = await Snippet.aggregate([
    //first stage - filter
    {
      $match: {
        userId: userId,
      },
    },

    //second stage - unwind tags
    { $unwind: '$tags' },

    //third stage - group
    {
      $group: {
        _id: {
          tag: '$tags',
        },
        count: {
          $sum: 1,
        },
      },
    },

    //fourth stage - order by count desc
    {
      $sort: { count: -1 },
    },
  ]);

  const userTags = aggregatedTags.map((aggregatedTag) => {
    return {
      name: aggregatedTag._id.tag,
      count: aggregatedTag.count,
    };
  });

  return userTags;
};

let getOrCreateShareableId = async (userId, snippetId) => {
  const snippet = await Snippet.findOne({
    _id: snippetId,
    userId: userId,
  }).select('+shareableId');

  if (snippet) {
    if (snippet.shareableId) {
      return snippet.shareableId;
    } else {
      const uuid = uuidv4();
      const updatedSnippet = await Snippet.findOneAndUpdate(
        {
          _id: snippetId,
          userId: userId,
        },
        {
          $set: { shareableId: uuid },
        },
        { new: true }
      ).select('+shareableId');

      return updatedSnippet.shareableId;
    }
  } else {
    throw new NotFoundError(
      `Snippet NOT_FOUND the userId: ${userId} AND id: ${snippetId}`
    );
  }
};

module.exports = {
  createSnippet: createSnippet,
  getSuggestedSnippetTags: getSuggestedSnippetTags,
  getUserSnippetTags: getUserSnippetTags,
  getSnippetById: getSnippetById,
  getLatestSnippets: getLatestSnippets,
  getAllMySnippets: getAllMySnippets,
  updateSnippet: updateSnippet,
  deleteSnippetById: deleteSnippetById,
  getOrCreateShareableId: getOrCreateShareableId,
};
