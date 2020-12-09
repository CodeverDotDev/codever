const express = require('express');
const router = express.Router();

const HttpStatus = require('http-status-codes/index');


const UserDataService = require('../users/user-data.service');

/**
 *  Returns the with query text
 */
router.get('/:userId/profile', async (request, response) => {
  const userId = request.params.userId;
  const usedPublicTags = await UserDataService.getUsedTagsForPublicBookmarks(userId);
  const topUsedPublicTags = usedPublicTags.slice(0, request.query.limit || 10);

  const userData = await UserDataService.getUserData(userId);
  const userPublicData = {
    userId: userData.userId,
    topUsedPublicTags: topUsedPublicTags,
    publicProfile: userData.profile,
    followers: userData.followers
  }

  return response.status(HttpStatus.OK).json(userPublicData);
});

module.exports = router;
