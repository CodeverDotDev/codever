import {Codingmark} from './codingmark';

export interface RateCodingmarkRequest {
  ratingUserId: string;
  action: RatingActionType;
  codingmark: Codingmark
}

export enum RatingActionType {
  STAR = 'STAR',
  UNSTAR = 'UNSTAR'
}
