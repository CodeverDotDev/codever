db.codelets.createIndex({ userId: 1 });

// db.codelets.dropIndex('full_text_search')
db.codelets.createIndex(
  {
    title: 'text',
    tags: 'text',
    'codeSnippets.comment': 'text',
    'codeSnippets.code': 'text',
    sourceUrl: 'text',
  },
  {
    weights: {
      title: 8,
      tags: 13,
      'codeSnippets.comment': 3,
      'codeSnippets.code': 1,
      sourceUrl: 1,
    },
    name: 'full_text_search',
    default_language: 'none',
    language_override: 'none',
  }
);
