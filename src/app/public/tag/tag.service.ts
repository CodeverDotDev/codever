import {Injectable} from '@angular/core';
import {Http, Response} from '@angular/http';
import 'rxjs/add/operator/toPromise';
import {Observable} from 'rxjs';
import {Bookmark} from '../../core/model/bookmark';

import { environment } from 'environments/environment';

@Injectable()
export class TagService {

  private bookmarksUrl = '';  // URL to web api

  constructor(private http: Http) {
    // this.bookmarksUrl = process.env.API_URL + '/bookmarks/';
    this.bookmarksUrl = environment.API_URL + '/bookmarks/';
  }

  getBookmarksForTag(tag: string): Observable<Bookmark[]> {
    return this.http
      .get(`${this.bookmarksUrl}?tag=${tag}`)
      .share()
      .map((res: Response) => res.json());
  }

}
