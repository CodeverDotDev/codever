// Migration: collapse all legacy search domains into the two current domains.
//
// Why: the search bar now only offers "all-mine" and "all-public".  Previously
//   there were separate domains per resource type.  This migration remaps all
//   legacy values so existing saved/recent searches keep working:
//
//   my-bookmarks    →  all-mine
//   my-notes        →  all-mine
//   my-snippets     →  all-mine      (in case the previous snippet→notes migration was skipped)
//   public-bookmarks → all-public
//   public-notes    →  all-public
//   public-snippets  → all-public    (in case the previous snippet→notes migration was skipped)
//
// This updates the `searches` array on every user document in the `users` collection.
//
// Run against ALL users (production):
//   mongo <host>/<db> -u <user> -p <password> 1749254400000_migrate-legacy-searches-to-all-mine-all-public.js
//
// Run against a SINGLE user (for testing or partial rollout):
//   Set TARGET_USER_ID below and run:
//   mongo <host>/<db> -u <user> -p <password> 1749254400000_migrate-legacy-searches-to-all-mine-all-public-single-user.js

var migratedUsers = 0;
var migratedSearches = 0;

db.users.find({}).forEach(function(user) {
  var updatedSearches = [];
  var needsUpdating = false;

  if (user.searches) {
    user.searches.forEach(function(search) {
      if (search.searchDomain === 'my-bookmarks' ||
          search.searchDomain === 'my-notes' ||
          search.searchDomain === 'my-snippets') {
        search.searchDomain = 'all-mine';
        needsUpdating = true;
        migratedSearches++;
      } else if (search.searchDomain === 'public-bookmarks' ||
                 search.searchDomain === 'public-notes' ||
                 search.searchDomain === 'public-snippets') {
        search.searchDomain = 'all-public';
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
