db.users.update(
  { "watchedTags": { "$exists": false } },
  { "$set": { "watchedTags": [] } },
  { "multi": true }
);
