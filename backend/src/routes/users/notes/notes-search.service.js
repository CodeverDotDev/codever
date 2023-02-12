const Note = require('../../../model/note');

const searchUtils = require('../../../common/search.utils');

let findNotes = async function (userId, query, page, limit, searchInclude) {
  //split in text and tags
  const searchedTermsAndTags = searchUtils.splitSearchQuery(query);
  let searchedTerms = searchedTermsAndTags.terms;
  const searchedTags = searchedTermsAndTags.tags;
  let notes = [];

  const {specialSearchFilters, fulltextSearchTerms} = searchUtils.extractFulltextAndSpecialSearchTerms(searchedTerms);

  if ( searchedTerms.length > 0 && searchedTags.length > 0 ) {
    notes = await getNotesForTagsAndTerms(userId, searchedTags, fulltextSearchTerms, page, limit, specialSearchFilters, searchInclude);
  } else if ( searchedTerms.length > 0 ) {
    notes = await getNotesForSearchedTerms(userId, fulltextSearchTerms, page, limit, specialSearchFilters, searchInclude);
  } else {
    notes = await getNotesForSearchedTags(userId, searchedTags, page, limit, specialSearchFilters);
  }

  return notes;
}

let getNotesForTagsAndTerms = async function (userId, searchedTags, fulltextSearchTerms, page, limit, specialSearchFilters, searchInclude) {
  let filter = {
    tags:
      {
        $all: searchedTags
      }
  }

  filter['userId'] = userId;

  if ( fulltextSearchTerms.length > 0 ) {
    if ( searchInclude === 'any' ) {
      filter.$text = {$search: fulltextSearchTerms.join(' ')}
    } else {
      filter.$text = {$search: searchUtils.generateFullSearchText(fulltextSearchTerms)};
    }
  }

  let notes = await Note.find(
    filter,
    {
      score: {$meta: "textScore"}
    }
  )
    .sort({score: {$meta: "textScore"}})
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
    .exec();

  return notes;
}


let getNotesForSearchedTerms = async function (userId, fulltextSearchTerms, page, limit, specialSearchFilters, searchInclude) {

  let filter = {};
  filter['userId'] = userId;

  if ( fulltextSearchTerms.length > 0 ) {
    if ( searchInclude === 'any' ) {
      filter.$text = {$search: fulltextSearchTerms.join(' ')}
    } else {
      filter.$text = {$search: searchUtils.generateFullSearchText(fulltextSearchTerms)};
    }
  }

  let notes = await Note.find(
    filter,
    {
      score: {$meta: "textScore"}
    }
  )
    .sort({score: {$meta: "textScore"}})
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
    .exec();

  return notes;
}


let getNotesForSearchedTags = async function (userId, searchedTags, page, limit) {
  let filter = {
    tags:
      {
        $all: searchedTags
      }
  }
  filter['userId'] = userId;


  let notes = await Note.find(filter)
    .sort({createdAt: -1})
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
    .exec();

  return notes;
}


module.exports = {
  findNotes: findNotes
}
