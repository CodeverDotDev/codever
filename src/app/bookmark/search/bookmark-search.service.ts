import {Injectable} from '@angular/core';
import {Bookmark} from '../bookmark';

import {Headers, Http, Response} from "@angular/http";

import { Observable } from 'rxjs';

@Injectable()
export class BookmarkSearchService {

  private bookmarksUrl = 'http://localhost:3000/bookmarks';  // URL to web api
  private headers = new Headers({'Content-Type': 'application/json'});

  constructor(private http: Http) { }

  search(term: string): Observable<Bookmark[]> {
    var response = this.http
        .get(`${this.bookmarksUrl}/?name=${term}`)
        .map((r: Response) => r.json().data as Bookmark[]);

    return response;
  }

}
