const personalBookmarksSearchService = require('./bookmarks/personal-bookmarks-search.service');
const personalSnippetsSearchService = require('../../common/snippets-search.service');
const personalNotesSearchService = require('../../common/notes-search.service');

let getPersonalSearchResults = async function (userId, query, page, limit, searchInclude) {

  const foundBookmarks = await personalBookmarksSearchService.findPersonalBookmarks(userId, query, page, limit, searchInclude);
  const foundSnippets = await personalSnippetsSearchService.findSnippets(userId, query, page, limit, searchInclude);
  const foundNotes = await personalNotesSearchService.findNotes(userId, query, page, limit, searchInclude);

  return merge([foundBookmarks, foundSnippets, foundNotes], scoreDescending);
  //return mergeResultsByScore(foundBookmarks, foundSnippets);
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

function merge(arrays, sortFunc) {
  let result = [], next;

  // Add an 'index' property to each array to keep track of where we are in it.
  arrays.forEach(array => array.index = 0);

  // Find the next array to pull from.
  // Just sort the list of arrays by their current value and take the first one.
  function findNext() {
    return arrays.filter(array => array.index < array.length)
        .sort((a, b) => sortFunc(a[a.index], b[b.index]))[0];
  }

  // This is the heart of the algorithm.
  while (next = findNext()) result.push(next[next.index++]);

  return result;
}

function scoreDescending(a, b) { return b.score - a.score; }

module.exports = {
  getPersonalSearchResults: getPersonalSearchResults
};
