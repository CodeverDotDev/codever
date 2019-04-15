db.bookmarks.find().forEach(function(results)
{
  print( "Id: " + results._id );
  db.bookmarks.update(
    {
      _id : results._id
    },
    {
      $set: {
        "stars": results.starredBy ? results.starredBy.length : 0
      }
    })
});
