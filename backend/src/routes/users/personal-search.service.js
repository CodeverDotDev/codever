const personalBookmarksSearchService = require('../../common/bookmarks-search.service');
const personalSnippetsSearchService = require('../../common/snippets-search.service');
const personalNotesSearchService = require('./notes/notes-search.service');

let getPersonalSearchResults = async function (userId, query, page, limit, searchInclude) {

  const foundBookmarks = await personalBookmarksSearchService.findPersonalBookmarks(userId, query, page, limit, searchInclude);
  const foundSnippets = await personalSnippetsSearchService.findPersonalSnippets(userId, query, page, limit, searchInclude);
  const foundNotes = await personalNotesSearchService.findPersonalNotes(userId, query, page, limit, searchInclude);

  return merge([foundBookmarks, foundSnippets, foundNotes], scoreDescending);
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
