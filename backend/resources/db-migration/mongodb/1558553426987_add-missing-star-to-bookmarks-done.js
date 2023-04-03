db.bookmarks.update(
  { stars: { $exists: false } },
  { $set: { stars: 0 } },
  { multi: true }
);
