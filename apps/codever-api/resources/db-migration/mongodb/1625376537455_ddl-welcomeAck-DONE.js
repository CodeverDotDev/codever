db.users.update(
  { welcomeAck: { $exists: false } },
  { $set: { welcomeAck: true } },
  { multi: true }
);

//or the equivalent
db.users.updateMany(
  { welcomeAck: { $exists: false } },
  { $set: { welcomeAck: true } }
);
