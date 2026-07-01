import { Bookmark } from './bookmark';
import { Note } from './note';

/**
 * A resource tracked in the user-data lists (pinned, history, …) can be either
 * a bookmark or a note. Both share `_id`, `type` and `public`, which is enough
 * to render and route them in those lists.
 */
export type UserDataResource = Bookmark | Note;

