db.users.update(
  { recentSearches: { $exists: false } },
  { $set: { recentSearches: [] } },
  { multi: true }
);
