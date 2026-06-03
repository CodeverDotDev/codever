const bookmarksSearchService = require('../../common/searching/bookmarks-search.service');
const PublicNotesService = require('./public-notes.service');

let getPublicSearchResults = async function (
  query,
  page,
  limit,
  searchInclude
) {
  const foundBookmarks = await bookmarksSearchService.findPublicBookmarks(
    query,
    page,
    limit,
    searchInclude,
    'textScore'
  );
  const foundNotes = await PublicNotesService.searchPublicNotes(
    query,
    page,
    limit,
    searchInclude
  );

  return merge([foundBookmarks, foundNotes], scoreDescending);
};

function merge(arrays, sortFunc) {
  let result = [],
    next;

  // Add an 'index' property to each array to keep track of where we are in it.
  arrays.forEach((array) => (array.index = 0));

  // Find the next array to pull from.
  // Just sort the list of arrays by their current value and take the first one.
  function findNext() {
    return arrays
      .filter((array) => array.index < array.length)
      .sort((a, b) => sortFunc(a[a.index], b[b.index]))[0];
  }

  // This is the heart of the algorithm.
  // eslint-disable-next-line no-cond-assign
  while ((next = findNext())) result.push(next[next.index++]);

  return result;
}

function scoreDescending(a, b) {
  return b.score - a.score;
}

module.exports = {
  getPublicSearchResults: getPublicSearchResults,
};

