const express = require('express');
const usersRouter = express.Router();
const personalBookmarksRouter = require('./personal-bookmarks');

const Keycloak = require('keycloak-connect');

const User = require('../../models/user');
const Bookmark = require('../../models/bookmark');
const MyError = require('../../models/error');

const common = require('../../common/config');
const config = common.config();

const HttpStatus = require('http-status-codes');

//showdown converter - https://github.com/showdownjs/showdown
const showdown = require('showdown'),
  converter = new showdown.Converter();

//add keycloak middleware
const keycloak = new Keycloak({scope: 'openid'}, config.keycloak);
usersRouter.use(keycloak.middleware());

usersRouter.use('/:userId/bookmarks', personalBookmarksRouter);


/* GET personal bookmarks of the users */
usersRouter.get('/:userId', keycloak.protect(), async (request, response) => {
  try {
    let userId = request.kauth.grant.access_token.content.sub;
    if ( userId !== request.params.userId ) {
      return response
        .status(HttpStatus.UNAUTHORIZED)
        .send(new MyError('Unauthorized', ['the userId does not match the subject in the access token']));
    }

    const userData = await User.findOne({
      userId: request.params.userId
    });

    if ( !userData ) {
      return response
        .status(HttpStatus.NOT_FOUND)
        .send(new MyError(
          'User data was not found',
          ['User data of the user with the userId ' + request.params.userId + ' was not found']
          )
        );
    } else {
      response.status(HttpStatus.OK).json(userData);
    }

  } catch (err) {
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(err);
  }
});

/* GET list of bookmarks to be read later for the user */
usersRouter.get('/:userId/later-reads', keycloak.protect(), async (request, response) => {
  try {
    let userId = request.kauth.grant.access_token.content.sub;
    if ( userId !== request.params.userId ) {
      return response
        .status(HttpStatus.UNAUTHORIZED)
        .send(new MyError('Unauthorized', ['the userId does not match the subject in the access token']));
    }

    const userData = await User.findOne({
      userId: request.params.userId
    });
    if ( !userData ) {
      return response
        .status(HttpStatus.NOT_FOUND)
        .send(new MyError(
          'User data was not found',
          ['User data of the user with the userId ' + request.params.userId + ' was not found']
          )
        );
    } else {
      const bookmarks = await Bookmark.find({"_id": {$in: userData.readLater}});
      response.send(bookmarks);
    }

  } catch (err) {
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(err);
  }
});

/* GET list of liked bookmarks by the user */
usersRouter.get('/:userId/likes', keycloak.protect(), async (request, response) => {
  try {
    let userId = request.kauth.grant.access_token.content.sub;
    if ( userId !== request.params.userId ) {
      return response
        .status(HttpStatus.UNAUTHORIZED)
        .send(new MyError('Unauthorized', ['the userId does not match the subject in the access token']));
    }

    const userData = await User.findOne({
      userId: request.params.userId
    });
    if ( !userData ) {
      return response
        .status(HttpStatus.NOT_FOUND)
        .send(new MyError(
          'User data was not found',
          ['User data of the user with the userId ' + request.params.userId + ' was not found']
          )
        );
    } else {
      const bookmarks = await Bookmark.find({"_id": {$in: userData.likes}});
      response.send(bookmarks);
    }

  } catch (err) {
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(err);
  }
});

/* GET list of bookmarks for the user's watchedTags */
usersRouter.get('/:userId/watched-tags', keycloak.protect(), async (request, response) => {
  try {
    let userId = request.kauth.grant.access_token.content.sub;
    if ( userId !== request.params.userId ) {
      return response
        .status(HttpStatus.UNAUTHORIZED)
        .send(new MyError('Unauthorized', ['the userId does not match the subject in the access token']));
    }

    const userData = await User.findOne({
      userId: request.params.userId
    });
    if ( !userData ) {
      return response
        .status(HttpStatus.NOT_FOUND)
        .send(new MyError(
          'User data was not found',
          ['User data of the user with the userId ' + request.params.userId + ' was not found']
          )
        );
    } else {
      const bookmarks = await Bookmark.find({
        shared: true,
        tags: {$elemMatch: {$in: userData.watchedTags}}
      })
        .sort({createdAt: -1})
        .limit(100)
        .lean()
        .exec();
      //
      response.send(bookmarks);
    }
  } catch (err) {
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(err);
  }
});

