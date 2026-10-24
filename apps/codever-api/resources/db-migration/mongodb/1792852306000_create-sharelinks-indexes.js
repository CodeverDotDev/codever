// Creates the indexes required by the resource-sharing ShareLink model.
// Run against the intended database with mongosh (see mongodb/README.md).
function getCollection(database, collectionName) {
  if (typeof database.collection === 'function') {
    return database.collection(collectionName);
  }
  if (typeof database.getCollection === 'function') {
    return database.getCollection(collectionName);
  }
  throw new TypeError('Unsupported MongoDB database object');
}

async function migrateShareLinkIndexes(database) {
  const collection = getCollection(database, 'sharelinks');

  await collection.createIndex(
    { token: 1 },
    { name: 'token_1', unique: true }
  );
  await collection.createIndex(
    { resourceType: 1, resourceId: 1 },
    {
      name: 'resourceType_1_resourceId_1',
      unique: true,
      partialFilterExpression: { active: true },
    }
  );
  await collection.createIndex(
    { ownerUserId: 1, active: 1, createdAt: -1, _id: -1 },
    { name: 'ownerUserId_1_active_1_createdAt_-1__id_-1' }
  );

  console.log('ShareLink indexes created successfully.');
}

if (typeof module !== 'undefined') {
  module.exports = { migrateShareLinkIndexes };
}
if (typeof db !== 'undefined') {
  migrateShareLinkIndexes(db);
}
