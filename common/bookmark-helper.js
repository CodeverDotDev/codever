const Bookmark = require('../models/bookmark');

module.exports = {
   buildBookmarkFromRequest: function (req) {
    const descriptionHtml = req.body.descriptionHtml ? req.body.descriptionHtml : converter.makeHtml(req.body.description);
    const bookmark = new Bookmark({
      name: req.body.name,
      location: req.body.location,
      userId: req.body.userId,
      language: req.body.language,
      description: req.body.description,
      descriptionHtml: descriptionHtml,
      category: req.body.category,
      tags: req.body.tags,
      publishedOn: req.body.publishedOn,
      githubURL: req.body.githubURL,
      userId: req.body.userId || req.params.userId,
      shared: req.body.shared,
      starredBy: req.body.starredBy,
      lastAccessedAt: req.body.lastAccessedAt
    });

    return bookmark;
  }
}
