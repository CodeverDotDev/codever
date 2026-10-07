/* global TEXT_INDEX_WEIGHTS_ROLLBACK */
// Run against the intended database with mongosh (see docs/copyable-fields.md).
// Set TEXT_INDEX_WEIGHTS_ROLLBACK = true before loading to restore the previous
// copyable-fields weights (name/title 13 and tags 10).
function getCollection(database, collectionName) {
  if (typeof database.collection === 'function') {
    return database.collection(collectionName);
  }
  if (typeof database.getCollection === 'function') {
    return database.getCollection(collectionName);
  }
  throw new TypeError('Unsupported MongoDB database object');
}

async function listIndexes(collection) {
  if (typeof collection.indexes === 'function') {
    return collection.indexes();
  }
  if (typeof collection.getIndexes === 'function') {
    return collection.getIndexes();
  }
  throw new TypeError('Unsupported MongoDB collection object');
}

async function adjustBookmarkNoteTextIndexWeights(database, rollback = false) {
  const definitions = [
    {
      collection: 'bookmarks',
      name: 'full_text_search',
      acceptedNames: ['full_text_search', 'bookmarks_full_text_search'],
      fields: {
        name: 'text',
        location: 'text',
        description: 'text',
        tags: 'text',
        sourceCodeURL: 'text',
        'copyableFields.label': 'text',
        'copyableFields.value': 'text',
      },
      weights: {
        name: 21,
        location: 8,
        description: 5,
        tags: 8,
        sourceCodeURL: 3,
        'copyableFields.label': 1,
        'copyableFields.value': 1,
      },
      rollbackWeights: {
        name: 13,
        location: 8,
        description: 5,
        tags: 10,
        sourceCodeURL: 3,
        'copyableFields.label': 1,
        'copyableFields.value': 1,
      },
    },
    {
      collection: 'notes',
      name: 'notes_full_text_search',
      acceptedNames: ['notes_full_text_search'],
      fields: {
        title: 'text',
        reference: 'text',
        content: 'text',
        tags: 'text',
        'copyableFields.label': 'text',
        'copyableFields.value': 'text',
      },
      weights: {
        title: 21,
        reference: 3,
        content: 5,
        tags: 8,
        'copyableFields.label': 1,
        'copyableFields.value': 1,
      },
      rollbackWeights: {
        title: 13,
        reference: 3,
        content: 5,
        tags: 10,
        'copyableFields.label': 1,
        'copyableFields.value': 1,
      },
    },
  ];

  // Preflight both collections before dropping anything. Never silently replace
  // an unexpected text index with unknown settings.
  for (const definition of definitions) {
    const indexes = await listIndexes(
      getCollection(database, definition.collection)
    );
    const unexpected = indexes.find(
      (index) => index.weights && !definition.acceptedNames.includes(index.name)
    );
    if (unexpected) {
      throw new Error(
        `Unexpected text index ${unexpected.name}; review before migrating`
      );
    }
    const existing = indexes.find((index) => index.weights);
    if (existing) definition.name = existing.name;
  }

  for (const definition of definitions) {
    const collection = getCollection(database, definition.collection);
    const indexes = await listIndexes(collection);
    if (indexes.some((index) => index.name === definition.name)) {
      await collection.dropIndex(definition.name);
    }
    await collection.createIndex(definition.fields, {
      name: definition.name,
      weights: rollback ? definition.rollbackWeights : definition.weights,
      default_language: 'none',
      language_override: 'none',
    });
  }

  // Read the weights back so callers can confirm the applied configuration.
  const applied = [];
  for (const definition of definitions) {
    const collection = getCollection(database, definition.collection);
    const indexes = await listIndexes(collection);
    const current = indexes.find((index) => index.name === definition.name);
    applied.push({
      collection: definition.collection,
      name: definition.name,
      weights: current ? current.weights : null,
    });
  }
  return applied;
}

if (typeof module !== 'undefined') {
  module.exports = { adjustBookmarkNoteTextIndexWeights };
}
if (typeof db !== 'undefined') {
  const rollback =
    typeof TEXT_INDEX_WEIGHTS_ROLLBACK !== 'undefined' &&
    TEXT_INDEX_WEIGHTS_ROLLBACK;
  adjustBookmarkNoteTextIndexWeights(db, rollback)
    .then((applied) => {
      print(
        `Text index weights ${rollback ? 'rolled back' : 'updated'} successfully:`
      );
      printjson(applied);
    })
    .catch((error) => {
      print('Text index weight migration FAILED:');
      print(error.message);
      throw error;
    });
}


