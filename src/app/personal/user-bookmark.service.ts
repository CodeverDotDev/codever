import {Injectable} from '@angular/core';
import {Bookmark} from '../model/bookmark';

import {Headers, Http, Response} from "@angular/http";

import 'rxjs/add/operator/toPromise';
import {Observable} from "rxjs";

@Injectable()
export class UserBookmarkService {

  private baseUrl = 'http://localhost:3000/users/';  // URL to web api
  private headers = new Headers({'Content-Type': 'application/json'});

  constructor(private http: Http) { }

  getAllBookmarks(userId:String): Observable<Response> {
    console.log('******** UserBookmarkService.getAllBookmarks was called *************');
    console.log('******** GET on ' + this.baseUrl + userId + '/bookmarks' +' *************');
    return this.http.get(this.baseUrl + userId + '/bookmarks');
  }

  updateBookmark(bookmark:Bookmark): Observable<any> {
    const url = `${this.baseUrl}/${bookmark._id}`;
    return this.http
      .put(url, JSON.stringify(bookmark), {headers: this.headers})
      .share();
  }

  delete(id: string): Observable<any> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.delete(url, {headers: this.headers}).share();
    //.map((res:Response) => res.json()) // ...and calling .json() on the response to return data
    //.catch((error:any) => Observable.throw(error.json().error || 'Server error')); //...errors if any
  }

  saveBookmark(bookmark: Bookmark): Observable<any> {
    return this.http
      .post(this.baseUrl, JSON.stringify(bookmark), {headers: this.headers})
      .share();
  }

}
