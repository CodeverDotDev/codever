db.bookmarks.update({}, { $set: { source: 'unknown' } }, { multi: true });
db.snippets.update({}, { $set: { source: 'unknown' } }, { multi: true });
db.notes.update({}, { $set: { source: 'unknown' } }, { multi: true });

db.bookmarks.updateMany({}, { $rename: { source: 'initiatedFrom' } });
db.snippets.updateMany({}, { $rename: { source: 'initiatedFrom' } });
db.notes.updateMany({}, { $rename: { source: 'initiatedFrom' } });

db.bookmarks.updateMany({}, { $set: { initiatedFrom: undefined } });
db.snippets.updateMany({}, { $set: { initiatedFrom: undefined } });
db.notes.updateMany({}, { $set: { initiatedFrom: undefined } });

db.bookmarks.updateMany({}, { $rename: { initiatedFrom: 'initiator' } });
db.snippets.updateMany({}, { $rename: { initiatedFrom: 'initiator' } });
db.notes.updateMany({}, { $rename: { initiatedFrom: 'initiator' } });
