db.users.find().forEach(
  function(user) {
    user.favorites.forEach(
      function(bookmarkId) {
        var bookmark = db.bookmarks.findOne({ _id: ObjectId(bookmarkId)});
        if(bookmark.userId !== user.userId) { //maybe some have favorited their own bookmarks
          bookmark.userDisplayName = user.profile.displayName;
          bookmark.userId = user.userId;
          bookmark.public = false;
          bookmark.likeCount = 0;
          var now = new Date();
          bookmark.createdAt = now;
          bookmark.updatedAt = now;
          bookmark.lastAccessedAt = null;
          bookmark._id = new ObjectId()

          db.bookmarks.insert(bookmark);
          //print('userId: ' + user.userId);
          //printjson(bookmark);
        }
      }
    );
  }
);
