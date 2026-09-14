import { Bookmark } from './bookmark';
import { PinnedCollection } from './collection';
import { Note } from './note';

/**
 * A resource tracked in the user-data lists (pinned, history, …) can be a
 * bookmark, a note, or a pinned collection. All three carry `_id` and `type`,
 * which is enough to render, filter, and route them in those lists. Pinned
 * collections are returned without their contents.
 */
export type UserDataResource = Bookmark | Note | PinnedCollection;

