const { z } = require('zod');
const ValidationError = require('../error/validation.error');
const { NoteValidationRules, NoteValidationErrorMessages } = require('../routes/users/notes/note-input.validator');
const { INVALID_TAGS, TOO_MANY_TAGS } = require('../common/validation/tag-policy');

const nonblank = z.string().refine((value) => value.trim().length > 0, 'Must not be blank');
const createNoteSchema = z.object({
  title: nonblank,
  content: z.string().max(NoteValidationRules.MAX_NUMBER_OF_CHARS_FOR_CONTENT)
    .refine((value) => value.trim().length > 0, 'Must not be blank'),
  // Count after normalization, not here: duplicates consume no extra slots.
  tags: z.array(nonblank).optional(),
  reference: z.string().optional(),
  origin: z.object({
    location: z.string().optional(),
    file: z.string().optional(),
    project: z.string().optional(),
    workspace: z.string().optional(),
  }).strict().optional(),
  public: z.boolean().optional(),
}).strict();

class McpNoteCreationError extends Error {}

const safeValidationMessages = new Set([
  ...Object.values(NoteValidationErrorMessages), INVALID_TAGS, TOO_MANY_TAGS,
]);

function creationErrorMessage(error) {
  if (error instanceof McpNoteCreationError) return error.message;
  if (error instanceof ValidationError) {
    const details = (error.validationErrors || []).filter((text) => safeValidationMessages.has(text));
    return ['The note is not valid.', ...details].join(' ');
  }
  if (error instanceof z.ZodError) {
    return 'Invalid create_note input. Use only title, content (1–30000 characters), tags, reference, origin and public; text must not be blank.';
  }
  return 'Could not create the note. Do not retry blindly: use search_entries/get_entry to check whether it was saved before trying again.';
}

/** Validate before persistence; never derive a link from request headers. */
function noteUrlBuilder(frontendBaseUrl) {
  try {
    if (typeof frontendBaseUrl !== 'string' || !frontendBaseUrl || /\s/.test(frontendBaseUrl)) throw new Error();
    const base = new URL(frontendBaseUrl);
    if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error();
    const prefix = base.href.replace(/\/+$/, '');
    return (id) => `${prefix}/my-notes/${encodeURIComponent(id)}/details`;
  } catch (_) {
    throw new McpNoteCreationError('Note creation is unavailable: configure a valid mcp.frontendBaseUrl. No note was saved.');
  }
}

module.exports = { createNoteSchema, McpNoteCreationError, creationErrorMessage, noteUrlBuilder };
