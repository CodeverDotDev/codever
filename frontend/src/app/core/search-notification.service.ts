import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { SearchData } from './model/search-data';

@Injectable()
export class SearchNotificationService {
  private searchTriggeredSource = new Subject<SearchData>();
  searchTriggeredSource$: Observable<SearchData> =
    this.searchTriggeredSource.asObservable();

  private searchTriggeredFromNavbar = new Subject<SearchData>();
  searchTriggeredFromNavbar$: Observable<SearchData> =
    this.searchTriggeredFromNavbar.asObservable();

  triggerSearch(searchData: SearchData) {
    this.searchTriggeredSource.next(searchData);
  }

  updateSearchBar(searchData: SearchData) {
    this.searchTriggeredFromNavbar.next(searchData);
  }
}
