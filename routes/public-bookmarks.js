var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var router = express.Router();
var Bookmark = require('../models/bookmark');
var HttpStatus = require('http-status-codes');
const constants = require('../common/constants');

const bookmarksSearchService = require('../common/bookmarks-search.service');
const superagent = require('superagent');

const MAX_NUMBER_RETURNED_RESULTS = 100;

/**
 *  Returns the public bookmarks
 */
router.get('/', async (req, res) => {
  try {
    const searchText = req.query.q;
    const limit = parseInt(req.query.limit);
    if ( searchText ) {
      const bookmarks = await bookmarksSearchService.findBookmarks(searchText, limit, constants.DOMAIN_PUBLIC, null);

      res.send(bookmarks);
    } else if ( req.query.location ) {
      const bookmark = await Bookmark.findOne({
        'shared': true,
        location: req.query.location
      }).lean().exec();
      if ( !bookmark ) {
        return res.status(HttpStatus.NOT_FOUND).send("Bookmark not found");
      }
      res.send(bookmark);
    } else {//no filter - latest bookmarks added to the platform
      const bookmarks = await Bookmark.find({'shared': true})
        .sort({createdAt: -1})
        .limit(MAX_NUMBER_RETURNED_RESULTS)
        .lean().exec();
      res.send(bookmarks);
    }
  } catch (err) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err);
  }
});

router.get('/tagged/:tag', async (req, res) => {
  try {
    const orderByFilter = req.query.orderBy === 'STARS' ? {likes: -1} : {createdAt: -1};

    const bookmarks = await Bookmark.find({
      shared: true,
      tags: req.params.tag
    })
      .sort(orderByFilter)
      .limit(MAX_NUMBER_RETURNED_RESULTS)
      .lean()
      .exec();

    res.send(bookmarks);
  } catch (err) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err);
  }
});

/**
 * Convert youtube api duration format "PT6M10S" to 6m, "PT2H18M43S" to 2h:18min
 * @param duration
 * @returns {null}
 */
function formatDuration(duration) {
  duration = duration.substring(2); // get rid of 'PT'
  if(duration.indexOf('M') >= 0 && duration.indexOf('H')== -1) {
    return duration.substring(0, duration.indexOf('M')) + 'min';
  }

  if(duration.indexOf('M') >= 0 && duration.indexOf('H') >= 0) {
    const hours = duration.substring(0, duration.indexOf('H')) + 'h';
    const minutes = duration.substring(duration.indexOf('H') + 1, duration.indexOf('M')) + 'min';
    return hours + ':' + minutes;
  }

  return null;
}


/* GET title of bookmark given its url */
router.get('/scrape', function (req, res) {
  if ( req.query.url ) {
    const bookmarkUrl = req.query.url;
    request(bookmarkUrl, function (error, response, body) {
      if ( !error && response.statusCode == 200 ) {
        const $ = cheerio.load(body);
        const webpageTitle = $("title").text();
        const metaDescription = $('meta[name=description]').attr("content");
        let webpage = {
          title: webpageTitle,
          metaDescription: metaDescription,
          publishedOn: '',
          videoDuration: null
        }
        let youtubeVideoId = req.query.youtubeVideoId;

        if(youtubeVideoId !== 'null') {
          superagent
            .get('https://www.googleapis.com/youtube/v3/videos')
            .query({id: youtubeVideoId})
            .query({key: process.env.YOUTUBE_API_KEY || "change-me-with-a-valid-youtube-key-if-you-need-me"}) //used only when adding youtube videos
            .query({part: 'snippet,contentDetails,statistics,status'})
            .then(response => {
              const publishedAt = response.body.items[0].snippet.publishedAt;
              webpage.publishedOn = publishedAt.substring(0, publishedAt.indexOf('T'));
              webpage.videoDuration = formatDuration(response.body.items[0].contentDetails.duration);
              if (webpage.title.endsWith('- YouTube')) {
                webpage.title = webpageTitle.replace('- YouTube', ' - ' + webpage.videoDuration);
              } else {
                webpage.title = webpageTitle + ' - ' + webpage.videoDuration;
              }
              res.send(webpage);
            })
            .catch(err => {
               console.error(err);
            });
        } else {
          res.send(webpage);
        }
      }
    });
  }
});

/* GET bookmark by id. */
router.get('/:id', function (req, res) {
  Bookmark.findById(req.params.id, function (err, bookmark) {
    if ( err ) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err);
    }
    if ( !bookmark ) {
      return res.status(HttpStatus.NOT_FOUND).send("Bookmark not found");
    }
    res.send(bookmark);
  });

});


/* TODO - maybe implement later advancedSearch */
router.get('/advanced-search', function (req, res) {
  var regexSearch = [];
  if ( req.query.name ) {
    var regExpName = new RegExp(req.query.category, 'i');
    regexSearch.push({'name': {$regex: regExpName}});
    regexSearch.push({'description': {$regex: regExpName}});
  }
  if ( req.query.category ) {
    var regExpCategory = new RegExp(req.query.category, 'i');
    regexSearch.push({'category': {$regex: regExpCategory}});
  }
  if ( req.query.tag ) {
    var regExpTag = new RegExp(req.query.tag, 'i');
    regexSearch.push({'tags': {$regex: regExpTag}});
  }
  if ( regexSearch.length > 0 ) {
    Bookmark.find().or(regexSearch, function (err, bookmarks) {
      if ( err ) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err);
      }
      res.send(bookmarks);
    });
  } else {//no filter - all bookmarks
    Bookmark.find({}, function (err, bookmarks) {
      if ( err ) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err);
      }
      res.send(bookmarks);
    });
  }

});


module.exports = router;
