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

module.exports = {
  getSnippetById: getSnippetById
};
