// Run against the intended database with mongosh (see docs/copyable-fields.md).
// Set COPYABLE_FIELDS_ROLLBACK = true before loading to restore old weights.
async function migrateCopyableFields(database, rollback = false) {
  const definitions = [
    { collection: 'bookmarks', name: 'full_text_search',
      weights: { name: 13, location: 8, description: 5, tags: 21, sourceCodeURL: 3 } },
    { collection: 'notes', name: 'notes_full_text_search',
      weights: { title: 13, reference: 3, content: 5, tags: 21 } },
  ];
  // Preflight both collections before dropping anything. Never silently replace
  // an unexpected text index with unknown settings.
  for (const definition of definitions) {
    const indexes = await database.collection(definition.collection).indexes();
    const acceptedNames = definition.collection === 'bookmarks'
      ? ['full_text_search', 'bookmarks_full_text_search'] : [definition.name];
    const unexpected = indexes.find(index => index.weights && !acceptedNames.includes(index.name));
    if (unexpected) throw new Error(`Unexpected text index ${unexpected.name}; review before migrating`);
    const existing = indexes.find(index => index.weights);
    if (existing) definition.name = existing.name;
  }
  for (const definition of definitions) {
    const collection = database.collection(definition.collection);
    const indexes = await collection.indexes();
    if (indexes.some(index => index.name === definition.name)) {
      await collection.dropIndex(definition.name);
    }
    const weights = { ...definition.weights };
    if (!rollback) {
      weights.tags = 10;
      weights['copyableFields.label'] = 1;
      weights['copyableFields.value'] = 1;
    }
    const keys = Object.fromEntries(Object.keys(weights).map(key => [key, 'text']));
    await collection.createIndex(keys, {
      name: definition.name, weights, default_language: 'none', language_override: 'none',
    });
  }
}

if (typeof module !== 'undefined') module.exports = { migrateCopyableFields };
if (typeof db !== 'undefined') {
  migrateCopyableFields(db, typeof COPYABLE_FIELDS_ROLLBACK !== 'undefined' && COPYABLE_FIELDS_ROLLBACK);
}

