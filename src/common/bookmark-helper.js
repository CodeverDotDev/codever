//showdown converter - https://github.com/showdownjs/showdown
const showdown = require('showdown'),
  converter = new showdown.Converter();

const Bookmark = require('../model/bookmark');

module.exports = {
  buildBookmarkFromRequest: function (req) {
    const descriptionHtml = req.body.descriptionHtml ? req.body.descriptionHtml : converter.makeHtml(req.body.description);
    const youtubeVideoId = req.body.youtubeVideoId;
    const stackoverflowQuestionId = req.body.stackoverflowQuestionId;
    const bookmark = new Bookmark({
      _id: req.body._id,
      name: req.body.name,
      location: req.body.location,
      language: req.body.language,
      description: req.body.description,
      descriptionHtml: descriptionHtml,
      tags: req.body.tags,
      publishedOn: req.body.publishedOn,
      sourceCodeURL: req.body.sourceCodeURL,
      userId: req.body.userId || req.params.userId,
      userDisplayName: req.body.userDisplayName,
      public: req.body.public,
      lastAccessedAt: req.body.lastAccessedAt,
      likeCount: req.body.likeCount,
      youtubeVideoId: youtubeVideoId ? youtubeVideoId : null,
      stackoverflowQuestionId: stackoverflowQuestionId ? stackoverflowQuestionId : null
    });

    return bookmark;
  }

}
