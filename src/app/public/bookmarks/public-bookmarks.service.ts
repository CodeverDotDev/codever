import {Injectable} from '@angular/core';

import {Observable} from 'rxjs';
import {Bookmark} from '../../core/model/bookmark';

import {environment} from 'environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {shareReplay} from 'rxjs/operators';

@Injectable()
export class PublicBookmarksService {

  private publicBookmarksApiBaseUrl = '';  // URL to web api

  constructor(private httpClient: HttpClient) {
    this.publicBookmarksApiBaseUrl = environment.API_URL + '/public/bookmarks';
  }

  getRecentPublicBookmarks(): Observable<Bookmark[]> {
    return this.httpClient.get<Bookmark[]>(this.publicBookmarksApiBaseUrl);
  }

  getFilteredPublicBookmarks(searchText: string, limit: number): Observable<Bookmark[]> {
    const params = new HttpParams()
      .set('q', searchText)
      .set('limit', limit.toString());
    return this.httpClient.get<Bookmark[]>(this.publicBookmarksApiBaseUrl, {params: params})
      .pipe(shareReplay(1));
  }

  getPublicBookmarkByLocation(url: string): Observable<Bookmark[]> {
    let params = new HttpParams();
    params = params.append('location', url);
    return this.httpClient
      .get<Bookmark[]>(`${this.publicBookmarksApiBaseUrl}`, {params: params});
  }

}
