db.users.createIndex(
  {
    userId: 1,
  },
  {
    unique: true,
    name: 'unique_userId',
  }
);

//show indexes (verify is present)
db.users.getIndexes();
