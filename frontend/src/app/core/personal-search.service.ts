import { Injectable } from '@angular/core';
import { Bookmark } from './model/bookmark';

import { shareReplay } from 'rxjs/operators';

import { Observable } from 'rxjs';

import { environment } from 'environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { UsedTag } from './model/used-tag';
import { HttpClientLocalStorageService, HttpOptions } from './cache/http-client-local-storage.service';
import { localStorageKeys } from './model/localstorage.cache-keys';
import { Snippet } from './model/snippet';
import { Note } from './model/note';

@Injectable()
export class PersonalSearchService {

  private personalBookmarksApiBaseUrl = '';  // URL to web api
  private headers = new HttpHeaders({'Content-Type': 'application/json'});

  constructor(private httpClient: HttpClient,
              private httpClientLocalStorageService: HttpClientLocalStorageService) {
    this.personalBookmarksApiBaseUrl = environment.API_URL + '/personal/users';
  }


  getSearchResults(userId: string, searchText: string, limit: number, page: number, include: string): Observable<(Bookmark | Snippet | Note)[]> {
    const params = new HttpParams()
      .set('q', searchText)
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('include', include);
    return this.httpClient.get<(Bookmark | Snippet)[]>(`${this.personalBookmarksApiBaseUrl}/${userId}/search-results`,
      {params: params})
      .pipe(shareReplay(1));
  }

}
