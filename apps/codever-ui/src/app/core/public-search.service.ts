import { Injectable } from '@angular/core';
import { Bookmark } from './model/bookmark';
import { shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Note } from './model/note';

@Injectable()
export class PublicSearchService {
  private publicSearchApiBaseUrl = '';

  constructor(private httpClient: HttpClient) {
    this.publicSearchApiBaseUrl =
      environment.API_URL + '/public/search-results';
  }

  getSearchResults(
    searchText: string,
    limit: number,
    page: number,
    include: string
  ): Observable<(Bookmark | Note)[]> {
    const params = new HttpParams()
      .set('q', searchText)
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('include', include);
    return this.httpClient
      .get<(Bookmark | Note)[]>(this.publicSearchApiBaseUrl, { params })
      .pipe(shareReplay(1));
  }
}

