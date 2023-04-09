import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { Bookmark } from '../../core/model/bookmark';

import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { shareReplay } from 'rxjs/operators';
import { UsedTag } from '../../core/model/used-tag';
import { HttpClientLocalStorageService } from '../../core/cache/http-client-local-storage.service';

import { localStorageKeys } from '../../core/model/localstorage.cache-keys';

@Injectable()
export class PublicBookmarksService {
  private publicBookmarksApiBaseUrl = ''; // URL to web api

  constructor(
    private httpClient: HttpClient,
    private cacheHttpClient: HttpClientLocalStorageService
  ) {
    this.publicBookmarksApiBaseUrl = environment.API_URL + '/public/bookmarks';
  }

  getRecentPublicBookmarks(
    page: number,
    limit: number
  ): Observable<Bookmark[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.httpClient.get<Bookmark[]>(this.publicBookmarksApiBaseUrl, {
      params: params,
    });
  }

  searchPublicBookmarks(
    searchText: string,
    limit: number,
    page: number,
    sort: string,
    include: string
  ): Observable<Bookmark[]> {
    const params = new HttpParams()
      .set('q', searchText)
      .set('page', page.toString())
      .set('sort', sort)
      .set('limit', limit.toString())
      .set('include', include);
    return this.httpClient
      .get<Bookmark[]>(this.publicBookmarksApiBaseUrl, { params: params })
      .pipe(shareReplay(1));
  }

  getPublicBookmarkByLocation(url: string): Observable<Bookmark[]> {
    let params = new HttpParams();
    params = params.append('location', url);
    return this.httpClient.get<Bookmark[]>(
      `${this.publicBookmarksApiBaseUrl}`,
      {
        params: params,
      }
    );
  }

  getPublicBookmarkById(bookmarkId: string): Observable<Bookmark> {
    return this.httpClient.get<Bookmark>(
      `${this.publicBookmarksApiBaseUrl}/${bookmarkId}`
    );
  }

  getSharedBookmarkBySharableId(shareableId: string): Observable<Bookmark> {
    return this.httpClient.get<Bookmark>(
      `${this.publicBookmarksApiBaseUrl}/shared/${shareableId}`
    );
  }

  getMostUsedPublicTags(limit: number): Observable<UsedTag[]> {
    const params = new HttpParams().set('limit', limit.toString());
    const options = {
      url: `${this.publicBookmarksApiBaseUrl}/tags`,
      key: localStorageKeys.mostUsedPublicTagsBookmarks,
      cacheHours: 24 * 7,
      params: params,
    };

    return this.cacheHttpClient.get<UsedTag[]>(options);
  }
}
