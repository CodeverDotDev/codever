db.bookmarks.update({}, { $set: { type: 'bookmark' } }, { multi: true });

db.snippets.update({}, { $set: { type: 'snippet' } }, { multi: true });

db.notes.update({}, { $set: { type: 'note' } }, { multi: true });
