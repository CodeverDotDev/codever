import { Injectable } from '@angular/core';
import { Bookmark } from './model/bookmark';

import { shareReplay } from 'rxjs/operators';

import { Observable } from 'rxjs';

import { environment } from 'environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { UsedTag } from './model/used-tag';
import { HttpClientLocalStorageService, HttpOptions } from './cache/http-client-local-storage.service';
import { localStorageKeys } from './model/localstorage.cache-keys';

@Injectable()
export class PersonalBookmarksService {

  private personalBookmarksApiBaseUrl = '';  // URL to web api
  private headers = new HttpHeaders({'Content-Type': 'application/json'});

  constructor(private httpClient: HttpClient,
              private httpClientLocalStorageService: HttpClientLocalStorageService) {
    this.personalBookmarksApiBaseUrl = environment.API_URL + '/personal/users';
  }

  getUserTagsForBookmarks(userId: String): Observable<UsedTag[]> {
    const options: HttpOptions = {
      url: `${this.personalBookmarksApiBaseUrl}/${userId}/bookmarks/tags`,
      key: localStorageKeys.personalTagsBookmarks,
      cacheHours: 24,
      isSensitive: true
    }; // cache it for a day

    return this.httpClientLocalStorageService
      .get<UsedTag[]>(options)
      .pipe(shareReplay());
  }

  getFilteredPersonalBookmarks(searchText: string, limit: number, page: number, userId: string, include: string): Observable<Bookmark[]> {
    const params = new HttpParams()
      .set('q', searchText)
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('include', include);
    return this.httpClient.get<Bookmark[]>(`${this.personalBookmarksApiBaseUrl}/${userId}/bookmarks`,
      {params: params})
      .pipe(shareReplay(1));
  }

  getPersonalBookmarkByLocation(userId: string, url: string): Observable<Bookmark[]> {
    let params = new HttpParams();
    params = params.append('location', encodeURIComponent(url));

    return this.httpClient.get<Bookmark[]>(`${this.personalBookmarksApiBaseUrl}/${userId}/bookmarks`, {
      params: params
    }).pipe(shareReplay(1));
  }

  getPersonalBookmarkById(userId: string, bookmarkId: string): Observable<Bookmark> {
    return this.httpClient.get<Bookmark>(`${this.personalBookmarksApiBaseUrl}/${userId}/bookmarks/${bookmarkId}`).pipe(shareReplay(1));
  }

  getAllMyBookmarks(userId: string): Observable<Bookmark[]> {
    return this.httpClient.get<Bookmark[]>(`${this.personalBookmarksApiBaseUrl}/${userId}/bookmarks`).pipe(shareReplay(1));
  }

  getPersonalBookmarkOrderedBy(userId: string, orderBy: string): Observable<Bookmark[]> {
    let params = new HttpParams();
    params = params.append('orderBy', orderBy);

    return this.httpClient.get<Bookmark[]>(`${this.personalBookmarksApiBaseUrl}/${userId}/bookmarks`, {params: params});
  }


  updateBookmark(bookmark: Bookmark): Observable<any> {
    return this.httpClient
      .put(`${this.personalBookmarksApiBaseUrl}/${bookmark.userId}/bookmarks/${bookmark._id}`, JSON.stringify(bookmark),
        {headers: this.headers})
      .pipe(shareReplay(1));
  }

  deleteBookmark(bookmark: Bookmark): Observable<any> {
    return this.httpClient
      .delete(`${this.personalBookmarksApiBaseUrl}/${bookmark.userId}/bookmarks/${bookmark._id}`, {headers: this.headers})
      .pipe(shareReplay(1));
  }

  createBookmark(userId: string, bookmark: Bookmark): Observable<any> {
    return this.httpClient
      .post(`${this.personalBookmarksApiBaseUrl}/${userId}/bookmarks`, JSON.stringify(bookmark), {
        headers: this.headers,
        observe: 'response'
      })
      .pipe(shareReplay(1));
  }

  increaseOwnerVisitCount(bookmark: Bookmark) {
    return this.httpClient
      .post(`${this.personalBookmarksApiBaseUrl}/${bookmark.userId}/bookmarks/${bookmark._id}/owner-visits/inc`, {},
        {headers: this.headers})
      .pipe(shareReplay(1));
  }

  deletePrivateBookmarksForTag(userId: string, tag: string): Observable<any> {
    const params = new HttpParams()
      .set('tag', tag)
      .set('type', 'private');
    return this.httpClient
      .delete(`${this.personalBookmarksApiBaseUrl}/${userId}/bookmarks`, {headers: this.headers, params: params})
      .pipe(shareReplay(1));
  }

  updateDisplayNameInBookmarks(userId: string, displayName: string): Observable<any> {
    return this.httpClient
      .patch(`${this.personalBookmarksApiBaseUrl}/${userId}/bookmarks/display-name`, {displayName: displayName},
        {headers: this.headers})
      .pipe(shareReplay(1));
  }
}
