var express = require('express');
var router = express.Router();
var Bookmark = require('../models/bookmark');

/* GET users listing. */
router.get('/', function(req, res, next) {
  Bookmark.find({}, function(err, bookmarks){
    if(err){
      return res.send('Error');
    }
    res.send(bookmarks);
  });
});

router.post('/', function(req, res, next){
  console.log(req.body);
  var bookmark = new Bookmark(req.body); //expect the model structure in the body directly

  bookmark.save(); // save in the database
  res.status(201).send('Bookmark created');
});

module.exports = router;
