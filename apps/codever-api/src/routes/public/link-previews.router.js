const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const LinkPreviewsService = require('./link-previews.service');
const NotFoundError = require('../../error/not-found.error');

const isNotPublicEntry = (error) =>
  error instanceof NotFoundError || error instanceof mongoose.Error.CastError;

function sendHtml(response, html) {
  response.set('Content-Type', 'text/html; charset=utf-8');
  response.set('Cache-Control', 'no-cache');
  return response.status(200).send(html);
}

/**
 * Serves the app page with link-preview tags for a public entry. Private,
 * missing and invalid entries get the generic page (as for unknown URLs);
 * any other failure answers 503 so nginx serves the static page instead.
 */
const previewPage = (getPage) => async (request, response) => {
  try {
    return sendHtml(response, await getPage(request.params.id));
  } catch (error) {
    if (isNotPublicEntry(error)) {
      try {
        return sendHtml(response, await LinkPreviewsService.getGenericPage());
      } catch {
        // fall through to 503
      }
    }
    return response
      .status(503)
      .set('Cache-Control', 'no-store')
      .type('text/plain')
      .send('Link preview unavailable');
  }
};

router.get('/notes/:id', previewPage(LinkPreviewsService.getNotePage));
router.get('/bookmarks/:id', previewPage(LinkPreviewsService.getBookmarkPage));

module.exports = router;
