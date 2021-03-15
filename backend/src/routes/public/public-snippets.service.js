const Snippet = require('../../model/snippet');
const NotFoundError = require('../../error/not-found.error');

let getSnippetById = async function (snippetId) {
  const snippet = await Snippet.findOne({
    public: true,
    _id: snippetId
  });

  if ( !snippet ) {
    throw new NotFoundError(`Snippet data NOT_FOUND for id: ${snippetId}`);
  }
  return snippet;
};

let getLatestPublicSnippets = async (page, limit) => {

  const bookmarks = await Snippet.find({'public': true})
    .sort({createdAt: -1})
    .skip((page - 1) * limit)
    .limit(limit)
    .lean().exec();

  return bookmarks;
}

let getPublicSnippetsForTag = async (tag, orderBy, page, limit) => {
  let orderByFilter;
  switch (orderBy) {
    case  'LATEST':
      orderByFilter = {createdAt: -1}
      break;
    case 'LIKE_COUNT':
      orderByFilter = {likeCount: -1}
      break;
    default:
      orderByFilter = {createdAt: -1}
  }
  const snippets = await Snippet.find({
    public: true,
    tags: tag
  })
    .sort(orderByFilter)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
    .exec();

  return snippets;

};


module.exports = {
  getSnippetById: getSnippetById,
  getLatestPublicSnippets: getLatestPublicSnippets,
  getPublicSnippetsForTag: getPublicSnippetsForTag
};