/* GET list of user's pinned bookmarks */
usersRouter.get('/:userId/pinned', keycloak.protect(), async (request, response) => {
  try {
    let userId = request.kauth.grant.access_token.content.sub;
    if ( userId !== request.params.userId ) {
      return response
        .status(HttpStatus.UNAUTHORIZED)
        .send(new MyError('Unauthorized', ['the userId does not match the subject in the access token']));
    }

    const userData = await User.findOne({
      userId: request.params.userId
    });
    if ( !userData ) {
      return response
        .status(HttpStatus.NOT_FOUND)
        .send(new MyError(
          'User data was not found',
          ['User data of the user with the userId ' + request.params.userId + ' was not found']
          )
        );
    } else {
      const bookmarks = await Bookmark.find({"_id": {$in: userData.pinned}});
      //we need to order the bookmarks to correspond the one in the userData.history array
      const orderedBookmarksAsInPinned = userData.pinned.map(bookmarkId => {
        return bookmarks.filter(bookmark => bookmark._id.toString() === bookmarkId)[0];
      });

      response.send(orderedBookmarksAsInPinned);
    }

  } catch (err) {
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(err);
  }
});

/* GET list of user's favorite bookmarks */
usersRouter.get('/:userId/favorites', keycloak.protect(), async (request, response) => {
  try {
    let userId = request.kauth.grant.access_token.content.sub;
    if ( userId !== request.params.userId ) {
      return response
        .status(HttpStatus.UNAUTHORIZED)
        .send(new MyError('Unauthorized', ['the userId does not match the subject in the access token']));
    }

    const userData = await User.findOne({
      userId: request.params.userId
    });
    if ( !userData ) {
      return response
        .status(HttpStatus.NOT_FOUND)
        .send(new MyError(
          'User data was not found',
          ['User data of the user with the userId ' + request.params.userId + ' was not found']
          )
        );
    } else {
      const bookmarks = await Bookmark.find({"_id": {$in: userData.favorites}});
      //we need to order the bookmarks to correspond the one in the userData.history array
      const orderedBookmarksAsInFavorites = userData.favorites.map(bookmarkId => {
        return bookmarks.filter(bookmark => bookmark._id.toString() === bookmarkId)[0];
      });

      response.send(orderedBookmarksAsInFavorites);
    }

  } catch (err) {
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(err);
  }
});

/* GET list of user's last visited bookmarks */
usersRouter.get('/:userId/history', keycloak.protect(), async (request, response) => {
  try {
    let userId = request.kauth.grant.access_token.content.sub;
    if ( userId !== request.params.userId ) {
      return response
        .status(HttpStatus.UNAUTHORIZED)
        .send(new MyError('Unauthorized', ['the userId does not match the subject in the access token']));
    }

    const userData = await User.findOne({
      userId: request.params.userId
    });
    if ( !userData ) {
      return response
        .status(HttpStatus.NOT_FOUND)
        .send(new MyError(
          'User data was not found',
          ['User data of the user with the userId ' + request.params.userId + ' was not found']
          )
        );
    } else {
      const bookmarks = await Bookmark.find({"_id": {$in: userData.history}});

      //we need to order the bookmarks to correspond the one in the userData.history array
      const orderedBookmarksAsInHistory = userData.history.map(bookmarkId => {
        return bookmarks.filter(bookmark => bookmark._id.toString() === bookmarkId)[0];
      });

      response.send(orderedBookmarksAsInHistory);
    }

  } catch (err) {
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(err);
  }
});


