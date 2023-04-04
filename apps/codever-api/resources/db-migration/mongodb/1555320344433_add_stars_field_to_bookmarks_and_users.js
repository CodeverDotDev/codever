//add stars field to the "bookmarks" collection
db.bookmarks.find().forEach((bookmark) => {
  db.bookmarks.update(
    {
      _id: bookmark._id,
    },
    {
      $set: {
        stars: bookmark.starredBy ? bookmark.starredBy.length : 0,
      },
    }
  );
});

//add stars field to the "users" collection
db.users.find().forEach((user) => {
  print('userid: ' + user._id);
  const bookmarks = db.bookmarks.find({ starredBy: user.userId }).toArray();

  var stars = []; // let does not work in mongo 3.2?
  bookmarks.forEach((bookmark) => {
    stars.push(bookmark._id.valueOf());
  });

  db.users.update(
    {
      _id: user._id,
    },
    {
      $set: {
        stars: stars,
      },
    }
  );
});
