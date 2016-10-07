var express = require('express');
var router = express.Router();
var Bookmark = require('../models/bookmark');

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
  if(req.query.category){
    Bookmark.find({category:req.query.category}, function(err, bookmarks){
      if(err){
        return res.status(500).send(err);
      }
      res.send(bookmarks);
    });
  } else {
    Bookmark.find({}, function(err, bookmarks){
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
  console.log(req.body);
  var bookmark = new Bookmark(req.body); //expect the model structure in the body directly

  bookmark.save(function (err, updatedBookmark) {
    if (err){
      console.log(err);
      res.status(500).send(err);
    } else {
      res.set('Location', 'http://localhost:3000/bookmarks/' + updatedBookmark.id);
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
      return res.status(500).send(err);
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
      return res.status(500).send(err);
    }
    if(!bookmark){
      return res.status(404).send('Bookmark not found');
    }
    res.status(204).send('Bookmark successfully deleted');
  });

});

module.exports = router;
