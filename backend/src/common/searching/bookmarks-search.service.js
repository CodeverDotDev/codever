const Bookmark = require('../../model/bookmark');
const searchUtils = require('./utils/search.utils');
const {OrderBy} = require("./constant/orderby.constant");

let findPublicBookmarks = async function (query, page, limit, searchInclude, sort) {
  return findBookmarks(true, null, query, page, limit, searchInclude, sort);
}

let findPersonalBookmarks = async function (userId, query, page, limit, searchInclude) {
  return findBookmarks(false, userId, query, page, limit, searchInclude);
}

let findBookmarks = async function (isPublic, userId, query, page, limit, searchInclude, sort = 'textScore') {
  //split in text and tags
  const searchTermsAndTags = searchUtils.splitSearchQuery(query);
  const searchTerms = searchTermsAndTags.terms;
  const searchTags = searchTermsAndTags.tags;

  const {specialSearchTerms, fulltextSearchTerms} = searchUtils.extractFulltextAndSpecialSearchTerms(searchTerms);

  let filter = {}
  filter = searchUtils.setPublicOrPersonalFilter(isPublic, filter, userId);
  filter = searchUtils.setTagsToFilter(searchTags, filter);
  filter = searchUtils.setFulltextSearchTermsFilter(fulltextSearchTerms, filter, searchInclude);
  filter = setSpecialSearchTermsFilter(isPublic, userId, specialSearchTerms, filter);

  const sortBy = searchUtils.getSortByObject(sort, fulltextSearchTerms);

  let bookmarks = await Bookmark.find(
    filter,
    {
      score: {$meta: OrderBy.TEXT_SCORE}
    }
  )
    .sort(sortBy)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
    .exec();

  return bookmarks;
}

let setSpecialSearchTermsFilter = function (isPublic, userId, specialSearchTerms, filter) {
  let newFilter = {...filter};

  //one is not entitled to see private bookmarks of another user
  if ( specialSearchTerms.userId && (isPublic || specialSearchTerms.userId === userId) ) {
    newFilter.userId = specialSearchTerms.userId;
  }

  if ( specialSearchTerms.privateOnly && !isPublic) { //
    newFilter.public = false;
  }

  if ( specialSearchTerms.lang ) {
    newFilter.language = specialSearchTerms.lang
  }

  if ( specialSearchTerms.site ) {
    newFilter.location = new RegExp(specialSearchTerms.site, 'i');//TODO when performance becomes an issue extract domains from URLs
  }

  return newFilter;
};

module.exports = {
  findPublicBookmarks: findPublicBookmarks,
  findPersonalBookmarks: findPersonalBookmarks
}
