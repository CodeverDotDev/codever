const Codelet = require('../../model/codelet');
const NotFoundError = require('../../error/not-found.error');

let getSnippetById = async function (snippetId) {
  const snippet = await Codelet.findOne({
    public: true,
    _id: snippetId
  });

  if ( !snippet ) {
    throw new NotFoundError(`Snippet data NOT_FOUND for id: ${snippetId}`);
  }
  return snippet;
};

let getLatestPublicSnippets = async (page, limit) => {

  const bookmarks = await Codelet.find({'public': true})
    .sort({createdAt: -1})
    .skip((page - 1) * limit)
    .limit(limit)
    .lean().exec();

  return bookmarks;
}

module.exports = {
  getSnippetById: getSnippetById,
  getLatestPublicSnippets: getLatestPublicSnippets
};
