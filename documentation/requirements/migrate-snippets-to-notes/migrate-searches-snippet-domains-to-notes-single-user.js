// Migration script: Search domains – snippets → notes  (single user)
// ==================================================================
// Same as migrate-searches-snippet-domains-to-notes.js but scoped
// to ONE user. Set the TARGET_USER_ID variable below before running.
//
// Updates every saved/recent search in the "users" collection where
// searchDomain === 'my-snippets'      →  'my-notes'
// searchDomain === 'public-snippets'  →  'public-notes'
//
// Run with:
//   mongo <connectionString>/<dbName> migrate-searches-snippet-domains-to-notes-single-user.js
//
//   or in mongosh:
//   load("migrate-searches-snippet-domains-to-notes-single-user.js")
//
// The script is IDEMPOTENT: running it multiple times has no additional
// effect once the domains have already been updated.
//
// IMPORTANT: Run against a database backup first!

// ─── configure ────────────────────────────────────────────────────────────────

var TARGET_USER_ID = '33d22b0e-9474-46b3-9da4-b1fb5d273abc'; // <-- set this before running

// ─── migration ────────────────────────────────────────────────────────────────

var usersCollection = db.getCollection('users');

var user = usersCollection.findOne({
  userId: TARGET_USER_ID,
  'searches.searchDomain': { $in: ['my-snippets', 'public-snippets'] },
});

if (!user) {
  print('No searches with snippet domains found for userId=' + TARGET_USER_ID);
  print('Either the user does not exist or their searches are already migrated.');
} else {
  var searchesFixed = 0;

  var updatedSearches = user.searches.map(function (s) {
    if (s.searchDomain === 'my-snippets') {
      searchesFixed++;
      return Object.assign({}, s, { searchDomain: 'my-notes' });
    }
    if (s.searchDomain === 'public-snippets') {
      searchesFixed++;
      return Object.assign({}, s, { searchDomain: 'public-notes' });
    }
    return s;
  });

  try {
    usersCollection.updateOne(
      { _id: user._id },
      { $set: { searches: updatedSearches } }
    );
    print('');
    print('OK  userId=' + user.userId);
    print('  Searches fixed : ' + searchesFixed);
    print('');
    print('Mappings applied:');
    print('  my-snippets     →  my-notes');
    print('  public-snippets →  public-notes');
  } catch (e) {
    print('ERROR  userId=' + user.userId + ': ' + e);
  }
}

