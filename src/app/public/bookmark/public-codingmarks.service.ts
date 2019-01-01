import {Injectable} from '@angular/core';

import {Observable} from 'rxjs';
import {Webpage} from '../../core/model/webpage';
import {Bookmark} from '../../core/model/bookmark';

import {environment} from 'environments/environment';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {shareReplay} from 'rxjs/operators';

@Injectable()
export class PublicCodingmarksService {

  private bookmarksUrl = '';  // URL to web api
  private headers = new HttpHeaders({'Content-Type': 'application/json'});

  constructor(private httpClient: HttpClient) {
    this.bookmarksUrl = environment.API_URL + '/public/codingmarks';
  }

  getAllPublicCodingmarks(): Observable<Bookmark[]> {
    return this.httpClient.get<Bookmark[]>(this.bookmarksUrl);
  }

  getScrapingData(url: String): Observable<Webpage> {
    return this.httpClient
      .get<Webpage>(`${this.bookmarksUrl}/scrape?url=${url}`);
  }

  getPublicCodingmarkByLocation(url: string): Observable<Bookmark> {
    let params = new HttpParams();
    params = params.append('location', url);
    return this.httpClient
      .get<Bookmark>(`${this.bookmarksUrl}`, {params: params});
  }

  updateCodingmark(bookmark: Bookmark): Observable<any> {
    return this.httpClient
      .put(environment.API_URL + '/private/users/' + bookmark.userId + '/codingmarks/' + bookmark._id, JSON.stringify(bookmark),
            {headers: this.headers})
      .pipe(shareReplay());
  }

}
