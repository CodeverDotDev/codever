db.bookmarks.find().forEach(function (e) {
  if (
    (!e.descriptionHtml || e.descriptionHtml.trim() === '') &&
    e.description &&
    e.description.trim() !== ''
  ) {
    print(e.location);
    print(e.description);
    e.descriptionHtml = e.description;
    db.bookmarks.save(e);
  }
});