/*
* create user details
* */
usersRouter.post('/:userId', keycloak.protect(), async (request, response) => {
  try {

    let userId = request.kauth.grant.access_token.content.sub;

    const userIdIsInconsistentInPathAndAccessToken = userId !== request.params.userId;
    if ( userIdIsInconsistentInPathAndAccessToken ) {
      return response
        .status(HttpStatus.UNAUTHORIZED)
        .send(new MyError('Unauthorized', ['the userId does not match the subject in the access token']));
    }

    const invalidUserIdInRequestBody = !request.body.userId || request.body.userId != userId;
    if ( invalidUserIdInRequestBody ) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .send(new MyError('Missing or invalid userId in the request body',
          ['the userId must be consistent across path, body and access token']));
    }

    if ( !searchesAreValid(request) ) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .send(new MyError('Searches are not valid',
          ['Searches are not valid - search text is required']));
    }


    const userData = new User({
      userId: request.params.userId,
      searches: request.body.searches,
      readLater: request.body.readLater,
      likes: request.body.likes,
      watchedTags: request.body.watchedTags,
      pinned: request.body.pinned,
      favorites: request.body.favorites,
      history: request.body.history
    });

    const newUserData = await userData.save();

    response.status(HttpStatus.CREATED).send(newUserData);

  } catch (err) {
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(err);
  }
});

/* UPDATE user details
* If users data is not present it will be created (upsert=true)
*
* */
usersRouter.put('/:userId', keycloak.protect(), async (request, response) => {
  try {

    let userId = request.kauth.grant.access_token.content.sub;

    const userIdIsInconsistentInPathAndAccessToken = userId !== request.params.userId;
    if ( userIdIsInconsistentInPathAndAccessToken ) {
      return response
        .status(HttpStatus.UNAUTHORIZED)
        .send(new MyError('Unauthorized', ['the userId does not match the subject in the access token']));
    }

    const invalidUserIdInRequestBody = !request.body.userId || request.body.userId != userId;
    if ( invalidUserIdInRequestBody ) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .send(new MyError('Missing or invalid userId in the request body',
          ['the userId must be consistent across path, body and access token']));
    }

    if ( !searchesAreValid(request) ) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .send(new MyError('Searches are not valid',
          ['Searches are not valid - search text is required']));
    }

    //hold only 30 bookmarks in history or pinned
    if ( request.body.history.length > 30 ) {
      request.body.history = request.body.history.slice(0, 3);
    }

    if ( request.body.pinned.length > 30 ) {
      request.body.pinned = request.body.pinned.slice(0, 3);
    }

    delete request.body._id;//once we proved it's present we delete it to avoid the following MOngoError by findOneAndUpdate
    // MongoError: After applying the update to the document {_id: ObjectId('5c513150e13cda73420a9602') , ...}, the (immutable) field '_id' was found to have been altered to _id: "5c513150e13cda73420a9602"
    const userData = await User.findOneAndUpdate(
      {userId: request.params.userId},
      request.body,
      {upsert: true, new: true}, // options
    );
    response.status(HttpStatus.OK).send(userData);

  } catch (err) {
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(err);
  }
});

function searchesAreValid(request) {
  const searches = request.body.searches;
  if ( searches && searches.length > 0 ) {
    for ( let i = 0; i < searches.length; i++ ) {
      if ( !searches[i].text ) {
        return false;
      }
    }
  }

  return true;
}


/*
* DELETE user
*/
usersRouter.delete('/:userId', keycloak.protect(), async (request, response) => {

  const userId = request.kauth.grant.access_token.content.sub;
  if ( userId !== request.params.userId ) {
    return response
      .status(HttpStatus.UNAUTHORIZED)
      .send(new MyError('Unauthorized', ['the userId does not match the subject in the access token']));
  }

  try {
    const userData = await User.findOneAndRemove({
      userId: request.params.userId
    });

    if ( !userData ) {
      return response
        .status(HttpStatus.NOT_FOUND)
        .send(new MyError(
          'Not Found Error',
          ['User Data for user id was not found']
          )
        );
    } else {
      response.status(HttpStatus.NO_CONTENT).send();
    }
  } catch (err) {
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(new MyError('Unknown server error',
        ['Unknown server error when trying to delete user with id ' + request.params.userId]));
  }
});

