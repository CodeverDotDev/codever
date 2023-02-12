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
    specialSearchFilters: specialSearchFilters,
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

let includeFulltextSearchTermsInFilter = function (fulltextSearchTerms, filter, searchInclude) {
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

module.exports = {
  splitSearchQuery: splitSearchQuery,
  extractFulltextAndSpecialSearchTerms: extractFulltextAndSpecialSearchTerms,
  generateFullSearchText: generateFullSearchText,
  includeFulltextSearchTermsInFilter: includeFulltextSearchTermsInFilter
}
