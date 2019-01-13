import {Injectable} from '@angular/core';
import {Codingmark} from './model/codingmark';

import {shareReplay} from 'rxjs/operators';


import {Observable} from 'rxjs';

import {environment} from 'environments/environment';
import {HttpClient, HttpHeaders} from '@angular/common/http';

@Injectable()
export class PersonalCodingmarkService {

  private baseUrl = '';  // URL to web api
  private headers = new HttpHeaders({'Content-Type': 'application/json'});

  constructor(private httpClient: HttpClient) {
    this.baseUrl = environment.API_URL + '/private/users/';
  }

  getAllPersonalCodingmarks(userId: String): Observable<Codingmark[]> {
    return this.httpClient.get<Codingmark[]>(this.baseUrl + userId + '/codingmarks').pipe(shareReplay());
  }

  updateCodingmark(codingmark: Codingmark): Observable<any> {
    return this.httpClient
      .put(this.baseUrl + codingmark.userId + '/codingmarks/' + codingmark._id, JSON.stringify(codingmark), {headers: this.headers})
      .pipe(shareReplay());
  }

  deleteCodingmark(codingmark: Codingmark): Observable<any> {
    return this.httpClient
      .delete(this.baseUrl + codingmark.userId + '/codingmarks/' + codingmark._id, {headers: this.headers})
      .pipe(shareReplay());
  }

  createCodingmark(userId: string, codingmark: Codingmark): Observable<any> {
    return this.httpClient
      .post(this.baseUrl + userId + '/codingmarks', JSON.stringify(codingmark), {headers: this.headers, observe: 'response'})
      .pipe(shareReplay());
  }

}
