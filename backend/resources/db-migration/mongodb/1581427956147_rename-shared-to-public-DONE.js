db.bookmarks.updateMany({}, { $rename: { shared: 'public' } });
