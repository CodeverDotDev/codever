db.users.find().forEach(function (user) {
  // print('\nuser ' + user._id);
  user.history.forEach(function (bookmarkId) {
    var bookmark = db.bookmarks.findOne({ _id: ObjectId(bookmarkId) });
    // printjson(bookmark);
    if (!bookmark) {
      db.users.update({ _id: user._id }, { $pull: { history: bookmarkId } });
      print('not found ' + bookmarkId);
    }
  });
});

db.users.find().forEach(function (user) {
  // print('\nuser ' + user._id);
  user.pinned.forEach(function (bookmarkId) {
    var bookmark = db.bookmarks.findOne({ _id: ObjectId(bookmarkId) });
    // printjson(bookmark);
    if (!bookmark) {
      db.users.update({ _id: user._id }, { $pull: { pinned: bookmarkId } });
      print('not found ' + bookmarkId);
    }
  });
});

db.users.find().forEach(function (user) {
  print('\nuser ' + user._id);
  user.readLater.forEach(function (bookmarkId) {
    var bookmark = db.bookmarks.findOne({ _id: ObjectId(bookmarkId) });
    // printjson(bookmark);
    if (!bookmark) {
      db.users.update({ _id: user._id }, { $pull: { readLater: bookmarkId } });
      print('not found ' + bookmarkId);
    }
  });
});

db.users.find().forEach(function (user) {
  print('\nuser ' + user._id);
  var uniqueReadLater = user.readLater.filter(function (x, i, a) {
    return a.indexOf(x) == i;
  });
  db.users.update({ _id: user._id }, { $set: { readLater: uniqueReadLater } });
});
