export type ShareableResourceType = 'bookmark' | 'note';

export interface ShareLinkStatus {
  active: false;
}

export interface ActiveShareLinkStatus {
  active: true;
  shareLinkId: string;
  resourceType: ShareableResourceType;
  resourceId: string;
  createdAt: string;
  token: string;
}

export type ShareLinkResourceStatus =
  | ShareLinkStatus
  | ActiveShareLinkStatus;

export interface ShareLinkListItem {
  shareLinkId: string;
  resourceType: ShareableResourceType;
  resourceId: string;
  title: string;
  public: boolean;
  createdAt: string;
}

export interface ShareLinkListResponse {
  items: ShareLinkListItem[];
  page: number;
  limit: number;
  total: number;
}

export type SharedBookmark = Pick<
  import('./bookmark').Bookmark,
  | '_id'
  | 'type'
  | 'name'
  | 'location'
  | 'description'
  | 'descriptionHtml'
  | 'tags'
  | 'copyableFields'
  | 'publishedOn'
  | 'sourceCodeURL'
  | 'language'
  | 'youtubeVideoId'
  | 'stackoverflowQuestionId'
  | 'createdAt'
  | 'updatedAt'
>;

export type SharedNote = Pick<
  import('./note').Note,
  | '_id'
  | 'type'
  | 'title'
  | 'content'
  | 'contentType'
  | 'reference'
  | 'tags'
  | 'copyableFields'
  | 'createdAt'
  | 'updatedAt'
  | 'notebookContent'
>;
