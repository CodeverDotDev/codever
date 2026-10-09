import { Bookmark } from './bookmark';
import { Note } from './note';

export interface CollectionItem {
  resourceId: string;
  resourceType: 'bookmark' | 'note';
  addedAt?: Date;
}

export interface PopulatedCollectionItem extends CollectionItem {
  resource: Bookmark | Note;
}

export interface Collection {
  _id?: string;
  name: string;
  description?: string;
  userId: string;
  items: CollectionItem[];
  populatedItems?: PopulatedCollectionItem[];
  public: boolean;
  color?: string;
  lastVisitedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * A pinned collection as returned by the pinned-resources endpoint: only the
 * fields needed to render and route it, without its contents (`items`).
 */
export interface PinnedCollection {
  _id?: string;
  type: 'collection';
  name: string;
  color?: string;
  userId?: string;
}

/** Projects a full collection into the light shape used when it is pinned. */
export function toPinnedCollection(collection: Collection): PinnedCollection {
  return {
    _id: collection._id,
    type: 'collection',
    name: collection.name,
    color: collection.color,
    userId: collection.userId,
  };
}

