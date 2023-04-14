const ValidationError = require('../../../error/validation.error');
const { OrderBy } = require('../constant/orderby.constant');
const { SearchInclude } = require('../constant/searchInclude.constant');
const { SpecialSearchTerm } = require('../constant/specialSearchTerm.constant');
const { DocType } = require('../../constants');

let parseQueryString = function (queryString) {
  let searchTerms = [];
  let tags = [];
  let inTag = false;
  let currentWord = '';

  for (let i = 0; i < queryString.length; i++) {
    let char = queryString.charAt(i);

    if (char === '[') {
      inTag = true;
      if (currentWord !== '') {
        searchTerms.push(currentWord);
        currentWord = '';
      }
    } else if (char === ']') {
      inTag = false;
      tags.push(currentWord);
      currentWord = '';
    } else if (char === ' ') {
      if (inTag) {
        currentWord += char;
      } else if (currentWord !== '') {
        searchTerms.push(currentWord);
        currentWord = '';
      }
    } else {
      currentWord += char;
    }
  }

  if (currentWord !== '') {
    if (inTag) {
      tags.push(currentWord);
    } else {
      searchTerms.push(currentWord);
    }
  }

  return [searchTerms, tags];
};

let extractFulltextAndSpecialSearchTerms = function (searchedTerms) {
  let specialSearchFilters = {};
  let fulltextSearchTerms = [];
  for (let i = 0; i < searchedTerms.length; i++) {
    const searchTerm = searchedTerms[i];

    const langParamIndex = searchTerm.startsWith(SpecialSearchTerm.language);
    if (langParamIndex > 0) {
      specialSearchFilters.lang = searchTerm.substring(5, searchTerm.length);
      continue;
    }

    const siteParamIndex = searchTerm.startsWith(SpecialSearchTerm.site);
    if (siteParamIndex > 0) {
      specialSearchFilters.site = searchTerm.substring(5, searchTerm.length);
      continue;
    }

    if (searchTerm === SpecialSearchTerm.privateOnly) {
      specialSearchFilters.privateOnly = true;
      continue;
    }

    if (searchTerm.startsWith(SpecialSearchTerm.user)) {
      const regex =
        /user:\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/g;
      if (searchedTerms[i].match(regex)) {
        specialSearchFilters.userId = searchedTerms[i].split(':')[1];
        continue;
      }
    }

    fulltextSearchTerms.push(searchTerm);
  }

  return {
    specialSearchTerms: specialSearchFilters,
    fulltextSearchTerms: fulltextSearchTerms,
  };
};

/*
  The default search in Mongo uses the OR operator, here
  we make to AND by placing the search terms between ""
 */
let generateFullSearchText = function (fulltextSearchTerms) {
  let termsQuery = '';
  fulltextSearchTerms.forEach((searchTerm) => {
    if (searchTerm.startsWith('-')) {
      // "-" means it must not contain this searchTerm
      termsQuery += ' ' + searchTerm;
    } else {
      //wrap it in quotes to make it a default AND in search
      termsQuery += ' "' + searchTerm.substring(0, searchTerm.length) + '"';
    }
  });

  return termsQuery.trim();
};

let setFulltextSearchTermsFilter = function (
  fulltextSearchTerms,
  filter,
  searchInclude
) {
  let newFilter = { ...filter };
  if (fulltextSearchTerms.length > 0) {
    let searchText = '';
    if (searchInclude === SearchInclude.ANY) {
      searchText = { $search: fulltextSearchTerms.join(' ') };
    } else {
      searchText = { $search: generateFullSearchText(fulltextSearchTerms) };
    }

    newFilter.$text = searchText;
  }
  return newFilter;
};

let setTagsToFilter = function (searchTags, filter) {
  if (searchTags.length > 0) {
    return {
      ...filter,
      tags: { $all: searchTags },
    };
  } else {
    return filter;
  }
};

let setPublicOrPersonalFilter = function (isPublic, filter, userId) {
  if (isPublic) {
    return {
      ...filter,
      public: true,
    };
  } else if (userId) {
    return {
      ...filter,
      userId: userId,
    };
  } else {
    throw new ValidationError(
      'Resource must be either public or personal (public OR userId must be provided)'
    );
  }
};

let setSpecialSearchTermsFilter = function (
  docType,
  isPublic,
  userId,
  specialSearchFilters,
  filter
) {
  let newFilter = { ...filter };

  //one is not entitled to see private bookmarks of another user
  if (
    specialSearchFilters.userId &&
    (isPublic || specialSearchFilters.userId === userId)
  ) {
    newFilter.userId = specialSearchFilters.userId;
  }

  if (specialSearchFilters.privateOnly && !isPublic) {
    //
    newFilter.public = false;
  }

  if (specialSearchFilters.lang) {
    newFilter.language = specialSearchFilters.lang;
  }

  if (specialSearchFilters.site) {
    if (docType === DocType.BOOKMARK) {
      newFilter.location = new RegExp(specialSearchFilters.site, 'i');
    } else if (docType === DocType.SNIPPET) {
      newFilter.sourceUrl = new RegExp(specialSearchFilters.site, 'i'); //TODO when performance becomes an issue extract domains from URLs and make a direct comparison with the domain
    } else {
      throw new Error(`${docType} is not supported as document type`);
    }
  }

  return newFilter;
};

function getSortByObject(sort, fulltextSearchTerms) {
  let sortBy = {};
  if (sort === OrderBy.NEWEST || fulltextSearchTerms.length === 0) {
    //now "fulltext search terms" it defaults to "newest" sorting
    sortBy.createdAt = -1;
  } else {
    sortBy.score = { $meta: OrderBy.TEXT_SCORE };
  }
  return Object.freeze(sortBy);
}

const generateSearchFilterAndSortBy = (
  docType,
  isPublic,
  userId,
  queryString,
  searchInclude,
  sort
) => {
  const [searchTerms, searchTags] = parseQueryString(queryString);

  const { specialSearchTerms, fulltextSearchTerms } =
    extractFulltextAndSpecialSearchTerms(searchTerms);

  let filter = {};
  filter = setPublicOrPersonalFilter(isPublic, filter, userId);
  filter = setTagsToFilter(searchTags, filter);
  filter = setFulltextSearchTermsFilter(
    fulltextSearchTerms,
    filter,
    searchInclude
  );
  filter = setSpecialSearchTermsFilter(
    docType,
    isPublic,
    userId,
    specialSearchTerms,
    filter
  );
  const sortBy = getSortByObject(sort, fulltextSearchTerms);

  return {
    filter: filter,
    sortBy: sortBy,
  };
};

module.exports = {
  parseQueryString: parseQueryString,
  extractFulltextAndSpecialSearchTerms: extractFulltextAndSpecialSearchTerms,
  generateFullSearchText: generateFullSearchText,
  setFulltextSearchTermsFilter: setFulltextSearchTermsFilter,
  setPublicOrPersonalFilter: setPublicOrPersonalFilter,
  setTagsToFilter: setTagsToFilter,
  setSpecialSearchTermsFilter: setSpecialSearchTermsFilter,
  getSortByObject: getSortByObject,
  generateSearchFilterAndSortBy: generateSearchFilterAndSortBy,
};
