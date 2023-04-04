db.users.update(
  { 'following.users': { $exists: false } },
  { $set: { 'following.users': [] } },
  { multi: true }
);

db.users.update(
  { followers: { $exists: true } },
  { $set: { followers: [] } },
  { multi: true }
);

/* Reset for local development
db.users.update(
  { },
  { "$set": { "followers": [] } },
  { "multi": true }
);

db.users.update(
  { },
  { "$set": { "following.users": [] } },
  { "multi": true }
);
*/
