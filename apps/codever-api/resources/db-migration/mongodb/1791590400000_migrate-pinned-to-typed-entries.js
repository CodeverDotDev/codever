// Migration: convert each user-data `pinned` array from bare resource ids to typed
// entries ({ type, id }) so bookmarks, notes, and collections can coexist without
// ambiguity. Existing bare ids are classified by looking them up in the `bookmarks`
// and `notes` collections; ids that match neither (already-deleted resources) are
// dropped.
//
// NOTE: legacy `pinned` ids were persisted as strings (the old schema was `[String]`),
// while bookmark/note `_id`s are ObjectIds, so the script casts 24-hex strings to
// ObjectId for the lookup and for the stored typed entries.
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

/**
 * Resolve the ObjectId constructor in both runtimes: the `mongosh` shell exposes
 * it as a global, while the Node.js driver exposes it via `require('mongodb')`
 * (used by the offline verification harness).
 */
function resolveObjectId() {
  if (typeof ObjectId !== 'undefined' && ObjectId) {
    return ObjectId;
  }
  try {
    return require('mongodb').ObjectId;
  } catch (error) {
    return null;
  }
}

/**
 * Legacy `pinned` ids were persisted as strings (the old schema was `[String]`),
 * but bookmark/note `_id`s are ObjectIds. Cast 24-hex strings so lookups and the
 * stored typed entries use ObjectIds; leave anything else untouched.
 */
function toObjectIdIfPossible(value) {
  const ObjectIdCtor = resolveObjectId();
  if (
    ObjectIdCtor &&
    typeof value === 'string' &&
    /^[0-9a-fA-F]{24}$/.test(value)
  ) {
    return new ObjectIdCtor(value);
  }
  return value;
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
        isTypedEntry(entry) ? String(entry.id) : entry
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

  const queryIds = [];
  for (const bareId of bareIds) {
    queryIds.push(bareId);
    const objectId = toObjectIdIfPossible(bareId);
    // Compare by identity: a hex string casts to a distinct ObjectId instance,
    // while an already-ObjectId value (or a non-hex string) is returned as-is.
    if (objectId !== bareId) {
      queryIds.push(objectId);
    }
  }

  const [bookmarks, notes] = await Promise.all([
    getCollection(database, 'bookmarks')
      .find({ _id: { $in: queryIds } }, { projection: { _id: 1 } })
      .toArray(),
    getCollection(database, 'notes')
      .find({ _id: { $in: queryIds } }, { projection: { _id: 1 } })
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
  const droppedIds = [];

  for (const user of usersWithPinned) {
    const typedEntries = [];
    for (const entry of user.pinned || []) {
      if (isTypedEntry(entry)) {
        typedEntries.push({ type: entry.type, id: entry.id });
        continue;
      }
      const type = idToType.get(String(entry));
      if (type) {
        // Store the id as an ObjectId to match the typed-entry schema.
        typedEntries.push({ type, id: toObjectIdIfPossible(entry) });
        entriesClassified++;
      } else {
        droppedIds.push(String(entry));
      }
    }
    await users.updateOne({ _id: user._id }, { $set: { pinned: typedEntries } });
  }

  return {
    usersProcessed: usersWithPinned.length,
    entriesClassified,
    entriesDropped: droppedIds.length,
    droppedIds,
  };
}

if (typeof module !== 'undefined') {
  module.exports = { migratePinnedToTypedEntries };
}
if (typeof db !== 'undefined') {
  const rollback =
    typeof PINNED_TYPED_ENTRIES_ROLLBACK !== 'undefined' &&
    PINNED_TYPED_ENTRIES_ROLLBACK;
  migratePinnedToTypedEntries(db, rollback)
    .then((result) => {
      print('migrate-pinned-to-typed-entries completed successfully');
      printjson(result); // { usersProcessed, entriesClassified, entriesDropped, droppedIds }
    })
    .catch((error) => {
      print('migrate-pinned-to-typed-entries FAILED');
      printjson(error);
      throw error;
    });
}
