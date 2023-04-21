//showdown converter - https://github.com/showdownjs/showdown
const showdown = require('showdown'),
  converter = new showdown.Converter();

const Bookmark = require('../../model/bookmark');

module.exports = {
  toBookmark: function (req) {
    const descriptionHtml = req.body.descriptionHtml
      ? req.body.descriptionHtml
      : converter.makeHtml(req.body.description);
    const youtubeVideoId = req.body.youtubeVideoId;
    const stackoverflowQuestionId = req.body.stackoverflowQuestionId;
    req.body = {
      ...req.body,
      userId: req.body.userId || req.params.userId,
      youtubeVideoId: youtubeVideoId ? youtubeVideoId : null,
      likeCount: req.body.likeCount || 0,
      stackoverflowQuestionId: stackoverflowQuestionId
        ? stackoverflowQuestionId
        : null,
      descriptionHtml: descriptionHtml,
    };

    const bookmark = new Bookmark(req.body);
    return bookmark;
  },
};
