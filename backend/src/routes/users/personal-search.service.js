const personalBookmarksSearchService = require('./bookmarks/personal-bookmarks-search.service');
const personalSnippetsSearchService = require('../../common/snippets-search.service');

let getPersonalSearchResults = async function (userId, query, page, limit, searchInclude) {

  const foundBookmarks = await personalBookmarksSearchService.findPersonalBookmarks(userId, query, page, limit, searchInclude);
  const foundSnippets = await personalSnippetsSearchService.findSnippets(userId, query, page, limit, searchInclude);

  return mergeResultsByScore(foundBookmarks, foundSnippets);
}

function mergeResultsByScore(arr1, arr2) {
  let i = 0;
  let j = 0;
  let result = [];
  while (i < arr1.length && j < arr2.length) {
    if ( arr1[i].score >= arr2[j].score ) {
      result.push(arr1[i]);
      i++;
    } else {
      result.push(arr2[j]);
      j++;
    }
  }
  while (i < arr1.length) {
    result.push(arr1[i]);
    i++;
  }
  while (j < arr2.length) {
    result.push(arr2[j]);
    j++;
  }
  return result;
}

module.exports = {
  getPersonalSearchResults: getPersonalSearchResults
};
