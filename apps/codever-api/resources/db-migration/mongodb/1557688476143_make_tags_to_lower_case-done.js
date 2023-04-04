db.bookmarks.find().forEach(function (e) {
  for (var i = 0; i < e.tags.length; i++) {
    e.tags[i] = e.tags[i].toLowerCase();
  }
  db.bookmarks.save(e);
});

//other variant is with the map function
db.bookmarks.find().forEach(function (e) {
  e.tags = e.tags.map(function (tag) {
    return tag.toLowerCase();
  });
  db.bookmarks.save(e);
});
