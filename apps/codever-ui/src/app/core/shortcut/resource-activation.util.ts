import { Note } from '../model/note';
import { PinnedCollection } from '../model/collection';
import { UserDataResource } from '../model/user-data-resource.type';

/**
 * Resource types a filter surface can activate with `Enter`. Bookmarks open
 * their main link in a new tab; notes and collections navigate to an in-app
 * details page in the current tab.
 *
 * `UserDataResource['type']` is a loose `string` on `Bookmark` and `Note`, so
 * the activatable set is spelled out explicitly instead of derived from it.
 */
export type ActivatableType = 'bookmark' | 'note' | 'collection';

/** What an activation did, so callers can react (for example, close a dialog). */
export type ResourceActivation = 'new-tab' | 'navigated';

/**
 * Details route for a note: the public route for a public note and the
 * personal route for the user's own note. Absolute so the result does not
 * depend on the currently active route.
 */
export function noteDetailsRoute(note: Note): string[] {
  return note.public
    ? ['/notes', note._id, 'details']
    : ['/my-notes', note._id, 'details'];
}

/** Details route for a collection. */
export function collectionDetailsRoute(
  collection: Pick<PinnedCollection, '_id'>
): string[] {
  return ['/my-collections', collection._id];
}

/**
 * The single activatable resource in an already-filtered list, or null when the
 * list is empty, holds more than one result, holds a resource type the surface
 * cannot activate, or holds an entry without an id.
 */
export function singleVisibleResource<T extends UserDataResource>(
  filtered: T[] | null | undefined,
  activatableTypes: readonly ActivatableType[]
): T | null {
  if (!filtered || filtered.length !== 1) {
    return null;
  }
  const only = filtered[0];
  if (!only._id || !activatableTypes.includes(only.type as ActivatableType)) {
    return null;
  }
  return only;
}

/**
 * Label for the contextual `Enter` hint ("bookmark", "note", "collection"), or
 * null when the resource would not be activated.
 */
export function activationHintLabel(
  resource: UserDataResource | null | undefined
): ActivatableType | null {
  if (!resource) {
    return null;
  }
  switch (resource.type) {
    case 'bookmark':
      return 'bookmark';
    case 'note':
      return 'note';
    case 'collection':
      return 'collection';
    default:
      return null;
  }
}
