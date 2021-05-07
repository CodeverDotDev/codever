const Bookmark = require('../../model/bookmark');
const cheerio = require('cheerio');

const IMPORTED_BROWSER_TAG = 'imported-browser';

let importBrowserBookmarks = async function (userId, bookmarksHtmlFileContent, userDisplayName) {

  const $ = cheerio.load(bookmarksHtmlFileContent);
  let bookmarks = [];
  $("a").each(function (index, a) {
    const $a = $(a);
    const bookmark = generateBookmarkFields(userId, $a, userDisplayName);
    bookmarks.push(bookmark);
  });

  let created = [];
  let duplicates = [];
  let inError = [];
  for ( let i = 0; i < bookmarks.length; i++ ) {
    const bookmark = bookmarks[i];
    try {
      let existingBookmark = await Bookmark.findOne({userId: userId, location: bookmark.location});
      if ( existingBookmark ) {
        const mergedTags = [...existingBookmark.tags, ...bookmark.tags];
        const mergedTagsUnique = [...new Set(mergedTags)];
        if ( existingBookmark.public ) {
          const sanitizeForPublic = mergedTagsUnique.filter(tag => tag !== IMPORTED_BROWSER_TAG);
          existingBookmark.tags = sanitizeForPublic;
        } else {
          existingBookmark.tags = mergedTagsUnique;
        }
        existingBookmark.save();
        duplicates.push(existingBookmark);
      } else {
        const newBookmark = await Bookmark.create(bookmarks[i]);
        created.push(newBookmark);
      }
    } catch (error) {
      inError.push(bookmarks[i]);
    }
  }

  return {
    created: created,
    duplicatesSize: duplicates.length,
    inErrorSize: inError.length
  }

}

function generateBookmarkFields(userId, $a, userDisplayName) {
  let categories = getCategories($a);
  let loweredDashedCase = categories.map(category => category.replace(/\s+/g, '-').toLowerCase());
  const excludedCategories = ['bookmarks', 'bookmarks-bar', 'favourites', 'bookmarks-menu', 'bookmarks-toolbar'];
  let tags = loweredDashedCase.filter(category => !excludedCategories.includes(category)) || [];
  tags.push(IMPORTED_BROWSER_TAG);
  let bookmark = {
    name: $a.text(),
    location: $a.attr("href"),
    userId: userId,
    userDisplayName: userDisplayName,
    public: false,
    tags: tags,
    likeCount: 0
  }

  return bookmark;
}

function getCategories($a) {
  const $node = $a.closest("DL").prev();
  const title = $node.text();

  if ( $node.length > 0 && title.length > 0 ) {
    return [title].concat(getCategories($node));
  } else {
    return [];
  }
}


module.exports = {
  importBrowserBookmarks: importBrowserBookmarks
}
