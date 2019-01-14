import {Injectable} from '@angular/core';

import {Observable} from 'rxjs';
import {Webpage} from '../../core/model/webpage';
import {Codingmark} from '../../core/model/codingmark';

import {environment} from 'environments/environment';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {shareReplay} from 'rxjs/operators';
import {RateCodingmarkRequest} from '../../core/model/rate-codingmark.request';

@Injectable()
export class PublicCodingmarksService {

  private publicCodingmarksApiBaseUrl = '';  // URL to web api
  private securedPublicCodingmarksApiBaseUrl = '';  // URL to web api
  private headers = new HttpHeaders({'Content-Type': 'application/json'});

  constructor(private httpClient: HttpClient) {
    this.publicCodingmarksApiBaseUrl = environment.API_URL + '/public/codingmarks';
    this.securedPublicCodingmarksApiBaseUrl = environment.API_URL + '/secured/public/codingmarks';
  }

  getAllPublicCodingmarks(): Observable<Codingmark[]> {
    return this.httpClient.get<Codingmark[]>(this.publicCodingmarksApiBaseUrl);
  }

  getScrapingData(url: String): Observable<Webpage> {
    return this.httpClient
      .get<Webpage>(`${this.publicCodingmarksApiBaseUrl}/scrape?url=${url}`);
  }

  getPublicCodingmarkByLocation(url: string): Observable<Codingmark> {
    let params = new HttpParams();
    params = params.append('location', url);
    return this.httpClient
      .get<Codingmark>(`${this.publicCodingmarksApiBaseUrl}`, {params: params});
  }

  rateCodingmark(rateCodingmarkRequest: RateCodingmarkRequest): Observable<any> {
    return this.httpClient
      .patch(`${this.securedPublicCodingmarksApiBaseUrl}/${rateCodingmarkRequest.codingmark._id}`, JSON.stringify(rateCodingmarkRequest),
            {headers: this.headers})
      .pipe(shareReplay());
  }

}
