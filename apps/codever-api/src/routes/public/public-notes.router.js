const express = require('express');
const router = express.Router();

const PublicNotesService = require('./public-notes.service');
const SharedResourceMapper = require('./shared-resource.mapper');
const {
  noReferrer,
  noStore,
} = require('../../common/share-response-headers.middleware');
const PaginationQueryParamsHelper = require('../../common/pagination-query-params-helper');

/**
 * Get note by active share link token
 */
router.get(
  '/shared/:token',
  noStore,
  noReferrer,
  async (request, response) => {
    const sharedNote = await PublicNotesService.getSharedNoteByToken(
      request.params.token
    );

    return response.json(SharedResourceMapper.mapSharedNote(sharedNote));
  }
);

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
 * GET latest public notes (no search query)
 */
router.get('/', async (request, response) => {
  const { page, limit } = PaginationQueryParamsHelper.getPageAndLimit(request);
  const notes = await PublicNotesService.getLatestPublicNotes(
    page || 1,
    limit || 20
  );
  return response.send(notes);
});

/**
 * GET public note by id
 */
router.get('/:id', async (request, response) => {
  const note = await PublicNotesService.getNoteById(request.params.id);
  return response.send(note);
});

module.exports = router;
