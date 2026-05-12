const express = require('express');
const router = express.Router();

const PublicNotesService = require('./public-notes.service');
const PaginationQueryParamsHelper = require('../../common/pagination-query-params-helper');

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
 * Search public notes with query text
 */
router.get('/', async (request, response, next) => {
  const searchText = request.query.q;
  const searchInclude = request.query.include || 'all';
  const { page, limit } = PaginationQueryParamsHelper.getPageAndLimit(request);

  if (searchText) {
    const notes = await PublicNotesService.searchPublicNotes(
      searchText,
      page,
      limit,
      searchInclude
    );
    return response.send(notes);
  } else {
    next();
  }
});

/**
 * GET public note by id
 */
router.get('/:id', async (request, response) => {
  const note = await PublicNotesService.getNoteById(request.params.id);
  return response.send(note);
});

module.exports = router;

