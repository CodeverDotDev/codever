import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from 'environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserData } from './model/user-data';
import { Bookmark } from './model/bookmark';
import { shareReplay } from 'rxjs/operators';
import { RateBookmarkRequest } from './model/rate-bookmark.request';

@Injectable()
export class UserDataService {

  private usersApiBaseUrl = '';  // URL to web api
  private headers = new HttpHeaders({'Content-Type': 'application/json'});

  constructor(private httpClient: HttpClient) {
    this.usersApiBaseUrl = environment.API_URL + '/personal/users';
  }

  createInitialUserData(userData: UserData): Observable<UserData> {
    return this.httpClient
      .post(`${this.usersApiBaseUrl}/${userData.userId}`, JSON.stringify(userData), {headers: this.headers})
      .pipe(shareReplay(1));
  }

  updateUserData(userData: UserData): Observable<UserData> {
    return this.httpClient
      .put(`${this.usersApiBaseUrl}/${userData.userId}`, JSON.stringify(userData), {headers: this.headers})
      .pipe(shareReplay(1));
  }

  getUserData(userId: string): Observable<UserData> {
    return this.httpClient
      .get<UserData>(`${this.usersApiBaseUrl}/${userId}`);
  }

  getLaterReads(userId: string): Observable<Bookmark[]> {
    return this.httpClient
      .get<Bookmark[]>(`${this.usersApiBaseUrl}/${userId}/later-reads`);
  }

  getStarredBookmarks(userId: string): Observable<Bookmark[]> {
    return this.httpClient
      .get<Bookmark[]>(`${this.usersApiBaseUrl}/${userId}/stars`);
  }

  getPinnedBookmarks(userId: string): Observable<Bookmark[]> {
    return this.httpClient
      .get<Bookmark[]>(`${this.usersApiBaseUrl}/${userId}/pinned`);
  }

  getLastVisitedBookmarks(userId: string): Observable<Bookmark[]> {
    return this.httpClient
      .get<Bookmark[]>(`${this.usersApiBaseUrl}/${userId}/history`);
  }

  getBookmarksForWatchedTags(userId: string): Observable<Bookmark[]> {
    return this.httpClient
      .get<Bookmark[]>(`${this.usersApiBaseUrl}/${userId}/watched-tags`);
  }


  rateBookmark(rateBookmarkRequest: RateBookmarkRequest): Observable<any> {
    return this.httpClient
      .patch(`${this.usersApiBaseUrl}/${rateBookmarkRequest.ratingUserId}/bookmarks/stars/${rateBookmarkRequest.bookmark._id}`,
        JSON.stringify(rateBookmarkRequest),
        {headers: this.headers})
      .pipe(shareReplay());
  }

}
