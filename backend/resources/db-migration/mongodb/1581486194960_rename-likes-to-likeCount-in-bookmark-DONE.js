db.bookmarks.updateMany({}, { $rename: { likes: 'likeCount' } });
