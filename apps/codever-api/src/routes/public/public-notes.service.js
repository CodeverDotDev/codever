const Note = require('../../model/note');
const NotFoundError = require('../../error/not-found.error');

let getNoteById = async function (noteId) {
  const note = await Note.findOne({
    public: true,
    _id: noteId,
  });

  if (!note) {
    throw new NotFoundError(`Note data NOT_FOUND for id: ${noteId}`);
  }

  return note;
};

/* GET note by shareableId */
let getNoteByShareableId = async (shareableId) => {
  const note = await Note.findOne({
    shareableId: shareableId,
  }).select('+shareableId');

  if (!note) {
    throw new NotFoundError(`Note NOT_FOUND for shareableId: ${shareableId}`);
  }

  return note;
};

module.exports = {
  getNoteById: getNoteById,
  getNoteByShareableId: getNoteByShareableId,
};

