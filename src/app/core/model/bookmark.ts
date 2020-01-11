export interface Bookmark {
  _id?: string;
  name: string;
  location: string;
  description?: string;
  descriptionHtml?: string;
  tags: string[];
  tagsLine?: string;
  publishedOn?: Date;
  githubURL?: string;
  userId?: String;
  shared?: boolean;
  language: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastAccessedAt?: Date;
  starredBy?: string[];
  ownerVisitCount?: number;
  likes?: number;
  youtubeVideoId?: string;
  stackoverflowQuestionId?: string;
}
