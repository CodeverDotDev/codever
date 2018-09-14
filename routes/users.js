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
router.post('/:userId/bookmarks', keycloak.protect(), async (req, res) => {

  let userId = req.kauth.grant.access_token.content.sub;
  if(userId !== req.params.userId) {
    console.log("req")
    return res.status(401).send({response:'Operation not allowed - userId does not match logged in user'});
  }

  const descriptionHtml = req.body.descriptionHtml ? req.body.descriptionHtml: converter.makeHtml(req.body.description);

  const bookmark = new Bookmark({
    name: req.body.name,
    location: req.body.location,
    language: req.body.language,
    description: req.body.description,
    descriptionHtml: descriptionHtml,
    category: req.body.category,
    tags: req.body.tags,
    publishedOn: req.body.publishedOn,
    githubURL: req.body.githubURL,
    userId: req.params.userId,
    shared: req.body.shared,
    starredBy: req.body.starredBy,
    lastAccessedAt: req.body.lastAccessedAt
  });

  console.log(bookmark.name);
  if(!bookmark.name || !bookmark.location || !bookmark.tags || bookmark.tags.length === 0) {
    res.status(400).send(new MyError('Missing required attributes', ['Missing required attributes']));
  }
  if(bookmark.tags.length > 5){
    res.status(400).send(new MyError('Too many tags have been submitted', ['Too many tags have been submitted']));
  }

  try{
    let newBookmark = await bookmark.save();

    res.set('Location', 'http://localhost:3000/' + req.params.userId + '/bookmarks/' + newBookmark.id);
    res.status(201).send({response:'Bookmark created for userId ' + req.params.userId});

  } catch (err){
    if (err.name === 'MongoError' && err.code === 11000) {
      res.status(409).send(new MyError('Duplicate key', [err.message]));
    }

    res.status(500).send(err);
  }

});

/* GET bookmarks for user */
router.get('/:userId/bookmarks', keycloak.protect(), async (req, res) => {
  try{
    let bookmarks;
    let userId = req.kauth.grant.access_token.content.sub;
    if(userId !== req.params.userId) {
      return res.status(401).send({response:'Operation not allowed - userId does not match logged in user'});
    }
    if(req.query.term){
      var regExpTerm = new RegExp(req.query.term, 'i');
      var regExpSearch=[{name:{$regex:regExpTerm}}, {description:{$regex: regExpTerm }}, {category:{$regex:regExpTerm }}, {tags:{$regex:regExpTerm}}];
      bookmarks = await Bookmark.find({userId:req.params.userId, '$or':regExpSearch});
    } else {//no filter - all bookmarks
      bookmarks = await Bookmark.find({userId:req.params.userId});
    }

    res.send(bookmarks);
  } catch (err) {
    return res.status(500).send(err);
  }
});

/**
 * full UPDATE via PUT - that is the whole document is required and will be updated
 * the descriptionHtml parameter is only set in backend, if only does not come front-end (might be an API call)
 */
router.put('/:userId/bookmarks/:bookmarkId', keycloak.protect(), async (req, res) => {

  let userId = req.kauth.grant.access_token.content.sub;
  if(userId !== req.params.userId) {
    return res.status(401).send({response:'Operation not allowed - userId does not match logged in user'});
  }

  if(!req.body.name || !req.body.location || !req.body.tags || req.body.tags.length === 0){
    res.status(400).send(new MyError('Missing required attributes', ['Missing required attributes']));
  }

  if(req.body.tags.length > 5){
    res.status(400).send(new MyError('Too many tags have been submitted', ['Too many tags have been submitted']));
  }


  if(!req.body.descriptionHtml){
    req.body.descriptionHtml = converter.makeHtml(req.body.description);
  }
  try {
    let bookmark = await Bookmark.findOneAndUpdate({_id: req.params.bookmarkId, userId: req.params.userId}, req.body, {new: true});

    if (!bookmark) {
      return res.status(404).send(new MyError('Not Found Error', ['Bookmark for user id ' + req.params.userId + ' and bookmark id '+ req.params.bookmarkId + ' not found']));
    } else {
      res.status(200).send(bookmark);
    }
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) {
      res.status(409).send(new MyError('Duplicate key', [err.message]));
    }
    res.status(500).send(new MyError('Unknown Server Error', ['Unknow server error when updating bookmark for user id ' + req.params.userId + ' and bookmark id '+ req.params.bookmarkId]));
  }
});

/*
* DELETE bookmark for user
*/
router.delete('/:userId/bookmarks/:bookmarkId', keycloak.protect(), async (req, res) => {

  let userId = req.kauth.grant.access_token.content.sub;
  console.log("user id delete", userId);
  if(userId !== req.params.userId) {
    return res.status(401).send({response:'Operation not allowed - userId does not match logged in user'});
  }
  console.log("user id delete", userId);

  try {
    let bookmark = await Bookmark.findOneAndRemove({_id: req.params.bookmarkId, userId: req.params.userId});

    if (!bookmark) {
      return res.status(404).send(new MyError('Not Found Error', ['Bookmark for user id ' + req.params.userId + ' and bookmark id '+ req.params.bookmarkId + ' not found']));
    } else {
      res.status(204).send('Bookmark successfully deleted');
    }
  } catch (err) {
    return res.status(500).send(new MyError('Unknown server error', ['Unknown server error when trying to delete bookmark with id ' + req.params.bookmarkId]));
  }
});

module.exports = router;
