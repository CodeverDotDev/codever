import {Bookmark} from './bookmark';

export interface RateBookmarkRequest {
  ratingUserId: string;
  action: RatingActionType;
  bookmark: Bookmark
}

export enum RatingActionType {
  STAR = 'STAR',
  UNSTAR = 'UNSTAR'
}
