import { Injectable } from '@angular/core';
import { Bookmark } from './model/bookmark';

import { shareReplay } from 'rxjs/operators';

import { Observable } from 'rxjs';

import { environment } from 'environments/environment';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';

@Injectable()
export class PersonalBookmarkService {

  private personalBookmarksApiBaseUrl = '';  // URL to web api
  private headers = new HttpHeaders({'Content-Type': 'application/json'});

  constructor(private httpClient: HttpClient) {
    this.personalBookmarksApiBaseUrl = environment.API_URL + '/personal/users/';
  }

  getAllPersonalBookmarks(userId: String): Observable<Bookmark[]> {
    return this.httpClient.get<Bookmark[]>(this.personalBookmarksApiBaseUrl + userId + '/bookmarks').pipe(shareReplay(1));
  }

  getTagsOfUser(userId: String): Observable<string[]> {
    return this.httpClient.get<string[]>(this.personalBookmarksApiBaseUrl + userId + '/bookmarks/tags').pipe(shareReplay(1));
  }

  getFilteredPersonalBookmarks(searchText: string, limit: number, userId: string): Observable<Bookmark[]> {
    const params = new HttpParams()
      .set('q', searchText)
      .set('limit', limit.toString());
    return this.httpClient.get<Bookmark[]>(this.personalBookmarksApiBaseUrl + userId + '/bookmarks', {params: params});
  }

  getPersonalBookmarkByLocation(userId: string, url: string): Observable<HttpResponse<Bookmark>> {
    let params = new HttpParams();
    params = params.append('location', url);

    return this.httpClient.get<Bookmark>(this.personalBookmarksApiBaseUrl + userId + '/bookmarks', {observe: 'response', params: params}).pipe(shareReplay(1));
  }


  updateBookmark(bookmark: Bookmark): Observable<any> {
    return this.httpClient
      .put(this.personalBookmarksApiBaseUrl + bookmark.userId + '/bookmarks/' + bookmark._id, JSON.stringify(bookmark), {headers: this.headers})
      .pipe(shareReplay(1));
  }

  deleteBookmark(bookmark: Bookmark): Observable<any> {
    return this.httpClient
      .delete(this.personalBookmarksApiBaseUrl + bookmark.userId + '/bookmarks/' + bookmark._id, {headers: this.headers})
      .pipe(shareReplay(1));
  }

  createBookmark(userId: string, bookmark: Bookmark): Observable<any> {
    return this.httpClient
      .post(this.personalBookmarksApiBaseUrl + userId + '/bookmarks', JSON.stringify(bookmark), {
        headers: this.headers,
        observe: 'response'
      })
      .pipe(shareReplay(1));
  }

}
