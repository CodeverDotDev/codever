import {Injectable} from '@angular/core';
import {Bookmark} from '../model/bookmark';

import {Headers, Http, Response} from "@angular/http";

import 'rxjs/add/operator/toPromise';
import {Observable} from "rxjs";
import {HttpWrapperService} from "../keycloak/http-wrapper.service";

@Injectable()
export class UserBookmarkService {

  private baseUrl = 'http://localhost:3000/api/users/';  // URL to web api - default is the DEV environment
  private headers = new Headers({'Content-Type': 'application/json'});

  constructor(private http: Http, private httpWrapper: HttpWrapperService) {
    if (process.env.ENV === 'build') {//PRODUCTION
      this.baseUrl = 'http://production:3000/api/users/';
    } else {//DEV
      this.baseUrl = 'http://localhost:3000/api/users/';
    }
  }

  getAllBookmarks(userId:String): Observable<Response> {
    console.log('******** UserBookmarkService.getAllBookmarks was called *************');
    console.log('******** GET on ' + this.baseUrl + userId + '/bookmarks' +' *************');
    return this.httpWrapper.get(this.baseUrl + userId + '/bookmarks');
  }

  updateBookmark(bookmark:Bookmark): Observable<any> {
    return this.httpWrapper
      .put(this.baseUrl + bookmark.userId + '/bookmarks/' + bookmark._id, JSON.stringify(bookmark), {headers: this.headers})
      .share();
  }

  delete(bookmark:Bookmark): Observable<any> {
    return this.httpWrapper
      .delete(this.baseUrl + bookmark.userId + '/bookmarks/' + bookmark._id, {headers: this.headers})
      .share();
  }

  saveBookmark(userId:string, bookmark: Bookmark): Observable<Response> {
    return this.httpWrapper
      .post(this.baseUrl + userId + '/bookmarks', JSON.stringify(bookmark))
      .share();
  }

}
