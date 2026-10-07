/* ****** Bookmarks ****** */
// delete old index
db.bookmarks.dropIndex('full_text_search');
db.bookmarks.dropIndex('bookmarks_full_text_search');

//recreate index
db.bookmarks.createIndex(
  {
    name: 'text',
    location: 'text',
    description: 'text',
    tags: 'text',
    'copyableFields.label': 'text',
    'copyableFields.value': 'text',
    sourceCodeURL: 'text',
  },
  {
    weights: {
      name: 13,
      location: 8,
      description: 5,
      tags: 10,
      'copyableFields.label': 1,
      'copyableFields.value': 1,
      sourceCodeURL: 3,
    },
    name: 'bookmarks_full_text_search',
    default_language: 'none',
    language_override: 'none',
  }
);
