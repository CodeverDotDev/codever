export interface CollectionItem {
  resourceId: string;
  resourceType: 'bookmark' | 'note';
  addedAt?: Date;
}

export interface Collection {
  _id?: string;
  name: string;
  description?: string;
  userId: string;
  items: CollectionItem[];
  public: boolean;
  color?: string;
  lastVisitedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

