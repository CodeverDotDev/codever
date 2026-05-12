// Migration: rename snippet search domains to notes search domains in user saved/recent searches.
//
// Why: after the snippets → notes migration, any saved or recent searches with
//   searchDomain = 'my-snippets'      should become  searchDomain = 'my-notes'
//   searchDomain = 'public-snippets'  should become  searchDomain = 'public-notes'
//
// This updates the `searches` array on every user document in the `users` collection.
//
// Run against ALL users (production):
//   mongo <host>/<db> -u <user> -p <password> migrate-snippet-searches-to-notes-searches.js
//
// Run against a SINGLE user (for testing or partial rollout):
//   Set TARGET_USER_ID below and run:
//   mongo <host>/<db> -u <user> -p <password> migrate-snippet-searches-to-notes-searches-single-user.js

var migratedUsers = 0;
var migratedSearches = 0;

db.users.find({}).forEach(function(user) {
  var updatedSearches = [];
  var needsUpdating = false;

  if (user.searches) {
    user.searches.forEach(function(search) {
      if (search.searchDomain === 'my-snippets') {
        search.searchDomain = 'my-notes';
        needsUpdating = true;
        migratedSearches++;
      } else if (search.searchDomain === 'public-snippets') {
        search.searchDomain = 'public-notes';
        needsUpdating = true;
        migratedSearches++;
      }
      updatedSearches.push(search);
    });
  }

  if (needsUpdating) {
    db.users.update(
      { _id: user._id },
      { $set: { searches: updatedSearches } }
    );
    migratedUsers++;
    print('Updated searches for userId: ' + user.userId);
  }
});

print('Done. Users updated: ' + migratedUsers + ', searches remapped: ' + migratedSearches);

