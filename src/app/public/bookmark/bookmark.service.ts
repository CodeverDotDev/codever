import {Injectable} from '@angular/core';

import {Headers, Http, Response} from "@angular/http";

import 'rxjs/add/operator/toPromise';
import {Observable} from "rxjs";
import {Webpage} from "../../core/model/webpage";
import {Bookmark} from "../../core/model/bookmark";


@Injectable()
export class BookmarkService {

  private bookmarksUrl = '';  // URL to web api
  private headers = new Headers({'Content-Type': 'application/json'});

  constructor(private http: Http) {
    this.bookmarksUrl = process.env.API_URL + '/bookmarks/';
  }

  getAllBookmarks(): Observable<Response> {
    return this.http.get(this.bookmarksUrl);
  }

  getBookmarkTitle(url: String): Observable<Webpage>{
    return this.http
      .get(`${this.bookmarksUrl}scrape?url=${url}`)
      .share()
      .map((response: Response) => {
        return new Webpage(response.json().title);
      });
      //.catch((error:any) => Observable.throw(error.json().error || 'Server error'));
  }


  updateBookmark(bookmark:Bookmark): Observable<any> {
    const url = `${this.bookmarksUrl}/${bookmark._id}`;
    return this.http
      .put(url, JSON.stringify(bookmark), {headers: this.headers})
      .share();
  }

  delete(id: string): Observable<any> {
    const url = `${this.bookmarksUrl}/${id}`;
    return this.http.delete(url, {headers: this.headers}).share();
        //.map((res:Response) => res.json()) // ...and calling .json() on the response to return data
        //.catch((error:any) => Observable.throw(error.json().error || 'Server error')); //...errors if any
  }

  saveBookmark(bookmark: Bookmark): Observable<any> {
    return this.http
      .post(this.bookmarksUrl, JSON.stringify(bookmark), {headers: this.headers})
      .share();
  }

}
