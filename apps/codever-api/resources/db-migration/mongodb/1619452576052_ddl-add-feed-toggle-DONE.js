db.users.update(
  { showAllPublicInFeed: { $exists: false } },
  { $set: { showAllPublicInFeed: false } },
  { multi: true }
);
