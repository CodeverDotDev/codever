// Migration script: Search domains – snippets → notes  (all users)
// =================================================================
// Updates every saved/recent search in the "users" collection where
// searchDomain === 'my-snippets'      →  'my-notes'
// searchDomain === 'public-snippets'  →  'public-notes'
//
// What it does:
//  - Iterates over every user document that has at least one search
//    entry with a snippet-based searchDomain.
//  - Replaces the searchDomain value in-place using a single
//    bulkWrite() call (one updateOne per affected user).
//
// Run with:
//   mongo <connectionString>/<dbName> migrate-searches-snippet-domains-to-notes.js
//
//   or in mongosh:
//   load("migrate-searches-snippet-domains-to-notes.js")
//
// The script is IDEMPOTENT: users whose searches already use note
// domains are not touched (their update operations are skipped because
// the $set expressions produce no change).
//
// IMPORTANT: Run against a database backup first!

// ─── migration ────────────────────────────────────────────────────────────────

var usersCollection = db.getCollection('users');

var stats = {
  usersScanned:  0,
  usersUpdated:  0,
  searchesFixed: 0,
  errors:        0,
};

// Find all users that have at least one search with a snippet domain.
var affectedUsers = usersCollection.find({
  'searches.searchDomain': { $in: ['my-snippets', 'public-snippets'] },
});

affectedUsers.forEach(function (user) {
  stats.usersScanned++;

  var changed = false;
  var updatedSearches = user.searches.map(function (s) {
    if (s.searchDomain === 'my-snippets') {
      stats.searchesFixed++;
      changed = true;
      return Object.assign({}, s, { searchDomain: 'my-notes' });
    }
    if (s.searchDomain === 'public-snippets') {
      stats.searchesFixed++;
      changed = true;
      return Object.assign({}, s, { searchDomain: 'public-notes' });
    }
    return s;
  });

  if (!changed) {
    return; // nothing to do for this user
  }

  try {
    usersCollection.updateOne(
      { _id: user._id },
      { $set: { searches: updatedSearches } }
    );
    stats.usersUpdated++;
    print('OK  userId=' + user.userId + '  fixed ' +
      updatedSearches.filter(function (s) {
        return s.searchDomain === 'my-notes' || s.searchDomain === 'public-notes';
      }).length + ' search(es)');
  } catch (e) {
    stats.errors++;
    print('ERROR  userId=' + user.userId + ': ' + e);
  }
});

// ─── summary ──────────────────────────────────────────────────────────────────

print('');
print('═══════════════════════════════════════════════════════');
print('Search-domain migration complete');
print('  Users scanned  : ' + stats.usersScanned);
print('  Users updated  : ' + stats.usersUpdated);
print('  Searches fixed : ' + stats.searchesFixed);
print('  Errors         : ' + stats.errors);
print('═══════════════════════════════════════════════════════');
print('');
print('Mappings applied:');
print('  my-snippets     →  my-notes');
print('  public-snippets →  public-notes');

