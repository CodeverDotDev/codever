import {Injectable} from '@angular/core';
import {Bookmark} from './model/bookmark';

import {Headers, Response} from '@angular/http';

import {shareReplay} from 'rxjs/operators';


import {Observable} from 'rxjs';

import { environment } from 'environments/environment';
import {HttpClient, HttpHeaders, HttpResponse} from '@angular/common/http';

@Injectable()
export class PersonalBookmarksService {

  private baseUrl = '';  // URL to web api
  private headers = new HttpHeaders({'Content-Type': 'application/json'});

  constructor(private httpClient: HttpClient) {
    // this.baseUrl = process.env.API_URL + '/users/';
    this.baseUrl = environment.API_URL + '/private/users/';
  }

  getAllBookmarks(userId: String): Observable<Bookmark[]> {
    return this.httpClient.get<Bookmark[]>(this.baseUrl + userId + '/bookmarks').pipe(shareReplay());
  }

  updateBookmark(bookmark: Bookmark): Observable<any> {
    return this.httpClient
      .put(this.baseUrl + bookmark.userId + '/bookmarks/' + bookmark._id, JSON.stringify(bookmark), {headers: this.headers})
      .pipe(shareReplay());
  }

  delete(bookmark: Bookmark): Observable<any> {
    return this.httpClient
      .delete(this.baseUrl + bookmark.userId + '/bookmarks/' + bookmark._id, {headers: this.headers})
      .pipe(shareReplay());
  }

  saveBookmark(userId: string, bookmark: Bookmark): Observable<any> {
    return this.httpClient
      .post(this.baseUrl + userId + '/bookmarks', JSON.stringify(bookmark), {headers: this.headers, observe: 'response'})
      .pipe(shareReplay());
  }

}
