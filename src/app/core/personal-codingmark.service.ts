import {Injectable} from '@angular/core';
import {Bookmark} from './model/bookmark';

import {Headers, Response} from '@angular/http';

import {shareReplay} from 'rxjs/operators';


import {Observable} from 'rxjs';

import { environment } from 'environments/environment';
import {HttpClient, HttpHeaders, HttpResponse} from '@angular/common/http';

@Injectable()
export class PersonalCodingmarkService {

  private baseUrl = '';  // URL to web api
  private headers = new HttpHeaders({'Content-Type': 'application/json'});

  constructor(private httpClient: HttpClient) {
    this.baseUrl = environment.API_URL + '/private/users/';
  }

  getAllPersonalCodingmarks(userId: String): Observable<Bookmark[]> {
    return this.httpClient.get<Bookmark[]>(this.baseUrl + userId + '/codingmarks').pipe(shareReplay());
  }

  updateCodingmark(bookmark: Bookmark): Observable<any> {
    return this.httpClient
      .put(this.baseUrl + bookmark.userId + '/codingmarks/' + bookmark._id, JSON.stringify(bookmark), {headers: this.headers})
      .pipe(shareReplay());
  }

  deleteCodingmark(bookmark: Bookmark): Observable<any> {
    return this.httpClient
      .delete(this.baseUrl + bookmark.userId + '/codingmarks/' + bookmark._id, {headers: this.headers})
      .pipe(shareReplay());
  }

  createCodingmark(userId: string, bookmark: Bookmark): Observable<any> {
    return this.httpClient
      .post(this.baseUrl + userId + '/codingmarks', JSON.stringify(bookmark), {headers: this.headers, observe: 'response'})
      .pipe(shareReplay());
  }

}
