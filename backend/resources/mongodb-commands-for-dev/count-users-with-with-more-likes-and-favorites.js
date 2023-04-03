//https://stackoverflow.com/questions/7811163/query-for-documents-where-array-size-is-greater-than-1/15224544
db.users.count({ $where: 'this.favorites.length > 5' });
// list users
db.users.find({ $where: 'this.favorites.length > 5' }).pretty();

db.users.count({ 'favorites.5': { $exists: true } });
db.users.find({ 'favorites.5': { $exists: true } }).pretty();

db.users.count({ $where: 'this.likes.length > 2' });
//list users
db.users.find({ $where: 'this.likes.length > 2' }).pretty();
