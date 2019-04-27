var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var router = express.Router();
var Bookmark = require('../models/bookmark');
var HttpStatus = require('http-status-codes');
var MyError = require('../models/error');

const bookmarksSearchService = require('../common/bookmarks-search.service');

const MAX_NUMBER_RETURNED_RESULTS = 100;

/**
 *  Returns the public bookmarks
 */
router.get('/', async (req, res) => {
  try {
    if ( req.query.query ) {
      //split in text and tags
      const limit = parseInt(req.query.limit);
      const searchedTermsAndTags = bookmarksSearchService.splitSearchQuery(req.query.query);
      const searchedTerms = searchedTermsAndTags[0];
      const searchedTags = searchedTermsAndTags[1];
      let bookmarks = [];
      const lang = req.query.lang;
      if ( searchedTerms.length > 0 && searchedTags.length > 0 ) {
        bookmarks = await bookmarksSearchService.getBookmarksForTagsAndTerms(bookmarks, searchedTags, searchedTerms, limit);
      } else if ( searchedTerms.length > 0 ) {
        bookmarks = await bookmarksSearchService.getBookmarksForSearchedTerms(searchedTerms, bookmarks, limit);
      } else {
        bookmarks = await bookmarksSearchService.getBookmarksForSearchedTags(bookmarks, searchedTags, limit);
      }
      if ( lang && lang !== 'all' ) {
        bookmarks = bookmarks.filter(x => x.language === lang);
      }

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
    const orderByFilter = req.query.orderBy === 'STARS' ? {stars: -1} : {createdAt: -1};

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

/* GET title of bookmark given its url */
router.get('/scrape', function (req, res, next) {
  if ( req.query.url ) {
    request(req.query.url, function (error, response, body) {
      if ( !error && response.statusCode == 200 ) {
        const $ = cheerio.load(body);
        const webpageTitle = $("title").text();
        const metaDescription = $('meta[name=description]').attr("content");
        const webpage = {
          title: webpageTitle,
          metaDescription: metaDescription
        }
        res.send(webpage);
      }
    });
  }
});

/* GET bookmark by id. */
router.get('/:id', function (req, res, next) {
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
router.get('/advanced-search', function (req, res, next) {
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
