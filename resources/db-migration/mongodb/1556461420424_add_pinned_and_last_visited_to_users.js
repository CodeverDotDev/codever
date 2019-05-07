db.users.update(
  { "pinned": { "$exists": false } },
  { "$set": { "pinned": [] } },
  { "multi": true }
);

db.users.update(
  { "history": { "$exists": false } },
  { "$set": { "history": [] } },
  { "multi": true }
);
