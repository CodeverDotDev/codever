import {Injectable} from '@angular/core';
import {Bookmark} from './model/bookmark';

import {Headers, Response} from '@angular/http';

import 'rxjs/add/operator/toPromise';
import {Observable} from 'rxjs/Observable';
import {HttpWrapperService} from './keycloak/http-wrapper.service';

import { environment } from 'environments/environment';
import {HttpClientWrapperService} from './keycloak/http-client-wrapper.service';

@Injectable()
export class PersonalBookmarksService {

  private baseUrl = '';  // URL to web api
  private headers = new Headers({'Content-Type': 'application/json'});

  constructor(private httpWrapper: HttpClientWrapperService) {
    // this.baseUrl = process.env.API_URL + '/users/';
    this.baseUrl = environment.API_URL + '/users/';
  }

  getAllBookmarks(userId: String): Observable<Response> {
    return this.httpWrapper.get(this.baseUrl + userId + '/bookmarks');
  }

  updateBookmark(bookmark: Bookmark): Observable<any> {
    return this.httpWrapper
      .put(this.baseUrl + bookmark.userId + '/bookmarks/' + bookmark._id, JSON.stringify(bookmark), {headers: this.headers});
  }

  delete(bookmark: Bookmark): Observable<any> {
    return this.httpWrapper
      .delete(this.baseUrl + bookmark.userId + '/bookmarks/' + bookmark._id, {headers: this.headers});
  }

  saveBookmark(userId: string, bookmark: Bookmark): Observable<Response> {
    return this.httpWrapper
      .post(this.baseUrl + userId + '/bookmarks', JSON.stringify(bookmark))
      .shareReplay();
  }

}
