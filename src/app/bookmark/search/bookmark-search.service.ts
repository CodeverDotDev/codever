import {Injectable} from '@angular/core';
import {Bookmark} from '../../model/bookmark';

import {Headers, Http, Response} from "@angular/http";

import { Observable } from 'rxjs';

@Injectable()
export class BookmarkSearchService {

  private bookmarksUrl = 'http://localhost:3000/bookmarks';  // URL to web api
  private headers = new Headers({'Content-Type': 'application/json'});

  constructor(private http: Http) { }

  search(term: string): Observable<Bookmark[]> {
    var response = this.http
        .get(`${this.bookmarksUrl}/?term=${term}`)
        .map((res:Response) => res.json())
        //...errors if any
        .catch((error:any) => Observable.throw(error.json().error || 'Server error'));

    return response;
  }

  advancedSearch(term: string): Observable<Bookmark[]> {
    var searchQuery='?name='+term;
    if(term.includes('(')){
      var searchTextNameAndDescription= term.substr(0, term.indexOf('+')).trim();
      var regExpCategory=new RegExp('\[(.*?)\]');
      var searchTextCategoryMatches=regExpCategory.exec(term);
      if(searchTextCategoryMatches.length > 0){
        searchQuery += 'category='+searchTextCategoryMatches[0];
      }

      var regExpTags=new RegExp('\((.*?)\)');
      var searchTextTagMatches=regExpTags.exec(term);
      if(searchTextTagMatches.length > 0){
        searchQuery += 'tag='+searchTextTagMatches[0];
      }
    }

    var response = this.http
      .get(`${this.bookmarksUrl}${searchQuery}`)
      .map((res:Response) => res.json())
      //...errors if any
      .catch((error:any) => Observable.throw(error.json().error || 'Server error'));

    return response;
  }
}
