import { CopyableField } from './copyable-field';

export interface Bookmark {
  _id?: string;
  shareableId?: string;
  name: string;
  location: string;
  type: string; // should always be 'bookmark'
  tags: string[];
  initiator?: string;
  description?: string;
  descriptionHtml?: string;
  copyableFields?: CopyableField[];
  tagsLine?: string;
  publishedOn?: Date;
  sourceCodeURL?: string;
  userId?: string;
  userDisplayName: string;
  public?: boolean;
  language?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastAccessedAt?: Date;
  ownerVisitCount?: number;
  likeCount?: number;
  youtubeVideoId?: string;
  stackoverflowQuestionId?: string;
}
