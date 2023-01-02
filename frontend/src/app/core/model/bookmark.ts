export interface Bookmark {
  _id?: string;
  shareableId?: string;
  name: string;
  type: string; // should always by 'bookmark'
  location: string;
  description?: string;
  descriptionHtml?: string;
  tags: string[];
  tagsLine?: string;
  publishedOn?: Date;
  sourceCodeURL?: string;
  userId?: String;
  userDisplayName: String;
  public?: boolean;
  language: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastAccessedAt?: Date;
  ownerVisitCount?: number;
  likeCount?: number;
  youtubeVideoId?: string;
  stackoverflowQuestionId?: string;
}
