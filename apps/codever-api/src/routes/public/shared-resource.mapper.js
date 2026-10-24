const BOOKMARK_FIELDS = [
  '_id',
  'type',
  'name',
  'location',
  'description',
  'descriptionHtml',
  'tags',
  'copyableFields',
  'publishedOn',
  'sourceCodeURL',
  'language',
  'youtubeVideoId',
  'stackoverflowQuestionId',
  'createdAt',
  'updatedAt',
];

const NOTE_FIELDS = [
  '_id',
  'type',
  'title',
  'content',
  'contentType',
  'reference',
  'tags',
  'copyableFields',
  'createdAt',
  'updatedAt',
];

const mapFields = (resource, fields) =>
  fields.reduce((mapped, field) => {
    if (resource[field] !== undefined) {
      mapped[field] = resource[field];
    }
    return mapped;
  }, {});

const mapSharedBookmark = (bookmark) =>
  mapFields(bookmark, BOOKMARK_FIELDS);

const mapSharedNote = (note) => {
  const mapped = mapFields(note, NOTE_FIELDS);
  if (note.contentType === 'notebook' && note.notebookContent !== undefined) {
    mapped.notebookContent = note.notebookContent;
  }
  return mapped;
};

module.exports = { mapSharedBookmark, mapSharedNote };
