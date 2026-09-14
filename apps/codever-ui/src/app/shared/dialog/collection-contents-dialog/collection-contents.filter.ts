import { Bookmark } from '../../../core/model/bookmark';
import { Note } from '../../../core/model/note';

export interface CollectionContentsFilterResult {
  bookmarks: Bookmark[];
  notes: Note[];
}

/**
 * Filters a collection's bookmarks and notes by a single free-text query.
 * Bookmarks match on `name` or `tags`; notes match on `title` or `tags`.
 * An empty query returns everything (copies, so callers can mutate freely).
 */
export function filterCollectionContents(
  bookmarks: Bookmark[],
  notes: Note[],
  filterText: string
): CollectionContentsFilterResult {
  const query = (filterText || '').toLowerCase().trim();
  if (!query) {
    return { bookmarks: [...bookmarks], notes: [...notes] };
  }

  return {
    bookmarks: bookmarks.filter(
      (bookmark) =>
        bookmark.name?.toLowerCase().includes(query) ||
        bookmark.tags?.some((tag) => tag.toLowerCase().includes(query))
    ),
    notes: notes.filter(
      (note) =>
        note.title?.toLowerCase().includes(query) ||
        note.tags?.some((tag) => tag.toLowerCase().includes(query))
    ),
  };
}
