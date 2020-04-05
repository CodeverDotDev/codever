import { Injectable } from '@angular/core';
import { Bookmark } from './model/bookmark';

import { shareReplay } from 'rxjs/operators';

import { Observable } from 'rxjs';

import { environment } from 'environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Codelet } from './model/codelet';

@Injectable()
export class PersonalCodeletsService {

  private personalCodeletsApiBaseUrl = '';  // URL to web api
  private headers = new HttpHeaders({'Content-Type': 'application/json'});

  constructor(private httpClient: HttpClient) {
    this.personalCodeletsApiBaseUrl = environment.API_URL + '/personal/users';
  }

  getPersonalCodeletById(userId: string, codeletId: string): Observable<Codelet> {
    return this.httpClient.get<Codelet>(`${this.personalCodeletsApiBaseUrl}/${userId}/codelets/${codeletId}`).pipe(shareReplay(1));
  }

  getSuggestedCodeletTags(userId: String): Observable<string[]> {
    return this.httpClient.get<string[]>(`${this.personalCodeletsApiBaseUrl}/${userId}/codelets/suggested-tags`)
      .pipe(shareReplay(1));
  }

  updateCodelet(codelet: Codelet): Observable<any> {
    return this.httpClient
      .put(`${this.personalCodeletsApiBaseUrl}/${codelet.userId}/codelets/${codelet._id}`, JSON.stringify(codelet),
        {headers: this.headers})
      .pipe(shareReplay(1));
  }


  createCodelet(userId: string, codelet: Codelet): Observable<any> {
    return this.httpClient
      .post(`${this.personalCodeletsApiBaseUrl}/${userId}/codelets`, JSON.stringify(codelet), {
        headers: this.headers,
        observe: 'response'
      })
      .pipe(shareReplay(1));
  }

  increaseOwnerVisitCount(bookmark: Bookmark) {
    return this.httpClient
      .post(`${this.personalCodeletsApiBaseUrl}/${bookmark.userId}/bookmarks/${bookmark._id}/owner-visits/inc`, {},
        {headers: this.headers})
      .pipe(shareReplay(1));
  }

  deleteCodeletById(userId: string, codeletId: string): Observable<any> {
    return this.httpClient
      .delete(`${this.personalCodeletsApiBaseUrl}/${userId}/codelets/${codeletId}`, {headers: this.headers})
      .pipe(shareReplay(1));
  }

  /*
   TODO finish this...
   */
  getFilteredPersonalCodelets(searchText: string, limit: number, page: number, userId: string) {
    const params = new HttpParams()
      .set('q', searchText)
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.httpClient.get<Codelet[]>(`${this.personalCodeletsApiBaseUrl}/${userId}/codelets`,
      {params: params})
      .pipe(shareReplay(1));
  }
}
