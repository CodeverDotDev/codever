var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Keycloak = require('keycloak-connect');

var Bookmark = require('../models/bookmark');
var MyError = require('../models/error');

//add keycloak middleware
var keycloak = new Keycloak({ scope: 'openid' });
router.use( keycloak.middleware() );

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});


/**
 * CREATE bookmark for user
 */
router.post('/:id/bookmarks', keycloak.protect(), function(req, res, next){
  console.log(req.body);
  var bookmark = new Bookmark({
    name: req.body.name,
    location: req.body.location,
    description: req.body.description,
    category: req.body.category,
    tags: req.body.tags,
    userId: req.params.id
  });

  console.log('Bookmark to create' + bookmark);

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
      res.set('Location', 'http://localhost:3000/' + req.params.id + '/bookmarks/' + updatedBookmark.id);
      res.status(201).send('Bookmark created for userId ' + req.params.id);
    }
    // saved!
  });

});

//GET bookmarks for user
/* GET bookmarks listing. */
//router.get('/:id/bookmarks', keycloak.protect(), function(req, res, next) {
router.get('/:id/bookmarks',  function(req, res, next) {
  if(req.query.term){
    var regExpTerm = new RegExp(req.query.term, 'i');
    var regExpSearch=[{name:{$regex:regExpTerm}}, {description:{$regex: regExpTerm }}, {category:{$regex:regExpTerm }}, {tags:{$regex:regExpTerm}}];
    Bookmark.find({userId:req.params.id, '$or':regExpSearch}, function(err, bookmarks){
      if(err){
        return res.status(500).send(err);
      }
      res.send(bookmarks);
    });
  } else {//no filter - all bookmarks
    Bookmark.find({userId:req.params.id}, function(err, bookmarks){
      if(err){
        return res.status(500).send(err);
      }
      res.send(bookmarks);
    });
  }

});

module.exports = router;
