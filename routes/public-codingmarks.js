var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var router = express.Router();
var Bookmark = require('../models/bookmark');
var HttpStatus = require('http-status-codes');
var MyError = require('../models/error');


/**
 *  Returns the public codingmarks
 *  Currently only the get all (no filter) function is used
 */
router.get('/', async (req, res) => {
  try {
    if (req.query.term) {
      var regExpTerm = new RegExp(req.query.term, 'i');
      var regExpSearch = [{name: {$regex: regExpTerm}}, {description: {$regex: regExpTerm}}, {category: {$regex: regExpTerm}}, {tags: {$regex: regExpTerm}}];
      const bookmarks = await Bookmark.find({'$or': regExpSearch})
      res.send(bookmarks);
    } else if (req.query.location) {
      const bookmark = await Bookmark.findOne({'shared': true, location: req.query.location}).lean().exec();
      if (!bookmark) {
        return res.status(HttpStatus.NOT_FOUND).send("Codingmark not found");
      }
      res.send(bookmark);
    } else if (req.query.tag) {//get all bookmarks tagged with "tag"
      //const bookmarks = await Bookmark.find({ tags: { $regex: new RegExp(req.query.tag, "ig")} }).sort({createdAt: -1});
      const bookmarks = await Bookmark.find({tags: req.query.tag}).sort({createdAt: -1}).lean().exec();
      res.send(bookmarks);
    } else {//no filter - all bookmarks ordered by creation date descending
      const bookmarks = await Bookmark.find({'shared': true}).sort({createdAt: -1}).lean().exec();
      res.send(bookmarks);
    }
  } catch (err) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err);
  }

});

/* GET title of bookmark given its url */
router.get('/scrape', function (req, res, next) {
  if (req.query.url) {
    request(req.query.url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
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

/**
 * Returns the codingmarks added recently.
 *
 * The since query parameter is a timestamp which specifies the date since we want to look forward to present time.
 * If this parameter is present it has priority. If it is not present, we might specify the number of days to look back via
 * the query parameter numberOfDays. If not present it defaults to 7 days, last week.
 *
 */
router.get('/latest-entries', async (req, res) => {
  try {
    if (req.query.since) {
      const fromDate = new Date(parseFloat(req.query.since, 0));
      const toDate = req.query.to ? new Date(parseFloat(req.query.to, 0)) : new Date();
      if (fromDate > toDate) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .send(new MyError('timing query parameters values', ['<Since> param value must be before <to> parameter value']));
      }
      const codingmarks = await Bookmark.find(
        {
          'shared': true,
          createdAt: {
            $gte: fromDate,
            $lte: toDate
          }

        }).sort({createdAt: 'desc'}).lean().exec();

      res.send(codingmarks);
    } else {
      const numberOfDaysToLookBack = req.query.days ? req.query.days : 7;

      const codingmarks = await Bookmark.find(
        {
          'shared': true,
          createdAt: {$gte: new Date((new Date().getTime() - (numberOfDaysToLookBack * 24 * 60 * 60 * 1000)))}
        }).sort({createdAt: 'desc'}).lean().exec();

      res.send(codingmarks);
    }

  } catch (err) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err);
  }
});

/* GET bookmark by id. */
router.get('/:id', function (req, res, next) {
  Bookmark.findById(req.params.id, function (err, bookmark) {
    if (err) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err);
    }
    if (!bookmark) {
      return res.status(HttpStatus.NOT_FOUND).send("Codingmark not found");
    }
    res.send(bookmark);
  });

});


/* TODO - maybe implement later advancedSearch */
router.get('/advanced-search', function (req, res, next) {
  var regexSearch = [];
  if (req.query.name) {
    var regExpName = new RegExp(req.query.category, 'i');
    regexSearch.push({'name': {$regex: regExpName}});
    regexSearch.push({'description': {$regex: regExpName}});
  }
  if (req.query.category) {
    var regExpCategory = new RegExp(req.query.category, 'i');
    regexSearch.push({'category': {$regex: regExpCategory}});
  }
  if (req.query.tag) {
    var regExpTag = new RegExp(req.query.tag, 'i');
    regexSearch.push({'tags': {$regex: regExpTag}});
  }
  if (regexSearch.length > 0) {
    Bookmark.find().or(regexSearch, function (err, bookmarks) {
      if (err) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err);
      }
      res.send(bookmarks);
    });
  } else {//no filter - all bookmarks
    Bookmark.find({}, function (err, bookmarks) {
      if (err) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err);
      }
      res.send(bookmarks);
    });
  }

});

module.exports = router;
