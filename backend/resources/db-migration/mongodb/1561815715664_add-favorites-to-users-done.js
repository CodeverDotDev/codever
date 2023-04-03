db.users.update(
  { favorites: { $exists: false } },
  { $set: { favorites: [] } },
  { multi: true }
);
