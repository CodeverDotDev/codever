import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from 'environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { UserData } from './model/user-data';
import { Bookmark } from './model/bookmark';
import { shareReplay } from 'rxjs/operators';
import { RateBookmarkRequest } from './model/rate-bookmark.request';
import { UsedTags } from './model/used-tag';

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
      .get<UserData>(`${this.usersApiBaseUrl}/${userId}`)
      .pipe(shareReplay(1));
  }

  getReadLater(userId: string, page: number, limit: number): Observable<Bookmark[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('page', page.toString());
    return this.httpClient
      .get<Bookmark[]>(`${this.usersApiBaseUrl}/${userId}/read-later`, {params: params})
      .pipe(shareReplay(1));
  }

  getLikedBookmarks(userId: string): Observable<Bookmark[]> {
    return this.httpClient
      .get<Bookmark[]>(`${this.usersApiBaseUrl}/${userId}/likes`)
      .pipe(shareReplay(1));
  }

  getPinnedBookmarks(userId: string, page: number, limit: number): Observable<Bookmark[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('page', page.toString());
    return this.httpClient
      .get<Bookmark[]>(`${this.usersApiBaseUrl}/${userId}/pinned`, {params: params})
      .pipe(shareReplay(1));
  }

  getFavoriteBookmarks(userId: string, page: number, limit: number): Observable<Bookmark[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('page', page.toString());
    return this.httpClient
      .get<Bookmark[]>(`${this.usersApiBaseUrl}/${userId}/favorites`, {params: params})
      .pipe(shareReplay(1));
  }

  getLastVisitedBookmarks(userId: string, page: number, limit: number): Observable<Bookmark[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('page', page.toString());
    return this.httpClient
      .get<Bookmark[]>(`${this.usersApiBaseUrl}/${userId}/history`, {params: params})
      .pipe(shareReplay(1));
  }

  getBookmarksForWatchedTags(userId: string, page: number, limit: number): Observable<Bookmark[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('page', page.toString());
    return this.httpClient
      .get<Bookmark[]>(`${this.usersApiBaseUrl}/${userId}/watched-tags`, {params: params})
      .pipe(shareReplay(1));
  }

  getUsedTags(userId: string): Observable<UsedTags> {
    return this.httpClient
      .get<UsedTags>(`${this.usersApiBaseUrl}/${userId}/used-tags`)
      .pipe(shareReplay(1));
  }


  rateBookmark(rateBookmarkRequest: RateBookmarkRequest): Observable<any> {
    return this.httpClient
      .patch(`${this.usersApiBaseUrl}/${rateBookmarkRequest.ratingUserId}/bookmarks/likes/${rateBookmarkRequest.bookmark._id}`,
        JSON.stringify(rateBookmarkRequest),
        {headers: this.headers})
      .pipe(shareReplay(1));
  }
}
