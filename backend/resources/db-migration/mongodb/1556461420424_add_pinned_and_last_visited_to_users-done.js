db.users.update(
  { pinned: { $exists: false } },
  { $set: { pinned: [] } },
  { multi: true }
);
