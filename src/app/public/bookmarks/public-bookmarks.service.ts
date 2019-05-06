import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { Webpage } from '../../core/model/webpage';
import { Bookmark } from '../../core/model/bookmark';

import { environment } from 'environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable()
export class PublicBookmarksService {

  private publicBookmarksApiBaseUrl = '';  // URL to web api
  private securedPublicBookmarksApiBaseUrl = '';  // URL to web api

  constructor(private httpClient: HttpClient) {
    this.publicBookmarksApiBaseUrl = environment.API_URL + '/public/bookmarks';
    this.securedPublicBookmarksApiBaseUrl = environment.API_URL + '/secured/public/bookmarks';
  }

  getAllPublicBookmarks(): Observable<Bookmark[]> {
    return this.httpClient.get<Bookmark[]>(this.publicBookmarksApiBaseUrl);
  }

  getFilteredPublicBookmarks(searchText: string, limit: number): Observable<Bookmark[]> {
    const params = new HttpParams()
      .set('q', searchText)
      .set('limit', limit.toString());
    return this.httpClient.get<Bookmark[]>(this.publicBookmarksApiBaseUrl, {params: params});
  }

  getScrapingData(url: String): Observable<Webpage> {
    return this.httpClient
      .get<Webpage>(`${this.publicBookmarksApiBaseUrl}/scrape?url=${url}`);
  }

  getPublicBookmarkByLocation(url: string): Observable<Bookmark> {
    let params = new HttpParams();
    params = params.append('location', url);
    return this.httpClient
      .get<Bookmark>(`${this.publicBookmarksApiBaseUrl}`, {params: params});
  }

}
