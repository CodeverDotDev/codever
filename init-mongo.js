db.createUser(
  {
    user: "bookmarks",
    pwd: "secret",
    roles: [
      {
        role: "readWrite",
        db: "dev-bookmarks"
      }
    ]
  }
)
