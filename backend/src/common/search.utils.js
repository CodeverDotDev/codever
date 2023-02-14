const ValidationError = require("../error/validation.error");
let splitSearchQuery = function (query) {

  const result = {};

  const terms = [];
  let term = '';
  const tags = [];
  let tag = '';

  let isInsideTerm = false;
  let isInsideTag = false;

  for ( let i = 0; i < query.length; i++ ) {
    const currentCharacter = query[i];
    if ( currentCharacter === ' ' ) {
      if ( !isInsideTag ) {
        if ( !isInsideTerm ) {
          continue;
        } else {
          terms.push(term);
          isInsideTerm = false;
          term = '';
        }
      } else {
        tag += ' ';
      }
    } else if ( currentCharacter === '[' ) {
      if ( !isInsideTag ) {
        isInsideTag = true;
      }
    } else if ( currentCharacter === ']' ) {
      if ( isInsideTag ) {
        isInsideTag = false;
        tags.push(tag.trim());
        tag = '';
      }
    } else {
      if ( isInsideTag ) {
        tag += currentCharacter;
      } else {
        isInsideTerm = true;
        term += currentCharacter;
      }
    }
  }

  if ( tag.length > 0 ) {
    tags.push(tag.trim());
  }

  if ( term.length > 0 ) {
    terms.push(term);
  }

  result.terms = terms;
  result.tags = tags;

  return result;
}


let extractFulltextAndSpecialSearchTerms = function (searchedTerms) {
  let specialSearchFilters = {}
  let fulltextSearchTerms = [];
  for ( let i = 0; i < searchedTerms.length; i++ ) {
    const searchTerm = searchedTerms[i];

    const langParamIndex = searchTerm.startsWith('lang:');
    if ( langParamIndex > 0 ) {
      specialSearchFilters.lang = searchTerm.substring(5, searchTerm.length);
      continue;
    }

    const siteParamIndex = searchTerm.startsWith('site:');
    if ( siteParamIndex > 0 ) {
      specialSearchFilters.site = searchTerm.substring(5, searchTerm.length);
      continue;
    }

    if ( searchTerm === 'private:only' ) {
      specialSearchFilters.privateOnly = true;
      continue;
    }

    const regex = /user:\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/g;
    if ( searchedTerms[i].match(regex) ) {
      specialSearchFilters.userId = searchedTerms[i].split(':')[1];
      continue;
    }

    fulltextSearchTerms.push(searchTerm);
  }

  return {
    specialSearchTerms: specialSearchFilters,
    fulltextSearchTerms: fulltextSearchTerms
  }
}

/*
  The default search in Mongo uses the OR operator, here
  we make to AND by placing the search terms between ""
 */
let generateFullSearchText = function (fulltextSearchTerms) {
  let termsQuery = '';
  fulltextSearchTerms.forEach(searchTerm => {
    if ( searchTerm.startsWith('-') ) { // "-" means it must not contain this searchTerm
      termsQuery += ' ' + searchTerm;
    } else { //wrap it in quotes to make it a default AND in search
      termsQuery += ' "' + searchTerm.substring(0, searchTerm.length) + '"';
    }
  });

  return termsQuery.trim();
};

let setFulltextSearchTermsFilter = function (fulltextSearchTerms, filter, searchInclude) {
  let newFilter = {...filter};
  if ( fulltextSearchTerms.length > 0 ) {
    let searchText = '';
    if ( searchInclude === 'any' ) {
      searchText = {$search: fulltextSearchTerms.join(' ')}
    } else {
      searchText = {$search: generateFullSearchText(fulltextSearchTerms)};
    }

    newFilter.$text = searchText;
  }
  return newFilter;
}

let setTagsToFilter = function (searchTags, filter) {
  if ( searchTags.length > 0 ) {
    return {
      ...filter,
      tags: {$all: searchTags}
    };
  } else {
    return filter;
  }
};

let setPublicOrPersonalFilter = function (isPublic, filter, userId) {
  if ( isPublic ) {
    return {
      ...filter,
      public: true
    }
  } else if ( userId ) {
    return {
      ...filter,
      userId: userId
    }
  } else {
    throw new ValidationError('Snippet must be either public or personal (public or userId must be provided)');
  }
};


let setSpecialSearchTermsFilter = function (isPublic, userId, specialSearchFilters, filter) {
  let newFilter = {...filter};

  //one is not entitled to see private bookmarks of another user
  if ( specialSearchFilters.userId && (isPublic || specialSearchFilters.userId === userId) ) {
    newFilter.userId = specialSearchFilters.userId;
  }

  if ( specialSearchFilters.privateOnly ) { //
    newFilter.public = false;
  }

  if ( specialSearchFilters.site ) {
    newFilter.sourceUrl = new RegExp(specialSearchFilters.site, 'i');//TODO when performance becomes an issue extract domains from URLs and make a direct comparison with the domain
  }

  return newFilter;
};

module.exports = {
  splitSearchQuery: splitSearchQuery,
  extractFulltextAndSpecialSearchTerms: extractFulltextAndSpecialSearchTerms,
  generateFullSearchText: generateFullSearchText,
  setFulltextSearchTermsFilter: setFulltextSearchTermsFilter,
  setPublicOrPersonalFilter: setPublicOrPersonalFilter,
  setTagsToFilter: setTagsToFilter,
  setSpecialSearchTermsFilter: setSpecialSearchTermsFilter
}
