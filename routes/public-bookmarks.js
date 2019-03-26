var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var router = express.Router();
var Bookmark = require('../models/bookmark');
var HttpStatus = require('http-status-codes');
var MyError = require('../models/error');
const escapeStringRegexp = require('escape-string-regexp');

const MAX_NUMBER_RETURNED_RESULTS = 100;

/**
 *  Returns the public bookmarks
 */
router.get('/', async (req, res) => {
  try {
    if (req.query.term) {
      var regExpTerm = new RegExp(req.query.term, 'i');
      var regExpSearch = [{name: {$regex: regExpTerm}}, {description: {$regex: regExpTerm}}, {category: {$regex: regExpTerm}}, {tags: {$regex: regExpTerm}}];
      const bookmarks = await Bookmark.find({'$or': regExpSearch})
      res.send(bookmarks);
    } else if (req.query.query) {
      //split in text and tags

      const limit = parseInt(req.query.limit);
      const searchedTermsAndTags = splitSearchQuery(req.query.query);
      const searchedTerms = searchedTermsAndTags[0];
      const searchedTags = searchedTermsAndTags[1];
      let bookmarks = [];
      if (searchedTerms.length > 0 && searchedTags.length > 0) {
        bookmarks = await Bookmark.find({
          $and: [
            {
              tags:
                {
                  $all: searchedTags
                }
            },
            {
              $text:
                {
                  $search: searchedTerms.join(' ')
                }
            }
          ]
        }).sort({createdAt: -1}).lean().exec();
        if(searchedTerms.length > 1) {
          searchedTerms.forEach(term => {
            bookmarks = bookmarks.filter(x => bookmarkContainsSearchedTerm(x, term.trim()));
          });
        }
        bookmarks = bookmarks.slice(0, limit);
      } else if (searchedTerms.length > 0) {
        const termsJoined = searchedTerms.join(' ');
        const termsQuery = escapeStringRegexp(termsJoined);
        bookmarks = await Bookmark.find({$text: {$search: termsQuery}}).sort({createdAt: -1}).lean().exec();
        //double check if multiple words it must contain both terms (capability not supported by mongo text index, it finds both)
        if ( searchedTerms.length > 1){
          searchedTerms.forEach(term => {
            bookmarks = bookmarks.filter(x => bookmarkContainsSearchedTerm(x, term.trim()));
          });
        }
        bookmarks = bookmarks.slice(0, limit);
      } else {
        bookmarks = await Bookmark.find({tags: {$all: searchedTags}}).sort({createdAt: -1}).limit(limit).lean().exec();
      }

      res.send(bookmarks);
    } else if (req.query.location) {
      const bookmark = await Bookmark.findOne({'shared': true, location: req.query.location}).lean().exec();
      if (!bookmark) {
        return res.status(HttpStatus.NOT_FOUND).send("Bookmark not found");
      }
      res.send(bookmark);
    } else if (req.query.tag) {//get all bookmarks tagged with "tag"
      const bookmarks = await Bookmark.find({tags: req.query.tag}).sort({createdAt: -1}).limit(MAX_NUMBER_RETURNED_RESULTS).lean().exec();
      res.send(bookmarks);
    } else {//no filter - all bookmarks ordered by creation date descending
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

function bookmarkContainsSearchedTerm(bookmark, searchedTerm) {
  let result = false;
  // const escapedSearchPattern = '\\b' + this.escapeRegExp(searchedTerm.toLowerCase()) + '\\b'; word boundary was not enough, especially for special characters which can happen in coding
  // https://stackoverflow.com/questions/23458872/javascript-regex-word-boundary-b-issue
  const separatingChars = '\\s\\.,;#\\-\\/_\\[\\]\\(\\)\\*\\+';
  const escapedSearchPattern = `(^|[${separatingChars}])(${escapeRegExp(searchedTerm.toLowerCase())})(?=$|[${separatingChars}])`;
  const pattern = new RegExp(escapedSearchPattern);
  if ((bookmark.name && pattern.test(bookmark.name.toLowerCase()))
    || (bookmark.location && pattern.test(bookmark.location.toLowerCase()))
    || (bookmark.description && pattern.test(bookmark.description.toLowerCase()))
    || (bookmark.githubURL && pattern.test(bookmark.githubURL.toLowerCase()))
  ) {
    result = true;
  }

  if (result) {
    return true;
  } else {
    // if not found already look through the tags also
    bookmark.tags.forEach(tag => {
      if (pattern.test(tag.toLowerCase())) {
        result = true;
      }
    });
  }

  return result;
}

function escapeRegExp(str) {
  const specials = [
      // order matters for these
      '-'
      , '['
      , ']'
      // order doesn't matter for any of these
      , '/'
      , '{'
      , '}'
      , '('
      , ')'
      , '*'
      , '+'
      , '?'
      , '.'
      , '\\'
      , '^'
      , '$'
      , '|'
    ],
    regex = RegExp('[' + specials.join('\\') + ']', 'g');
  return str.replace(regex, '\\$&'); // $& means the whole matched string
}

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
 * Returns the bookmarks added recently.
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
      const bookmarks = await Bookmark.find(
        {
          'shared': true,
          createdAt: {
            $gte: fromDate,
            $lte: toDate
          }

        }).sort({createdAt: 'desc'}).lean().exec();

      res.send(bookmarks);
    } else {
      const numberOfDaysToLookBack = req.query.days ? req.query.days : 7;

      const bookmarks = await Bookmark.find(
        {
          'shared': true,
          createdAt: {$gte: new Date((new Date().getTime() - (numberOfDaysToLookBack * 24 * 60 * 60 * 1000)))}
        }).sort({createdAt: 'desc'}).lean().exec();

      res.send(bookmarks);
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
      return res.status(HttpStatus.NOT_FOUND).send("Bookmark not found");
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

function splitSearchQuery(query) {

  const result = [[], []];

  const terms = [];
  let term = '';
  const tags = [];
  let tag = '';

  let isInsideTerm = false;
  let isInsideTag = false;


  for (let i = 0; i < query.length; i++) {
    const currentCharacter = query[i];
    if (currentCharacter === ' ') {
      if (!isInsideTag) {
        if (!isInsideTerm) {
          continue;
        } else {
          terms.push(term);
          isInsideTerm = false;
          term = '';
        }
      } else {
        tag += ' ';
      }
    } else if (currentCharacter === '[') {
      if (isInsideTag) {
        tags.push(tag.trim());
        tag = '';
      } else {
        isInsideTag = true;
      }
    } else if (currentCharacter === ']') {
      if (isInsideTag) {
        isInsideTag = false;
        tags.push(tag.trim());
        tag = '';
      }
    } else {
      if (isInsideTag) {
        tag += currentCharacter;
      } else {
        isInsideTerm = true;
        term += currentCharacter;
      }
    }
  }

  if (tag.length > 0) {
    tags.push(tag.trim());
  }

  if (term.length > 0) {
    terms.push(term);
  }

  result[0] = terms;
  result[1] = tags;

  return result;
}

module.exports = router;
