import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from 'environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { shareReplay } from 'rxjs/operators';
import { Snippet } from '../../../core/model/snippet';

@Injectable()
export class SnippetTagService {
  private snippetsUrl = ''; // URL to web api

  constructor(private httpClient: HttpClient) {
    this.snippetsUrl = environment.API_URL + '/public/snippets';
  }

  getPublicSnippetsForTag(
    tag: string,
    orderBy: string,
    page: number,
    limit: number
  ): Observable<Snippet[]> {
    const params = new HttpParams()
      .set('orderBy', orderBy)
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.httpClient
      .get<Snippet[]>(`${this.snippetsUrl}/tagged/${tag}`, { params: params })
      .pipe(shareReplay(1));
  }
}
