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

