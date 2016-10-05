var express = require('express');
var router = express.Router();
var Bookmark = require('../models/bookmark');

/* GET users listing. */
router.get('/', function(req, res, next) {
  if(req.query.category){
    Bookmark.find({category:req.query.category}, function(err, bookmarks){
      if(err){
        return res.send('Error');
      }
      res.send(bookmarks);
    });
  } else {
    Bookmark.find({}, function(err, bookmarks){
      if(err){
        return res.send('Error');
      }
      res.send(bookmarks);
    });
  }

});

router.post('/', function(req, res, next){
  console.log(req.body);
  var bookmark = new Bookmark(req.body); //expect the model structure in the body directly

  bookmark.save(function (err) {
    if (err){
      console.log(err);
      res.status(500).send(err);
    } else {
      res.status(201).send('Bookmark created');
    }
    // saved!
  });

});

module.exports = router;
