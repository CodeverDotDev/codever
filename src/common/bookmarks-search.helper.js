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
      if ( isInsideTag ) {
        tags.push(tag.trim());
        tag = '';
      } else {
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

let bookmarkContainsSearchedTerm = function (bookmark, searchedTerm) {
  let result = false;
  // const escapedSearchPattern = '\\b' + this.escapeRegExp(searchedTerm.toLowerCase()) + '\\b'; word boundary was not enough, especially for special characters which can happen in coding
  // https://stackoverflow.com/questions/23458872/javascript-regex-word-boundary-b-issue
  const separatingChars = '\\s\\.,;#\\-\\/_\\[\\]\\(\\)\\*\\+';
  const escapedSearchPattern = `(^|[${separatingChars}])(${escapeRegExp(searchedTerm.toLowerCase())})(?=$|[${separatingChars}])`;
  const pattern = new RegExp(escapedSearchPattern);
  if ( (bookmark.name && pattern.test(bookmark.name.toLowerCase()))
    || (bookmark.location && pattern.test(bookmark.location.toLowerCase()))
    || (bookmark.description && pattern.test(bookmark.description.toLowerCase()))
    || (bookmark.sourceCodeURL && pattern.test(bookmark.sourceCodeURL.toLowerCase()))
  ) {
    result = true;
  }

  if ( result ) {
    return true;
  } else {
    // if not found already look through the tags also
    bookmark.tags.forEach(tag => {
      if ( pattern.test(tag.toLowerCase()) ) {
        result = true;
      }
    });
  }

  return result;
}

function escapeRegExp(str) {
  const specials = [
      // order matters for these
      '-'
      , '['
      , ']'
      // order doesn't matter for any of these
      , '/'
      , '{'
      , '}'
      , '('
      , ')'
      , '*'
      , '+'
      , '?'
      , '.'
      , '\\'
      , '^'
      , '$'
      , '|'
    ],
    regex = RegExp('[' + specials.join('\\') + ']', 'g');
  return str.replace(regex, '\\$&'); // $& means the whole matched string
}

let extractSpecialSearchTerms = function (searchedTerms) {
  let specialSearchFilters = {}
  let nonSpecialSearchTerms = [];
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

    nonSpecialSearchTerms.push(searchTerm);
  }

  return {
    specialSearchFilters: specialSearchFilters,
    nonSpecialSearchTerms: nonSpecialSearchTerms
  }
}

module.exports = {
  splitSearchQuery: splitSearchQuery,
  bookmarkContainsSearchedTerm: bookmarkContainsSearchedTerm,
  extractSpecialSearchTerms: extractSpecialSearchTerms
}
