import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from 'environments/environment';
import { HttpClient } from '@angular/common/http';
import { shareReplay } from 'rxjs/operators';
import { UserPublicData } from '../../core/model/user-public-data';

@Injectable()
export class UserPublicService {
  private userPublicApiBaseUrl = ''; // URL to web api

  constructor(private httpClient: HttpClient) {
    this.userPublicApiBaseUrl = environment.API_URL + '/public/users';
  }

  getUserPublicData$(
    userId: string,
    limit: number
  ): Observable<UserPublicData> {
    return this.httpClient
      .get<UserPublicData>(`${this.userPublicApiBaseUrl}/${userId}/profile`)
      .pipe(shareReplay(1));
  }

  /*  getPersonalBookmarkOrderedBy(userId: string, orderBy: string): Observable<Bookmark[]> {
    let params = new HttpParams();
    params = params.append('orderBy', orderBy);

    return this.httpClient.get<Bookmark[]>(`${this.personalBookmarksApiBaseUrl}/${userId}/bookmarks`, {params: params});
  }*/
}
