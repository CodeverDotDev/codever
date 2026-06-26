const express = require('express');
const personalNotesRouter = express.Router({ mergeParams: true });
const Keycloak = require('keycloak-connect');

const PersonalNotesService = require('./personal-notes.service');
const NotesSearchService = require('./notes-search.service');
const UserIdValidator = require('../userid.validator');
const PaginationQueryParamsHelper = require('../../../common/pagination-query-params-helper');
const AiRefineService = require('../../ai/ai-refine.service');

const common = require('../../../common/config');
const config = common.config();

const HttpStatus = require('http-status-codes/index');

//add keycloak middleware
const keycloak = new Keycloak({ scope: 'openid' }, config.keycloak);
personalNotesRouter.use(keycloak.middleware());

/**
 * CREATE note for user
 */
personalNotesRouter.post('/', keycloak.protect(), async (request, response) => {
  UserIdValidator.validateUserId(request);
  const noteData = request.body;
  let newNote = await PersonalNotesService.createNote(
    request.params.userId,
    noteData
  );

  response
    .set(
      'Location',
      `${config.basicApiUrl}/personal/users/${request.params.userId}/notes/${newNote.id}`
    )
    .status(HttpStatus.CREATED)
    .send(newNote);
});

/**
 * AI-refine note content, tags, and title via DeepSeek API
 */
personalNotesRouter.post('/ai-refine', keycloak.protect(), async (request, response) => {
  UserIdValidator.validateUserId(request);
  const { title, content, tags, reference } = request.body;

  try {
    const result = await AiRefineService.refineNoteContent(
      request.params.userId,
      { title, content, tags, reference }
    );
    response.status(HttpStatus.OK).json(result);
  } catch (err) {
    if (err.isUnreachable) {
      return response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        message: err.message,
        unreachable: true,
      });
    }
    if (err.isAuthError) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: err.message,
        authError: true,
      });
    }
    if (err.isRateLimit) {
      return response.status(HttpStatus.TOO_MANY_REQUESTS).json({
        message: err.message,
        rateLimit: true,
      });
    }
    console.error('AI refine error:', err.message);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: err.message,
    });
  }
});

/**
 * GET suggested notes used by user
 *
 **/
personalNotesRouter.get(
  '/suggested-tags',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);
    const tags = await PersonalNotesService.getSuggestedNoteTags(
      request.params.userId
    );

    response.send(tags);
  }
);

/**
 * GET tags used by user
 *
 **/
personalNotesRouter.get(
  '/tags',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);
    const tags = await PersonalNotesService.getUserNoteTags(
      request.params.userId
    );

    response.send(tags);
  }
);

/**
 * GET all notes of a user, ordered by createdAt date descending
 **/
personalNotesRouter.get(
  '/export',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);
    const notes = await PersonalNotesService.getAllMyNotes(
      request.params.userId
    );

    response.send(notes);
  }
);

/* GET shareableId for note */
personalNotesRouter.get(
  '/shareable/:noteId',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);

    const { userId, noteId } = request.params;
    const shareableId = await PersonalNotesService.getOrCreateShareableId(
      userId,
      noteId
    );
    return response.json({ shareableId: shareableId });
  }
);

/**
 * Find personal notes
 */
personalNotesRouter.get(
  '/',
  keycloak.protect(),
  async (request, response, next) => {
    UserIdValidator.validateUserId(request);

    const searchText = request.query.q;
    const searchInclude = request.query.include || 'all';
    const { page, limit } =
      PaginationQueryParamsHelper.getPageAndLimit(request);

    const { userId } = request.params;
    if (searchText) {
      const notes = await NotesSearchService.findPersonalNotes(
        userId,
        searchText,
        page,
        limit,
        searchInclude
      );

      return response.status(HttpStatus.OK).send(notes);
    } else {
      next();
    }
  }
);

/*
 * Different others filters in case search in not involved
 */
/**
 * Find personal snippets
 */
personalNotesRouter.get('/', keycloak.protect(), async (request, response) => {
  UserIdValidator.validateUserId(request);

  const { userId } = request.params;
  const { page, limit } = PaginationQueryParamsHelper.getPageAndLimit(request);
  const notes = await PersonalNotesService.getLatestNotes(userId, page || 1, limit || 10);

  return response.status(HttpStatus.OK).send(notes);
});

/* GET note of user */
personalNotesRouter.get(
  '/:noteId',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);

    const { userId, noteId: noteId } = request.params;
    const note = await PersonalNotesService.getNoteById(userId, noteId);

    return response.status(HttpStatus.OK).send(note);
  }
);

/**
 * full UPDATE via PUT - that is the whole document is required and will be updated
 */
personalNotesRouter.put(
  '/:noteId',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);

    const noteData = request.body;

    const { userId, noteId } = request.params;
    const updatedNote = await PersonalNotesService.updateNote(
      userId,
      noteId,
      noteData
    );

    return response.status(HttpStatus.OK).send(updatedNote);
  }
);

/*
 * DELETE note for user
 */
personalNotesRouter.delete(
  '/:noteId',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);
    const { userId, noteId } = request.params;
    await PersonalNotesService.deleteNoteById(userId, noteId);
    return response.status(HttpStatus.NO_CONTENT).send();
  }
);

module.exports = personalNotesRouter;
