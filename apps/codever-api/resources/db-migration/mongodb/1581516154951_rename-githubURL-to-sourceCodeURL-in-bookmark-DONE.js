db.bookmarks.updateMany({}, { $rename: { githubURL: 'sourceCodeURL' } });

//recreate weighted_text_index.js
db.bookmarks.getIndexes();
db.bookmarks.dropIndex('full_text_search');

//recreate index from file - 1553664393888_create_weighted_text_index.js
