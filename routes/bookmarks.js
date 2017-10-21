var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var router = express.Router();
var Bookmark = require('../models/bookmark');
var MyError = require('../models/error');

/* GET title of bookmark given its url */
router.get('/scrape', function(req, res, next) {
  if(req.query.url){
    request(req.query.url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        const $ = cheerio.load(body);
        const webpageTitle = $("title").text();
        const metaDescription =  $('meta[name=description]').attr("content");
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
router.get('/:id', function(req, res, next) {
  Bookmark.findById(req.params.id, function(err, bookmark){
    if(err){
      console.log(err);
      return res.status(500).send(err);
    }
    if(!bookmark){
      return res.status(404).send("Bookmark not found");
    }
    res.send(bookmark);
  });

});

/* GET bookmarks listing. */
router.get('/', function(req, res, next) {
  if(req.query.term){
    var regExpTerm = new RegExp(req.query.term, 'i');
    var regExpSearch=[{name:{$regex:regExpTerm}}, {description:{$regex: regExpTerm }}, {category:{$regex:regExpTerm }}, {tags:{$regex:regExpTerm}}];
    Bookmark.find({'$or':regExpSearch}, function(err, bookmarks){
      if(err){
        return res.status(500).send(err);
      }
      res.send(bookmarks);
    });
  } else if (req.query.location) {
    Bookmark.findOne({'shared':true, location: req.query.location}).lean().exec(function(err, bookmark){
      if(err){
        return res.status(500).send(err);
      }
      if(!bookmark){
        return res.status(404).send("Bookmark not found");
      }
      res.send(bookmark);
    });
  } else if(req.query.tag){//get all bookmarks tagged with "tag"
    //Bookmark.find({ tags: req.query.tag }, function(err, bookmarks){ //TODO when making strict tags, that is the exact tag name
    Bookmark.find({ tags: { $regex: new RegExp(req.query.tag, "ig")} }, function(err, bookmarks){
      if(err){
        console.log(err);
        return res.status(500).send(err);
      }
      res.send(bookmarks);
    });
  } else {//no filter - all bookmarks
    //Bookmark.find({'shared':true}, function(err, bookmarks){
    Bookmark.find({'shared':true}).lean().exec(function(err, bookmarks){
      if(err){
        return res.status(500).send(err);
      }
      res.send(bookmarks);
    });
  }

});

/**
 * CREATE bookmark
 */
router.post('/', function(req, res, next){
  var bookmark = new Bookmark(req.body); //expect the model structure in the body directly
  console.log(bookmark);

  bookmark.save(function (err, updatedBookmark) {
    if (err){

      if(err.name == 'ValidationError'){
        var errorMessages = [];
        for (var i in err.errors) {
          errorMessages.push(err.errors[i].message);
        }

        var error = new Error('Validation MyError', errorMessages);
        console.log(JSON.stringify(error));
        res.setHeader('Content-Type', 'application/json');
        return res.status(409).send(JSON.stringify(new MyError('Validation Error', errorMessages)));
      }

      console.log(err);
      res.status(500).send(err);
    } else {
      res.set('Location', 'http://localhost:3000/api/bookmarks/' + updatedBookmark.id);
      res.status(201).send('Bookmark created');
    }
    // saved!
  });

});

/**
 * full UPDATE via PUT - that is the whole document is required and will be updated
 */
router.put('/:id', function(req, res, next) {
  Bookmark.findByIdAndUpdate(req.params.id, req.body, {new: true}, function(err, bookmark){
    if(err){
      if (err.name === 'MongoError' && err.code === 11000) {
        res.status(409).send(new MyError('Duplicate key', [err.message]));
      }

      res.status(500).send(new MyError('Unknown Server Error', ['Unknow server error when updating bookmark ' + req.params.id]));
    }
    if(!bookmark){
      return res.status(404).send('Bookmark not found');
    }
    res.status(200).send(bookmark);
  });

});


/**
 * DELETE
 */
router.delete('/:id', function(req, res, next) {
  Bookmark.findByIdAndRemove(req.params.id, function(err, bookmark){
    if(err){
      return res.status(500).send(new MyError('Unknown server error', ['Unknown server error when trying to delete bookmark with id ' + req.params.id]));
    }
    if(!bookmark){
      return res.status(404).send(new MyError('Not Found Error', ['Bookmark with id ' + req.params.id + ' not found']));
    }
    res.status(204).send('Bookmark successfully deleted');
  });

});

/* TODO - maybe implement later advancedSearch */
router.get('/advanced-search', function(req, res, next) {
  var regexSearch=[];
  if(req.query.name){
    var regExpName = new RegExp(req.query.category, 'i');
    regexSearch.push({ 'name': { $regex: regExpName }});
    regexSearch.push({ 'description': { $regex: regExpName }});
  }
  if(req.query.category){
    var regExpCategory = new RegExp(req.query.category, 'i');
    regexSearch.push({ 'category': { $regex: regExpCategory }});
  }
  if(req.query.tag){
    var regExpTag = new RegExp(req.query.tag, 'i');
    regexSearch.push({ 'tags': { $regex: regExpTag }});
  }
  if(regexSearch.length > 0){
    Bookmark.find().or(regexSearch, function(err, bookmarks){
      if(err){
        return res.status(500).send(err);
      }
      res.send(bookmarks);
    });
  } else {//no filter - all bookmarks
    Bookmark.find({}, function(err, bookmarks){
      if(err){
        return res.status(500).send(err);
      }
      res.send(bookmarks);
    });
  }

});

module.exports = router;
