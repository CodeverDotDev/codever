import {Injectable} from '@angular/core';
import 'rxjs/add/operator/toPromise';
import {Observable} from 'rxjs/Observable';
import {Bookmark} from '../../core/model/bookmark';

import { environment } from 'environments/environment';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class TagService {

  private bookmarksUrl = '';  // URL to web api

  constructor(private httpClient: HttpClient) {
    this.bookmarksUrl = environment.API_URL + '/public/bookmarks/';
  }

  getBookmarksForTag(tag: string): Observable<Bookmark[]> {
      return this.httpClient.get<Bookmark[]>(`${this.bookmarksUrl}?tag=${tag}`);
  };

}
