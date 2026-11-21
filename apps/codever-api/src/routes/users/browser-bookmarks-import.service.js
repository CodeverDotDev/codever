const Bookmark = require('../../model/bookmark');
const cheerio = require('cheerio');

const IMPORTED_BROWSER_TAG = 'imported-browser';

/* Root folder of a Codever browser HTML export, e.g. "Codever export 2026-11-20" */
const CODEVER_EXPORT_ROOT = /^codever export/i;
const CODEVER_EXPORT_TAGS_FOLDER = 'Tags';

const EXCLUDED_BROWSER_CATEGORIES = [
  'bookmarks',
  'bookmarks-bar',
  'favourites',
  'bookmarks-menu',
  'bookmarks-toolbar',
];

let importBrowserBookmarks = async function (
  userId,
  bookmarksHtmlFileContent,
  userDisplayName
) {
  const $ = cheerio.load(bookmarksHtmlFileContent);
  const links = [];
  $('a').each(function (index, a) {
    links.push(parseLink($(a)));
  });

  const bookmarks = groupByLocation(links).map((link) => ({
    name: link.name,
    location: link.location,
    userId: userId,
    userDisplayName: userDisplayName,
    public: false,
    tags: link.tags,
    likeCount: 0,
  }));

  let created = [];
  let duplicatesSize = 0;
  let inErrorSize = 0;
  for (const bookmark of bookmarks) {
    try {
      let existingBookmark = await Bookmark.findOne({
        userId: userId,
        location: bookmark.location,
      });
      if (existingBookmark) {
        const mergedTagsUnique = [
          ...new Set([...existingBookmark.tags, ...bookmark.tags]),
        ];
        if (existingBookmark.public) {
          existingBookmark.tags = mergedTagsUnique.filter(
            (tag) => tag !== IMPORTED_BROWSER_TAG
          );
        } else {
          existingBookmark.tags = mergedTagsUnique;
        }
        await existingBookmark.save();
        duplicatesSize++;
      } else {
        const newBookmark = await Bookmark.create(bookmark);
        created.push(newBookmark);
      }
    } catch (error) {
      inErrorSize++;
    }
  }

  return {
    created: created,
    duplicatesSize: duplicatesSize,
    inErrorSize: inErrorSize,
  };
};

/**
 * Reads name, location and tags of one link. Links inside a Codever export
 * root get their tags from the TAGS attribute or the `Tags/<tag>` folder;
 * all other links get their (normalised) ancestor folder names as tags.
 */
function parseLink($a) {
  const folderPath = getCategories($a).reverse(); // outermost first
  const rootIndex = folderPath.findIndex((folder) =>
    CODEVER_EXPORT_ROOT.test(folder.trim())
  );
  const tags =
    rootIndex >= 0
      ? getCodeverExportTags($a, folderPath.slice(rootIndex + 1))
      : getBrowserFolderTags(folderPath);

  return {
    name: $a.text(),
    location: $a.attr('href'),
    tags: [...tags, IMPORTED_BROWSER_TAG],
  };
}

function getCodeverExportTags($a, pathBelowRoot) {
  const tagsAttribute = ($a.attr('tags') || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
  if (tagsAttribute.length > 0) {
    return tagsAttribute;
  }

  const [section, tagFolder] = pathBelowRoot.map((folder) => folder.trim());
  if (section === CODEVER_EXPORT_TAGS_FOLDER && tagFolder) {
    return [tagFolder];
  }

  return [];
}

function getBrowserFolderTags(folderPath) {
  // innermost folder first, as historically imported
  return [...folderPath]
    .reverse()
    .map((category) => category.replace(/\s+/g, '-').toLowerCase())
    .filter((category) => !EXCLUDED_BROWSER_CATEGORIES.includes(category));
}

/**
 * Merges links with the same location (the same URL can appear in several
 * folders) into one, keeping the first name and the union of the tags.
 */
function groupByLocation(links) {
  const byLocation = new Map();
  for (const link of links) {
    const existing = byLocation.get(link.location);
    if (existing) {
      existing.tags = [...new Set([...existing.tags, ...link.tags])];
    } else {
      byLocation.set(link.location, {
        ...link,
        tags: [...new Set(link.tags)],
      });
    }
  }

  return [...byLocation.values()];
}

function getCategories($a) {
  const $node = $a.closest('DL').prev();
  const title = $node.text();

  if ($node.length > 0 && title.length > 0) {
    return [title].concat(getCategories($node));
  } else {
    return [];
  }
}

module.exports = {
  importBrowserBookmarks: importBrowserBookmarks,
};
