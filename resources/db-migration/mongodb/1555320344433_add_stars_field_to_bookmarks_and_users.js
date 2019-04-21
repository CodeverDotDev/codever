//add stars field to the "bookmarks" collection
db.bookmarks.find().forEach(bookmark => {
  print("Id: " + bookmark._id);
  db.bookmarks.update(
    {
      _id: bookmark._id
    },
    {
      $set: {
        "stars": bookmark.starredBy ? bookmark.starredBy.length : 0
      }
    })
});

//add stars field to the "users" collection
db.users.find().forEach(user => {
  print("userid: " + user._id);
  const bookmarks = db.bookmarks.find({starredBy: user.userId}).toArray();

  let stars = [];
  bookmarks.forEach(bookmark => {
    stars.push(bookmark._id.valueOf());
  });

  db.users.update(
    {
      _id: user._id
    },
    {
      $set: {
        "stars": stars
      }
    })
});
