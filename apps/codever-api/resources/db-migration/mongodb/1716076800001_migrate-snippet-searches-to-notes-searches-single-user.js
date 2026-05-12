// Migration: rename snippet search domains to notes search domains for a SINGLE user.
//
// Why: after the snippets → notes migration, any saved or recent searches with
//   searchDomain = 'my-snippets'      should become  searchDomain = 'my-notes'
//   searchDomain = 'public-snippets'  should become  searchDomain = 'public-notes'
//
// Set TARGET_USER_ID to the Keycloak userId of the user to migrate, then run:
//   mongo <host>/<db> -u <user> -p <password> migrate-snippet-searches-to-notes-searches-single-user.js
//
// For local Docker testing:
//   mongo localhost/codever < migrate-snippet-searches-to-notes-searches-single-user.js

var TARGET_USER_ID = '33d22b0e-9474-46b3-9da4-b1fb5d273abc';

var migratedSearches = 0;

var user = db.users.findOne({ userId: TARGET_USER_ID });

if (!user) {
  print('ERROR: user not found for userId: ' + TARGET_USER_ID);
} else {
  var updatedSearches = [];
  var needsUpdating = false;

  if (user.searches) {
    user.searches.forEach(function(search) {
      if (search.searchDomain === 'my-snippets') {
        search.searchDomain = 'my-notes';
        needsUpdating = true;
        migratedSearches++;
        print('  Remapped my-snippets → my-notes for search: "' + search.text + '"');
      } else if (search.searchDomain === 'public-snippets') {
        search.searchDomain = 'public-notes';
        needsUpdating = true;
        migratedSearches++;
        print('  Remapped public-snippets → public-notes for search: "' + search.text + '"');
      }
      updatedSearches.push(search);
    });
  }

  if (needsUpdating) {
    db.users.update(
      { _id: user._id },
      { $set: { searches: updatedSearches } }
    );
    print('Done. Updated ' + migratedSearches + ' search(es) for userId: ' + TARGET_USER_ID);
  } else {
    print('No snippet searches found for userId: ' + TARGET_USER_ID + ' — nothing to migrate.');
  }
}

