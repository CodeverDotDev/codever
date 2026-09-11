const Note = require('../../model/note');
const NotFoundError = require('../../error/not-found.error');
const searchUtils = require('../../common/searching/utils/search.utils');

let searchPublicNotes = async function (query, page, limit, searchInclude) {
  const [searchTerms, searchTags] = searchUtils.parseQueryString(query);
  const { fulltextSearchTerms } =
    searchUtils.extractFulltextAndSpecialSearchTerms(searchTerms);

  let filter = {};
  filter['public'] = true;
  filter = searchUtils.setTagsToFilter(searchTags, filter);
  filter = searchUtils.setFulltextSearchTermsFilter(
    fulltextSearchTerms,
    filter,
    searchInclude
  );
  // Tags narrow the result set but do not create MongoDB text-score metadata.
  // Only project textScore and rank by it when actual full-text terms exist.
  const projection = fulltextSearchTerms.length > 0
    ? { score: { $meta: 'textScore' } }
    : {};

  let notes = await Note.find(filter, projection)
    // Tag-only searches use newest-first ordering because no text score exists.
    .sort(
      fulltextSearchTerms.length > 0
        ? { score: { $meta: 'textScore' } }
        : { createdAt: -1 }
    )
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
    .exec();

  return notes;
};

let getLatestPublicNotes = async function (page, limit) {
  const notes = await Note.find({ public: true })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
    .exec();

  return notes;
};

let getNoteById = async function (noteId) {
  const note = await Note.findOne({
    public: true,
    _id: noteId,
  });

  if (!note) {
    throw new NotFoundError(`Note data NOT_FOUND for id: ${noteId}`);
  }

  return note;
};

/* GET note by shareableId */
let getNoteByShareableId = async (shareableId) => {
  const note = await Note.findOne({
    shareableId: shareableId,
  }).select('+shareableId');

  if (!note) {
    throw new NotFoundError(`Note NOT_FOUND for shareableId: ${shareableId}`);
  }

  return note;
};

module.exports = {
  searchPublicNotes: searchPublicNotes,
  getLatestPublicNotes: getLatestPublicNotes,
  getNoteById: getNoteById,
  getNoteByShareableId: getNoteByShareableId,
};
