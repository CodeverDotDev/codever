import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { Bookmark } from '../../core/model/bookmark';

import { environment } from 'environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { shareReplay } from 'rxjs/operators';

@Injectable()
export class BookmarksTaggedService {
  private bookmarksUrl = ''; // URL to web api

  constructor(private httpClient: HttpClient) {
    this.bookmarksUrl = environment.API_URL + '/public/bookmarks/';
  }

  getBookmarksForTag(
    tag: string,
    orderBy: string,
    page: number,
    limit: number
  ): Observable<Bookmark[]> {
    const params = new HttpParams()
      .set('orderBy', orderBy)
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.httpClient
      .get<Bookmark[]>(`${this.bookmarksUrl}tagged/${tag}`, { params: params })
      .pipe(shareReplay(1));
  }
}
