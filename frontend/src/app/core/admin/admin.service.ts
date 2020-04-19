import {Injectable} from '@angular/core';

import {shareReplay} from 'rxjs/operators';

import {Observable} from 'rxjs';

import {environment} from 'environments/environment';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Bookmark} from '../model/bookmark';

@Injectable()
export class AdminService {

  private adminApiBaseUrl = '';
  private headers = new HttpHeaders({'Content-Type': 'application/json'});

  constructor(private httpClient: HttpClient) {
    this.adminApiBaseUrl = environment.API_URL + '/admin';
  }


  updateBookmark(bookmark: Bookmark): Observable<any> {
    return this.httpClient
      .put(`${this.adminApiBaseUrl}/bookmarks/${bookmark._id}`, JSON.stringify(bookmark),
        {headers: this.headers})
      .pipe(shareReplay(1));
  }

  deleteBookmark(bookmark: Bookmark): Observable<any> {
    return this.httpClient
      .delete(`${this.adminApiBaseUrl}/bookmarks/${bookmark._id}`, {headers: this.headers})
      .pipe(shareReplay(1));
  }

}
