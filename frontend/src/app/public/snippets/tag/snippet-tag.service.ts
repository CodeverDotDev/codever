import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from 'environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { shareReplay } from 'rxjs/operators';
import { Codelet } from '../../../core/model/codelet';

@Injectable()
export class SnippetTagService {

  private snippetsUrl = '';  // URL to web api

  constructor(private httpClient: HttpClient) {
    this.snippetsUrl = environment.API_URL + '/public/snippets';
  }

  getPublicSnippetsForTag(tag: string, orderBy: string, page: number, limit: number): Observable<Codelet[]> {
    const params = new HttpParams()
      .set('orderBy', orderBy)
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.httpClient.get<Codelet[]>(`${this.snippetsUrl}/tagged/${tag}`, {params: params})
      .pipe(shareReplay(1));
  };

}
