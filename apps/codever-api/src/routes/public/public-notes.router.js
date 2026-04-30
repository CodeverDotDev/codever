const express = require('express');
const router = express.Router();

const PublicNotesService = require('./public-notes.service');

/**
 * Get note by shareableId
 */
router.get('/shared/:shareableId', async (request, response) => {
  const sharedNote = await PublicNotesService.getNoteByShareableId(
    request.params.shareableId
  );

  return response.json(sharedNote);
});

/**
 * GET public note by id
 */
router.get('/:id', async (request, response) => {
  const note = await PublicNotesService.getNoteById(request.params.id);
  return response.send(note);
});

module.exports = router;

