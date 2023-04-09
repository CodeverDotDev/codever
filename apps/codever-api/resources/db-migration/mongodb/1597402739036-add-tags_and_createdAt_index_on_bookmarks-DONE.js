// this index is use mainly in the tagged pages order by insertion date
db.bookmarks.createIndex(
  { tags: 1, createdAt: -1 },
  { name: 'tags_createdAt_desc_idx' }
);
