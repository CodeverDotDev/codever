import {Injectable} from '@angular/core';
import {Bookmark} from './model/bookmark';

import {shareReplay} from 'rxjs/operators';

import {Observable} from 'rxjs';

import {environment} from 'environments/environment';
import {HttpClient, HttpHeaders} from '@angular/common/http';

@Injectable()
export class PersonalBookmarkService {

  private personalCodingmarksApiBaseUrl = '';  // URL to web api
  private headers = new HttpHeaders({'Content-Type': 'application/json'});

  constructor(private httpClient: HttpClient) {
    this.personalCodingmarksApiBaseUrl = environment.API_URL + '/personal/users/';
  }

  getAllPersonalCodingmarks(userId: String): Observable<Bookmark[]> {
    return this.httpClient.get<Bookmark[]>(this.personalCodingmarksApiBaseUrl + userId + '/bookmarks').pipe(shareReplay(1));
  }

  updateCodingmark(bookmark: Bookmark): Observable<any> {
    return this.httpClient
      .put(this.personalCodingmarksApiBaseUrl + bookmark.userId + '/bookmarks/' + bookmark._id, JSON.stringify(bookmark), {headers: this.headers})
      .pipe(shareReplay(1));
  }

  deleteCodingmark(bookmark: Bookmark): Observable<any> {
    return this.httpClient
      .delete(this.personalCodingmarksApiBaseUrl + bookmark.userId + '/bookmarks/' + bookmark._id, {headers: this.headers})
      .pipe(shareReplay(1));
  }

  createCodingmark(userId: string, bookmark: Bookmark): Observable<any> {
    return this.httpClient
      .post(this.personalCodingmarksApiBaseUrl + userId + '/bookmarks', JSON.stringify(bookmark), {headers: this.headers, observe: 'response'})
      .pipe(shareReplay(1));
  }

}
