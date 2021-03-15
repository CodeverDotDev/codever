import { Injectable } from '@angular/core';
import { Bookmark } from './model/bookmark';

import { shareReplay } from 'rxjs/operators';

import { Observable } from 'rxjs';

import { environment } from 'environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Snippet } from './model/snippet';

@Injectable()
export class PersonalSnippetsService {

  private personalSnippetsApiBaseUrl = '';  // URL to web api
  private headers = new HttpHeaders({'Content-Type': 'application/json'});

  constructor(private httpClient: HttpClient) {
    this.personalSnippetsApiBaseUrl = environment.API_URL + '/personal/users';
  }

  getPersonalSnippetById(userId: string, codeletId: string): Observable<Snippet> {
    return this.httpClient.get<Snippet>(`${this.personalSnippetsApiBaseUrl}/${userId}/snippets/${codeletId}`).pipe(shareReplay(1));
  }

  getSuggestedSnippetTags(userId: String): Observable<string[]> {
    return this.httpClient.get<string[]>(`${this.personalSnippetsApiBaseUrl}/${userId}/snippets/suggested-tags`)
      .pipe(shareReplay(1));
  }

  updateSnippet(snippet: Snippet): Observable<any> {
    return this.httpClient
      .put(`${this.personalSnippetsApiBaseUrl}/${snippet.userId}/snippets/${snippet._id}`, JSON.stringify(snippet),
        {headers: this.headers})
      .pipe(shareReplay(1));
  }


  createSnippet(userId: string, snippet: Snippet): Observable<any> {
    return this.httpClient
      .post(`${this.personalSnippetsApiBaseUrl}/${userId}/snippets`, JSON.stringify(snippet), {
        headers: this.headers,
        observe: 'response'
      })
      .pipe(shareReplay(1));
  }

  increaseOwnerVisitCount(bookmark: Bookmark) {
    return this.httpClient
      .post(`${this.personalSnippetsApiBaseUrl}/${bookmark.userId}/bookmarks/${bookmark._id}/owner-visits/inc`, {},
        {headers: this.headers})
      .pipe(shareReplay(1));
  }

  deleteSnippetById(userId: string, codeletId: string): Observable<any> {
    return this.httpClient
      .delete(`${this.personalSnippetsApiBaseUrl}/${userId}/snippets/${codeletId}`, {headers: this.headers})
      .pipe(shareReplay(1));
  }


  getFilteredPersonalSnippets(searchText: string, limit: number, page: number, userId: string, include: string) {
    const params = new HttpParams()
      .set('q', searchText)
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('include', include);

    return this.httpClient.get<Snippet[]>(`${this.personalSnippetsApiBaseUrl}/${userId}/snippets`,
      {params: params})
      .pipe(shareReplay(1));
  }

  getLatestSnippets(userId: string) {
    return this.httpClient.get<Snippet[]>(`${this.personalSnippetsApiBaseUrl}/${userId}/snippets`)
      .pipe(shareReplay(1));
  }
}
