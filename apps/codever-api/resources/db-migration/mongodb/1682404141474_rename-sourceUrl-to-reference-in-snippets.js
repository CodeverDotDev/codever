db.snippets.updateMany({}, { $rename: { sourceUrl: 'reference' } });

//recreate weighted_text_index.js for snippets
db.snippets.getIndexes();
db.snippets.dropIndex('full_text_search');

db.snippets.createIndex(
  {
    title: 'text',
    tags: 'text',
    'codeSnippets.comment': 'text',
    'codeSnippets.code': 'text',
    reference: 'text'
  },
  {
    weights: {
      title: 13,
      tags: 21,
      'codeSnippets.comment': 5,
      'codeSnippets.code': 1,
      reference: 3,
    },
    name: 'snippets_full_text_search',
    default_language: 'none',
    language_override: 'none',
  }
)
