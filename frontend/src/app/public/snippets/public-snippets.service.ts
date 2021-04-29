import { Injectable } from '@angular/core';

import { Observable, throwError } from 'rxjs';
import { Bookmark } from '../../core/model/bookmark';

import { environment } from 'environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, shareReplay } from 'rxjs/operators';
import { Snippet } from '../../core/model/snippet';
import { Router } from '@angular/router';
import { UsedTag } from '../../core/model/used-tag';
import { HttpClientLocalStorageService } from '../../core/cache/http-client-local-storage.service';
import { localStorageKeys } from '../../core/model/localstorage.cache-keys';

@Injectable()
export class PublicSnippetsService {

  private publicSnippetsApiBaseUrl = '';  // URL to web api

  constructor(private router: Router,
              private httpClient: HttpClient, private cacheHttpClient: HttpClientLocalStorageService) {
    this.publicSnippetsApiBaseUrl = environment.API_URL + '/public/snippets';
  }

  getRecentPublicSnippets(page: number, limit: number): Observable<Snippet[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.httpClient.get<Snippet[]>(this.publicSnippetsApiBaseUrl, {params: params});
  }

  searchPublicSnippets(searchText: string, limit: number, page: number, sort: string, include: string): Observable<Bookmark[]> {
    const params = new HttpParams()
      .set('q', searchText)
      .set('page', page.toString())
      .set('sort', sort)
      .set('limit', limit.toString())
      .set('include', include);
    return this.httpClient.get<Bookmark[]>(this.publicSnippetsApiBaseUrl, {params: params})
      .pipe(shareReplay(1));
  }


  getPublicSnippetById(snippetId: string): Observable<Snippet> {
    return this.httpClient
      .get<Snippet>(`${this.publicSnippetsApiBaseUrl}/${snippetId}`).pipe(
        catchError(() => {
          this.router.navigate(['/404-snippet'],
            {
              queryParams: {snippetId: snippetId}
            });
          return throwError('Error 404');
        }));
  }

  getMostUsedPublicTagsForSnippets(limit: number): Observable<UsedTag[]> {
    const params = new HttpParams()
      .set('limit', limit.toString());
    const options = {
      url: `${this.publicSnippetsApiBaseUrl}/tags`,
      key: localStorageKeys.mostUsedPublicTagsSnippets,
      cacheHours: 24 * 7,
      params: params
    };

    return this.cacheHttpClient
      .get<UsedTag[]>(options);
  }

}
