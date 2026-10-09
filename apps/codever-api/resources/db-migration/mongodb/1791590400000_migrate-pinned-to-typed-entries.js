// Migration: convert each user-data `pinned` array from bare resource ids to typed
// entries ({ type, id }) so bookmarks, notes, and collections can coexist without
// ambiguity. Existing bare ids are classified by looking them up in the `bookmarks`
// and `notes` collections; ids that match neither (already-deleted resources) are
// dropped.
//
// Run against the intended database with mongosh, e.g.:
//   docker exec -i codever-mongo \
//     mongosh --quiet --username mongoadmin --password secret \
//     --authenticationDatabase admin dev-bookmarks \
//     < apps/codever-api/resources/db-migration/mongodb/1791590400000_migrate-pinned-to-typed-entries.js
//
// Rollback (flatten typed entries back to bare ids) - set before loading:
//   PINNED_TYPED_ENTRIES_ROLLBACK = true

function getCollection(database, collectionName) {
  if (typeof database.collection === 'function') {
    return database.collection(collectionName);
  }
  if (typeof database.getCollection === 'function') {
    return database.getCollection(collectionName);
  }
  throw new TypeError('Unsupported MongoDB database object');
}

function isTypedEntry(entry) {
  return entry !== null && typeof entry === 'object' && entry.type && entry.id;
}

async function migratePinnedToTypedEntries(database, rollback = false) {
  const users = getCollection(database, 'users');
  const usersWithPinned = await users
    .find({ 'pinned.0': { $exists: true } })
    .toArray();

  if (rollback) {
    let flattenedUsers = 0;
    for (const user of usersWithPinned) {
      const flattened = (user.pinned || []).map((entry) =>
        isTypedEntry(entry) ? entry.id : entry
      );
      await users.updateOne({ _id: user._id }, { $set: { pinned: flattened } });
      flattenedUsers++;
    }
    return { usersProcessed: flattenedUsers };
  }

  // Collect every bare id once so classification is two bulk queries in total,
  // regardless of how many users (or pinned entries) there are.
  const bareIds = [];
  for (const user of usersWithPinned) {
    for (const entry of user.pinned || []) {
      if (!isTypedEntry(entry)) {
        bareIds.push(entry);
      }
    }
  }

  if (bareIds.length === 0) {
    return { usersProcessed: 0, entriesClassified: 0, entriesDropped: 0 };
  }

  const [bookmarks, notes] = await Promise.all([
    getCollection(database, 'bookmarks')
      .find({ _id: { $in: bareIds } }, { projection: { _id: 1 } })
      .toArray(),
    getCollection(database, 'notes')
      .find({ _id: { $in: bareIds } }, { projection: { _id: 1 } })
      .toArray(),
  ]);

  // Bookmarks win on the (practically impossible) ObjectId collision.
  const idToType = new Map();
  for (const note of notes) {
    idToType.set(String(note._id), 'note');
  }
  for (const bookmark of bookmarks) {
    idToType.set(String(bookmark._id), 'bookmark');
  }

  let entriesClassified = 0;
  let entriesDropped = 0;

  for (const user of usersWithPinned) {
    const typedEntries = [];
    for (const entry of user.pinned || []) {
      if (isTypedEntry(entry)) {
        typedEntries.push({ type: entry.type, id: entry.id });
        continue;
      }
      const type = idToType.get(String(entry));
      if (type) {
        typedEntries.push({ type, id: entry });
        entriesClassified++;
      } else {
        entriesDropped++;
      }
    }
    await users.updateOne({ _id: user._id }, { $set: { pinned: typedEntries } });
  }

  return {
    usersProcessed: usersWithPinned.length,
    entriesClassified,
    entriesDropped,
  };
}

if (typeof module !== 'undefined') {
  module.exports = { migratePinnedToTypedEntries };
}
if (typeof db !== 'undefined') {
  migratePinnedToTypedEntries(
    db,
    typeof PINNED_TYPED_ENTRIES_ROLLBACK !== 'undefined' &&
      PINNED_TYPED_ENTRIES_ROLLBACK
  );
}
