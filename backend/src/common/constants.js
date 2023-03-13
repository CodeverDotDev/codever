const ENV = {
  'DEV': 'development',
  'TEST': 'test',
  'PROD': 'production'
}

const DocType = {
  BOOKMARK: 'bookmark',
  SNIPPET: 'snippet',
  NOTE: 'note'
}
const MAX_NUMBER_RETURNED_RESULTS = 55;
const MAX_NUMBER_STORED_BOOKMARKS_FOR_PERSONAL_STORE = 50;

module.exports = {
  ENV,
  DocType,
  MAX_NUMBER_RETURNED_RESULTS,
  MAX_NUMBER_STORED_BOOKMARKS_FOR_PERSONAL_STORE,
}
