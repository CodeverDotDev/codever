const ENV = {
  DEV: 'development',
  TEST: 'test',
  PROD: 'production',
};

const DocType = {
  BOOKMARK: 'bookmark',
  NOTE: 'note',
};
const MAX_NUMBER_RETURNED_RESULTS = 55;
const MAX_NUMBER_STORED_BOOKMARKS_FOR_PERSONAL_STORE = 50;
const ALLOWED_HOME_TABS = ['feed', 'history', 'pinned', 'read-later'];

module.exports = {
  ENV,
  DocType,
  MAX_NUMBER_RETURNED_RESULTS,
  MAX_NUMBER_STORED_BOOKMARKS_FOR_PERSONAL_STORE,
  ALLOWED_HOME_TABS,
};
