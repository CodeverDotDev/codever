db.users.find({}).forEach(function (user) {
  var updatedSearches = [];
  var needsUpdating = false;
  if (user.searches) {
    user.searches.forEach(function (search) {
      if (!search.searchDomain) {
        needsUpdating = true;
        search.searchDomain = 'my-bookmarks';
        //var newSearch = Object.assign({}, search);
        /*            newSearch.searchDomain = 'public-bookmarks';
            updatedSearches.push(newSearch);*/
      } else {
        if (search.searchDomain === 'public') {
          needsUpdating = true;
          search.searchDomain = 'public-bookmarks';
        }

        if (search.searchDomain === 'personal') {
          needsUpdating = true;
          search.searchDomain = 'my-bookmarks';
        }
      }
      updatedSearches.push(search);
    });
    //printjson(updatedSearches);
    if (needsUpdating) {
      db.users.update(
        { _id: user._id },
        { $set: { searches: updatedSearches } }
      );
      print('needed update');
    } else {
      print('NO update needed');
    }
  }
});

// // Test on one user only before
// db.users.find({userId : "e785a9fd-506f-49f7-9c97-6fcae98a9ea6"}).pretty();
// db.users.find({_id :  ObjectId("5e9f3f5e7ebf916fc459ab84")}).pretty();
// db.users.find({userId :  "33d22b0e-9474-46b3-9da4-b1fb5d273abc"}).pretty();
// db.users.find({userId :  "33d22b0e-9474-46b3-9da4-b1fb5d273abc"}).pretty();
// db.users.find({userId : "03e59ab3-4001-4d8f-a88b-a1542aa70483"}).forEach(
//   function(user) {
//     var newSearch =
//     {
//       "text" : "new new search",
//       "createdAt" : ISODate("2020-05-27T19:06:36.562Z"),
//       "lastAccessedAt" : ISODate("2020-05-27T19:06:19.824Z"),
//       "count" : 1,
//       "updatedAt" : ISODate("2020-05-27T19:06:36.562Z")
//     };
//
//     //printjson(updatedSearches);
//     db.users.update(
//       {_id: user._id},
//       {$push: {"searches": newSearch}}
//     );
//     printjson(user);
//   }
// );
