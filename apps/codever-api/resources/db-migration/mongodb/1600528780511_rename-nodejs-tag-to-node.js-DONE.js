db.bookmarks.find({ public: true }).forEach(function (e) {
  var index = e.tags.indexOf('nodejs');
  var update = false;
  if (index !== -1) {
    e.tags[index] = 'node.js';
    update = true;
  }

  index = e.tags.indexOf('node');
  if (index !== -1) {
    e.tags[index] = 'node.js';
    update = true;
  }
  if (update) {
    db.bookmarks.save(e);
  }
});
