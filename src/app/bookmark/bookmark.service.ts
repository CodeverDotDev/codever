import {Injectable} from '@angular/core';
import {Bookmark} from './bookmark';

import {Headers, Http, Response} from "@angular/http";

import 'rxjs/add/operator/toPromise';
import {Observable} from "rxjs";

@Injectable()
export class BookmarkService {

  private bookmarksUrl = 'http://localhost:3000/bookmarks';  // URL to web api
  private headers = new Headers({'Content-Type': 'application/json'});

  constructor(private http: Http) { }

  create(bookmark:Bookmark): Promise<Bookmark> {
    return this.http
      .post(this.bookmarksUrl, JSON.stringify(bookmark), {headers: this.headers})
      .toPromise()
      .then(res => res.json().data)
      .catch(this.handleError);
  }

  /**
   * TODO use .map for DTO
   * @returns {Observable<R>|Promise<R>|Q.Promise<*>|Promise<*|T>|Promise<*>|any}
   */
  getBookmarks(): Observable<Bookmark[]> {
    return this.http.get(this.bookmarksUrl)
    // ...and calling .json() on the response to return data
      .map((res:Response) => res.json())
      //...errors if any
      .catch((error:any) => Observable.throw(error.json().error || 'Server error'));
  }

  getBookmarksObservable(): Observable<Bookmark[]> {
    return this.http.get(this.bookmarksUrl)
    // ...and calling .json() on the response to return data
      .map((res:Response) => res.json())
      //...errors if any
      .catch((error:any) => Observable.throw(error.json().error || 'Server error'));
  }

  getBookmark(id: string): Promise<Bookmark> {
    return this.getBookmarks().toPromise()
      .then(bookmarks => bookmarks.find(bookmark => bookmark._id === id));
  }

  update(bookmark:Bookmark): Promise<Bookmark> {
    const url = `${this.bookmarksUrl}/${bookmark._id}`;
    return this.http
    .put(url, JSON.stringify(bookmark), {headers: this.headers})
    .toPromise()
    .then(() => bookmark)
    .catch(this.handleError);
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

  deleteBookmark(id: string): Observable<Bookmark[]> {
    const url = `${this.bookmarksUrl}/${id}`;
    return this.http.delete(url, {headers: this.headers})
        .map((res:Response) => res.json()) // ...and calling .json() on the response to return data
        .catch((error:any) => Observable.throw(error.json().error || 'Server error')); //...errors if any
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }

  saveBookmark(bookmark: Bookmark): Observable<any> {
    return this.http
      .post(this.bookmarksUrl, JSON.stringify(bookmark), {headers: this.headers})
      .share();
  }

}
