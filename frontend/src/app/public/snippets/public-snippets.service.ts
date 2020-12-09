import { Injectable } from '@angular/core';

import { Observable, throwError } from 'rxjs';
import { Bookmark } from '../../core/model/bookmark';

import { environment } from 'environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, shareReplay } from 'rxjs/operators';
import { Codelet } from '../../core/model/codelet';
import { Router } from '@angular/router';

@Injectable()
export class PublicSnippetsService {

  private publicSnippetsApiBaseUrl = '';  // URL to web api

  constructor(private router: Router,
              private httpClient: HttpClient) {
    this.publicSnippetsApiBaseUrl = environment.API_URL + '/public/snippets';
  }

  getRecentPublicBookmarks(page: number, limit: number): Observable<Bookmark[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.httpClient.get<Bookmark[]>(this.publicSnippetsApiBaseUrl, {params: params});
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


  getPublicSnippetById(snippetId: string): Observable<Codelet> {
    return this.httpClient
      .get<Codelet>(`${this.publicSnippetsApiBaseUrl}/${snippetId}`).pipe(
        catchError(() => {
          this.router.navigate(['/404-snippet'],
            {
              queryParams: {snippetId: snippetId}
            });
          return throwError('Error 404');
        }));
  }

}
