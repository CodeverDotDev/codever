db.bookmarks.find().forEach(
  function(e) {
    for(var i = 0; i < e.tags.length; i++) {
      e.tags[i] = e.tags[i].toLowerCase();
    }
    db.bookmarks.save(e);
  }
);
