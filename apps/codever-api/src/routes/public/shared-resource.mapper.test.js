const {
  mapSharedBookmark,
  mapSharedNote,
} = require('./shared-resource.mapper');

describe('shared-resource mapper', () => {
  test('allows only bookmark content fields', () => {
    const bookmark = {
      _id: 'bookmark-id',
      type: 'bookmark',
      name: 'Bookmark',
      location: 'https://example.com',
      description: 'Description',
      descriptionHtml: '<p>Description</p>',
      tags: ['tag'],
      copyableFields: [{ name: 'user', value: 'owner' }],
      publishedOn: new Date('2026-01-01T00:00:00Z'),
      sourceCodeURL: 'https://github.com/example/repo',
      language: 'en',
      youtubeVideoId: 'video',
      stackoverflowQuestionId: 42,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-02T00:00:00Z'),
      userId: 'owner',
      userDisplayName: 'Owner',
      public: false,
      shareableId: 'legacy-token',
      ownerVisitCount: 3,
      injectedField: 'not allowed',
    };

    expect(mapSharedBookmark(bookmark)).toEqual({
      _id: 'bookmark-id',
      type: 'bookmark',
      name: 'Bookmark',
      location: 'https://example.com',
      description: 'Description',
      descriptionHtml: '<p>Description</p>',
      tags: ['tag'],
      copyableFields: [{ name: 'user', value: 'owner' }],
      publishedOn: bookmark.publishedOn,
      sourceCodeURL: 'https://github.com/example/repo',
      language: 'en',
      youtubeVideoId: 'video',
      stackoverflowQuestionId: 42,
      createdAt: bookmark.createdAt,
      updatedAt: bookmark.updatedAt,
    });
  });

  test('includes notebook source only for notebook notes', () => {
    const notebook = {
      _id: 'note-id',
      type: 'note',
      title: 'Notebook',
      content: 'Extracted text',
      contentType: 'notebook',
      reference: 'https://example.com',
      tags: ['python'],
      copyableFields: [],
      notebookContent: '{"cells":[]}',
      userId: 'owner',
      origin: { file: 'private.ipynb' },
      public: false,
      shareableId: 'legacy-token',
      injectedField: 'not allowed',
    };
    const markdown = {
      _id: 'markdown-id',
      type: 'note',
      title: 'Markdown',
      content: 'Body',
      contentType: 'markdown',
      notebookContent: 'not for markdown',
      userId: 'owner',
    };

    expect(mapSharedNote(notebook)).toEqual({
      _id: 'note-id',
      type: 'note',
      title: 'Notebook',
      content: 'Extracted text',
      contentType: 'notebook',
      reference: 'https://example.com',
      tags: ['python'],
      copyableFields: [],
      notebookContent: '{"cells":[]}',
    });
    expect(mapSharedNote(markdown)).toEqual({
      _id: 'markdown-id',
      type: 'note',
      title: 'Markdown',
      content: 'Body',
      contentType: 'markdown',
    });
  });
});
