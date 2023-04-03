db.users.update(
  { ignoredTags: { $exists: false } },
  { $set: { ignoredTags: [] } },
  { multi: true }
);
