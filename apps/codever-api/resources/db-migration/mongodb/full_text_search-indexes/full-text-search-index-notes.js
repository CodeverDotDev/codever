/* ****** Bookmarks ****** */
// delete old index
db.notes.dropIndex('notes_full_text_search');

//recreate index
db.notes.createIndex(
  {
    title: 'text',
    reference: 'text',
    content: 'text',
    tags: 'text',
    'copyableFields.label': 'text',
    'copyableFields.value': 'text',
  },
  {
    weights: {
      title: 13,
      reference: 3,
      content: 5,
      tags: 10,
      'copyableFields.label': 1,
      'copyableFields.value': 1,
    },
    name: 'notes_full_text_search',
    default_language: 'none',
    language_override: 'none',
  }
);
