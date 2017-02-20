var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Keycloak = require('keycloak-connect');

var Bookmark = require('../models/bookmark');
var MyError = require('../models/error');

var common = require('./common');
var config = common.config();

//showdown converter - https://github.com/showdownjs/showdown
var showdown  = require('showdown'),
  converter = new showdown.Converter();

//add keycloak middleware
var keycloak = new Keycloak({ scope: 'openid' }, config.keycloak);
router.use( keycloak.middleware() );

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});


/**
 * CREATE bookmark for user
 */
//router.post('/:id/bookmarks', keycloak.protect(), function(req, res, next){
router.post('/:id/bookmarks', keycloak.protect(), function(req, res, next){

  var bookmark = new Bookmark({
    name: req.body.name,
    location: req.body.location,
    description: req.body.description,
    descriptionHtml: converter.makeHtml(req.body.description),
    category: req.body.category,
    tags: req.body.tags,
    userId: req.params.id,
    shared: req.body.shared
  });

  console.log('Bookmark to create ' + bookmark);

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
router.get('/:id/bookmarks', keycloak.protect(), function(req, res, next) {
//router.get('/:id/bookmarks',  function(req, res, next) {
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
    }).sort({updatedAt: -1});
  }

});

/**
 * full UPDATE via PUT - that is the whole document is required and will be updated
 */
router.put('/:userId/bookmarks/:bookmarkId', keycloak.protect(), function(req, res, next) {
  req.body.descriptionHtml = converter.makeHtml(req.body.description);
  console.log(req.body);
  Bookmark.findOneAndUpdate({_id: req.params.bookmarkId, userId: req.params.userId}, req.body, {new: true}, function(err, bookmark){
    if(err){
      if (err.name === 'MongoError' && err.code === 11000) {
        res.status(409).send(new MyError('Duplicate key', [err.message]));
      }

      res.status(500).send(new MyError('Unknown Server Error', ['Unknow server error when updating bookmark for user id ' + req.params.userId + ' and bookmark id '+ req.params.bookmarkId]));
    }
    if(!bookmark){
      return res.status(404).send('Bookmark not found for user');
    }
    res.status(200).send(bookmark);
  });

});

/*
* DELETE bookmark for user
*/
router.delete('/:userId/bookmarks/:bookmarkId', keycloak.protect(), function(req, res, next) {
  Bookmark.findOneAndRemove({_id: req.params.bookmarkId, userId: req.params.userId}, function(err, bookmark){
    if(err){
      return res.status(500).send(new MyError('Unknown server error', ['Unknown server error when trying to delete bookmark with id ' + req.params.bookmarkId]));
    }
    if(!bookmark){
      return res.status(404).send(new MyError('Not Found Error', ['Bookmark for user id ' + req.params.userId + ' and bookmark id '+ req.params.bookmarkId + ' not found']));
    }
    res.status(204).send('Bookmark successfully deleted');
  });

});

module.exports = router;
