import {Injectable} from '@angular/core';

import {Http} from '@angular/http';

import 'rxjs/add/operator/toPromise';
import {Observable} from 'rxjs/Observable';
import {Webpage} from '../../core/model/webpage';
import {Bookmark} from '../../core/model/bookmark';

import {environment} from 'environments/environment';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';

@Injectable()
export class BookmarkService {

  private bookmarksUrl = '';  // URL to web api
  private headers = new HttpHeaders({'Content-Type': 'application/json'});

  constructor(private httpClient: HttpClient) {
    // this.bookmarksUrl = process.env.API_URL + '/bookmarks/';
    this.bookmarksUrl = environment.API_URL + '/public/bookmarks';
  }

  getAllBookmarks(): Observable<Bookmark[]> {
    return this.httpClient.get<Bookmark[]>(this.bookmarksUrl);
  }

  getScrapingData(url: String): Observable<Webpage> {
    return this.httpClient
      .get<Webpage>(`${this.bookmarksUrl}/scrape?url=${url}`);
  }

  getPublicBookmarkByLocation(url: string): Observable<Bookmark> {
    let params = new HttpParams();
    params = params.append('location', url);
    return this.httpClient
      .get<Bookmark>(`${this.bookmarksUrl}`, {params: params});
  }

  updateBookmark(bookmark: Bookmark): Observable<any> {
    return this.httpClient
      .put(environment.API_URL + '/private/users/' + bookmark.userId + '/bookmarks/' + bookmark._id, JSON.stringify(bookmark),
            {headers: this.headers})
      .shareReplay();
  }

  delete(id: string): Observable<any> {
    const url = `${this.bookmarksUrl}/${id}`;
    return this.httpClient.delete(url, {headers: this.headers}).shareReplay();
        // .map((res:Response) => res.json()) // ...and calling .json() on the response to return data
        // .catch((error:any) => Observable.throw(error.json().error || 'Server error')); //...errors if any
  }

  saveBookmark(bookmark: Bookmark): Observable<any> {
    return this.httpClient
      .post(this.bookmarksUrl, JSON.stringify(bookmark), {headers: this.headers})
      .share();
  }

}
