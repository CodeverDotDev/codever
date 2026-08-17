const Note = require('../../../model/note');

const searchUtils = require('../../../common/searching/utils/search.utils');

let findPersonalNotes = async function (
  userId,
  query,
  page,
  limit,
  searchInclude
) {
  //split in text and tags
  const [searchTerms, searchTags] = searchUtils.parseQueryString(query);
  const { fulltextSearchTerms } =
    searchUtils.extractFulltextAndSpecialSearchTerms(searchTerms);

  let filter = {};
  filter['userId'] = userId;
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

module.exports = {
  findPersonalNotes: findPersonalNotes,
};
