const express = require('express');
const router = express.Router();
const FeedbackService = require('./feedback-service');
const HttpStatus = require('http-status-codes/index');

router.post('/', async (request, response) => {
  await FeedbackService.createFeedback(request.body);
  response
    .status(HttpStatus.CREATED)
    .send();
});

module.exports = router;
