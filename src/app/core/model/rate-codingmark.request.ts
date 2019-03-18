import {Bookmark} from './bookmark';

export interface RateCodingmarkRequest {
  ratingUserId: string;
  action: RatingActionType;
  codingmark: Bookmark
}

export enum RatingActionType {
  STAR = 'STAR',
  UNSTAR = 'UNSTAR'
}
