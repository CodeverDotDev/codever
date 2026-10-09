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

