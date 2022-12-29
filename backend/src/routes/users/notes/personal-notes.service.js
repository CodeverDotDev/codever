const Note = require('../../../model/note');

const NotFoundError = require('../../../error/not-found.error');

const NoteInputValidator = require('./note-input.validator');

/**
 * CREATE note for user
 */
let createNote = async function (userId, noteData) {
  NoteInputValidator.validateNoteInput(userId, noteData);

  const note = new Note(noteData);
  let newNote = await note.save();

  return newNote;
}

/* GET bookmark of user by bookmarkId */
let getNoteById = async (userId, noteId) => {

  const note = await Note.findOne({
    _id: noteId,
    userId: userId
  });

  if ( !note ) {
    throw new NotFoundError(`Note NOT_FOUND the userId: ${userId} AND id: ${noteId}`);
  } else {
    return note;
  }
};

/* GET last created snippets of the user */
let getLatestNotes = async (userId, limit) => {
  const notes = await Note.find({userId: userId})
    .sort({createdAt: -1})
    .limit(limit);

  return notes;
};

/* GET last created snippets of the user */
let getAllMyNotes = async (userId) => {
  const notes = await Note.find({userId: userId})
    .sort({createdAt: -1});

  return notes;
};

/**
 * full UPDATE via PUT - that is the whole document is required and will be updated
 * the descriptionHtml parameter is only set in backend, if only does not come front-end (might be an API call)
 */
let updateNote = async (userId, noteId, noteData) => {

  NoteInputValidator.validateSnippetInput(userId, noteData);

  const updatedNote = await Note.findOneAndUpdate(
    {
      _id: noteId,
      userId: userId
    },
    noteData,
    {new: true}
  );

  const noteNotFound = !updatedNote;
  if ( noteNotFound ) {
    throw new NotFoundError('Note NOT_FOUND with id: ' + noteId + ' AND title: ' + noteData.title);
  } else {
    return updatedNote;
  }
};

/*
* DELETE snippet for user
*/
let deleteNoteById = async (userId, noteId) => {
  const note = await Note.findOneAndRemove({
    _id: noteId,
    userId: userId
  });

  if ( !note ) {
    throw new NotFoundError('Note NOT_FOUND with id: ' + noteId);
  }
};

/* GET suggested tags used for user */
let getSuggestedNoteTags = async (userId) => {

  const tags = await Note.distinct("tags",
    {userId: userId}
  ); // sort does not work with distinct in mongoose - https://mongoosejs.com/docs/api.html#query_Query-sort

  return tags;
};

let getUserNoteTags = async (userId) => {

  const aggregatedTags = await Note.aggregate([
    //first stage - filter
    {
      $match: {
        userId: userId
      },
    },

    //second stage - unwind tags
    {$unwind: "$tags"},

    //third stage - group
    {
      $group: {
        _id: {
          tag: '$tags'
        },
        count: {
          $sum: 1
        }
      }
    },

    //fourth stage - order by count desc
    {
      $sort: {count: -1}
    }
  ]);

  const userTags = aggregatedTags.map(aggregatedTag => {
    return {
      name: aggregatedTag._id.tag,
      count: aggregatedTag.count
    }
  });

  return userTags;
};


module.exports = {
  createNote: createNote,
  getSuggestedNoteTags: getSuggestedNoteTags,
  getUserNoteTags: getUserNoteTags,
  getNoteById: getNoteById,
  getLatestNotes: getLatestNotes,
  getAllMyNotes: getAllMyNotes,
  updateNote: updateNote,
  deleteNoteById: deleteNoteById,
};