/*
* rate bookmark
*/
usersRouter.patch('/:userId/bookmarks/likes/:bookmarkId', keycloak.protect(), async (request, response) => {

  const userId = request.kauth.grant.access_token.content.sub;
  if ( userId !== request.params.userId ) {
    return response
      .status(HttpStatus.UNAUTHORIZED)
      .send(new MyError('Unauthorized', ['the userId does not match the subject in the access token']));
  }

  if ( userId !== request.body.ratingUserId ) {
    return response.status(HttpStatus.UNAUTHORIZED).send(new MyError('Invalid userId', ['The id from the access token must match the one from the request']));
  }
  const requiredAttributesMissing = !request.body.action || !request.body.ratingUserId;
  if ( requiredAttributesMissing ) {
    return response
      .status(HttpStatus.BAD_REQUEST)
      .send(new MyError('Missing required attributes', ['Missing required attributes']));
  }

  try {
    const userData = await User.findOne({
      userId: request.params.userId
    });

    if ( !userData ) {
      return response
        .status(HttpStatus.NOT_FOUND)
        .send(new MyError(
          'Not Found Error',
          ['User Data for user id was not found']
          )
        );
    } else {
      if ( request.body.action === 'LIKE' ) {
        try {
          if (userData.likes.includes(request.params.bookmarkId)) {
            return response
              .status(HttpStatus.BAD_REQUEST)
              .send(new MyError('You already starred this bookmark', ['You already starred this bookmark']));
          } else {

            await User.update(
              {userId: request.params.userId},
              {$push: {likes: request.params.bookmarkId}}
            );

            const bookmark = await Bookmark.findOneAndUpdate({_id: request.params.bookmarkId}, {$inc: {likes: 1}});

            const bookmarkNotFound = !bookmark;
            if ( bookmarkNotFound ) {
              return response
                .status(HttpStatus.NOT_FOUND)
                .send(new MyError('Not Found Error', ['Bookmark with bookmark id ' + request.params.bookmarkId + ' not found']));
            } else {
              response
                .status(HttpStatus.OK)
                .send(bookmark);
            }
          }

        } catch (err) {
          return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(new MyError('Unknown Server Error', ['Unknow server error when starring bookmark with id ' + request.params.bookmarkId]));
        }
      } else if ( request.body.action === 'UNLIKE' ) {
        try {
          if (!userData.likes.includes(request.params.bookmarkId)) {
            return response
              .status(HttpStatus.BAD_REQUEST)
              .send(new MyError('You did not like this bookmark', ['You did not like this bookmark']));
          } else {

            await User.update(
              {userId: request.params.userId},
              {$pull: {likes: request.params.bookmarkId}}
            );

            const bookmark = await Bookmark.findOneAndUpdate({_id: request.params.bookmarkId}, {$inc: {likes: -1}});
            const bookmarkNotFound = !bookmark;
            if ( bookmarkNotFound ) {
              return response
                .status(HttpStatus.NOT_FOUND)
                .send(new MyError('Not Found Error', ['Bookmark with bookmark id ' + request.params.bookmarkId + ' not found']));
            } else {
              response
                .status(HttpStatus.OK)
                .send(bookmark);
            }
          }
        } catch (err) {
          return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(new MyError('Unknown Server Error', ['Unknow server error when unstarring bookmark with id ' + request.params.bookmarkId]));
        }
      } else {
        return response
          .status(HttpStatus.BAD_REQUEST)
          .send(new MyError('Rating action should be either LIKE or UNLIKE', ['Rating action should be either STAR or UNSTAR']));
      }
    }
  } catch (err) {
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(new MyError('Unknown server error',
        ['Unknown server error when trying to delete user with id ' + request.params.userId]));
  }
});

module.exports = usersRouter;
