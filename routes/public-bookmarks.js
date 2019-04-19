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
    if ( req.query.query ) {
      //split in text and tags
      const limit = parseInt(req.query.limit);
      const searchedTermsAndTags = splitSearchQuery(req.query.query);
      const searchedTerms = searchedTermsAndTags[0];
      const searchedTags = searchedTermsAndTags[1];
      let bookmarks = [];
      const lang = req.query.lang;
      if ( searchedTerms.length > 0 && searchedTags.length > 0 ) {
        bookmarks = await getBookmarksForTagsAndTerms(bookmarks, searchedTags, searchedTerms, limit);
      } else if ( searchedTerms.length > 0 ) {
        bookmarks = await getBookmarksForSearchedTerms(searchedTerms, bookmarks, limit);
      } else {
        bookmarks = await getBookmarksforSearchedTags(bookmarks, searchedTags, limit);
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

let getBookmarksForTagsAndTerms = async function (bookmarks, searchedTags, searchedTerms, limit) {
  bookmarks = await Bookmark.find(
    {
      shared: true,
      tags:
        {
          $all: searchedTags
        },
      $text:
        {
          $search: searchedTerms.join(' ')
        }
    },
    {
      score: {$meta: "textScore"}
    }
  )
  //.sort({createdAt: -1})
    .sort({score: {$meta: "textScore"}})
    .lean()
    .exec();

  for ( const term of searchedTerms ) {
    bookmarks = bookmarks.filter(x => bookmarkContainsSearchedTerm(x, term.trim()));
  }
  bookmarks = bookmarks.slice(0, limit);

  return bookmarks;
};

let getBookmarksForSearchedTerms = async function (searchedTerms, bookmarks, limit) {
  const termsJoined = searchedTerms.join(' ');
  const termsQuery = escapeStringRegexp(termsJoined);
  bookmarks = await Bookmark.find(
    {
      shared: true,
      $text: {$search: termsQuery},
    },
    {
      score: {$meta: "textScore"}
    }
  )
  //.sort({createdAt: -1}) //let's give it a try with text score
    .sort({score: {$meta: "textScore"}})
    .lean()
    .exec();

  for ( const term of searchedTerms ) {
    bookmarks = bookmarks.filter(x => bookmarkContainsSearchedTerm(x, term.trim()));
  }
  bookmarks = bookmarks.slice(0, limit);

  return bookmarks;
};

let getBookmarksforSearchedTags = async function (bookmarks, searchedTags, limit) {
  console.log('searchedTags', searchedTags);
  bookmarks = await Bookmark.find(
    {
      shared: true,
      tags:
        {
          $all: searchedTags
        },
    }
  )
    .sort({createdAt: -1})
    .limit(limit)
    .lean()
    .exec();
  return bookmarks;
};

function bookmarkContainsSearchedTerm(bookmark, searchedTerm) {
  let result = false;
  // const escapedSearchPattern = '\\b' + this.escapeRegExp(searchedTerm.toLowerCase()) + '\\b'; word boundary was not enough, especially for special characters which can happen in coding
  // https://stackoverflow.com/questions/23458872/javascript-regex-word-boundary-b-issue
  const separatingChars = '\\s\\.,;#\\-\\/_\\[\\]\\(\\)\\*\\+';
  const escapedSearchPattern = `(^|[${separatingChars}])(${escapeRegExp(searchedTerm.toLowerCase())})(?=$|[${separatingChars}])`;
  const pattern = new RegExp(escapedSearchPattern);
  if ( (bookmark.name && pattern.test(bookmark.name.toLowerCase()))
    || (bookmark.location && pattern.test(bookmark.location.toLowerCase()))
    || (bookmark.description && pattern.test(bookmark.description.toLowerCase()))
    || (bookmark.githubURL && pattern.test(bookmark.githubURL.toLowerCase()))
  ) {
    result = true;
  }

  if ( result ) {
    return true;
  } else {
    // if not found already look through the tags also
    bookmark.tags.forEach(tag => {
      if ( pattern.test(tag.toLowerCase()) ) {
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

function splitSearchQuery(query) {

  const result = [[], []];

  const terms = [];
  let term = '';
  const tags = [];
  let tag = '';

  let isInsideTerm = false;
  let isInsideTag = false;


  for ( let i = 0; i < query.length; i++ ) {
    const currentCharacter = query[i];
    if ( currentCharacter === ' ' ) {
      if ( !isInsideTag ) {
        if ( !isInsideTerm ) {
          continue;
        } else {
          terms.push(term);
          isInsideTerm = false;
          term = '';
        }
      } else {
        tag += ' ';
      }
    } else if ( currentCharacter === '[' ) {
      if ( isInsideTag ) {
        tags.push(tag.trim());
        tag = '';
      } else {
        isInsideTag = true;
      }
    } else if ( currentCharacter === ']' ) {
      if ( isInsideTag ) {
        isInsideTag = false;
        tags.push(tag.trim());
        tag = '';
      }
    } else {
      if ( isInsideTag ) {
        tag += currentCharacter;
      } else {
        isInsideTerm = true;
        term += currentCharacter;
      }
    }
  }

  if ( tag.length > 0 ) {
    tags.push(tag.trim());
  }

  if ( term.length > 0 ) {
    terms.push(term);
  }

  result[0] = terms;
  result[1] = tags;

  return result;
}

module.exports = router;
