db.bookmarks.updateMany( {}, { $rename: { "stars": "likes" } } )
db.users.updateMany( {}, { $rename: { "stars": "likes" } } )
