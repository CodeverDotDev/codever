import {Injectable} from '@angular/core';

import {Observable} from 'rxjs';
import {Codingmark} from '../../core/model/codingmark';

import { environment } from 'environments/environment';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class TagService {

  private bookmarksUrl = '';  // URL to web api

  constructor(private httpClient: HttpClient) {
    this.bookmarksUrl = environment.API_URL + '/public/bookmarks/';
  }

  getBookmarksForTag(tag: string): Observable<Codingmark[]> {
      return this.httpClient.get<Codingmark[]>(`${this.bookmarksUrl}?tag=${tag}`);
  };

}
