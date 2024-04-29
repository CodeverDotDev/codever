// find last 10 snippets created
db.snippets.find().sort({createdAt: -1}).limit(10).pretty();

// find count snippets that have origin property
db.snippets.find({ origin: { $exists: true } }).count();

// show last 10 snippets that have origin property
db.snippets.find({ origin: { $exists: true } }).sort({createdAt: -1}).limit(10).pretty();

// count snippets that have reference property
db.snippets.find({ reference: { $exists: true } }).count();

// find snippets that include "a text" in the title property
db.snippets.find({ title: /a text/ }).pretty();

// find snipppets where "initiator" exists and not undefined
db.snippets.find({ initiator: { $ne: undefined } }).pretty();
