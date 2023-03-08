const Note = require('../../../model/note');

const searchUtils = require('../../../common/searching/utils/search.utils');

let findPersonalNotes = async function (userId, query, page, limit, searchInclude) {
  //split in text and tags
  const {searchTerms, searchTags} = searchUtils.splitSearchQuery(query);
  const {specialSearchTerms, fulltextSearchTerms} = searchUtils.extractFulltextAndSpecialSearchTerms(searchTerms);

  let filter = {}
  filter['userId'] = userId;
  filter = searchUtils.setTagsToFilter(searchTags, filter);
  filter = searchUtils.setFulltextSearchTermsFilter(fulltextSearchTerms, filter, searchInclude);

  let  notes = await Note.find(
    filter,
    {
      score: {$meta: "textScore"}
    }
  )
    .sort(searchTerms.length > 0 ? {score: {$meta: "textScore"}} : {createdAt: -1})
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
    .exec();

  return notes;
}

module.exports = {
  findPersonalNotes: findPersonalNotes
}
