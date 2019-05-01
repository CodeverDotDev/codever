import { Observable, of as observableOf } from 'rxjs';

import { map, startWith } from 'rxjs/operators';
import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { BookmarkFilterService } from '../../core/filter.service';
import { Bookmark } from '../../core/model/bookmark';
import { PublicBookmarksStore } from '../../public/bookmarks/store/public-bookmarks-store.service';
import { KeycloakService } from 'keycloak-angular';
import { Search, UserData } from '../../core/model/user-data';
import { MatAutocompleteSelectedEvent } from '@angular/material';
import { UserDataStore } from '../../core/user/userdata.store';
import { PublicBookmarksService } from '../bookmarks/public-bookmarks.service';
import { PersonalBookmarkService } from '../../core/personal-bookmark.service';

export interface SearchDomain {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-public-bookmark-search',
  templateUrl: './public-bookmark-search.component.html',
  styleUrls: ['./public-bookmark-search.component.scss']
})
export class PublicBookmarkSearchComponent implements OnInit, AfterViewInit {

  @Input()
  q: string;

  @Input()
  context: string;

  _userData: UserData;

  filteredBookmarks: Observable<Bookmark[]>;

  searchControl = new FormControl();
  searchText: string; // holds the value in the search box
  public showNotFound = false;
  public numberOfResultsFiltered: number;
  counter = 10;


  userIsLoggedIn = false;
  userId: string;
  previousTerm: string;

  autocompleteSearches = [];
  filteredSearches: Observable<any[]>;

  isFocusOnSearchControl = false;

  showSearchResults = false;
  hover = false;

  searchDomain = 'public';

  searchDomains: SearchDomain[] = [
    {value: 'personal', viewValue: 'Personal bookmarks'},
    {value: 'public', viewValue: 'Public bookmarks'}
  ];


  constructor(private router: Router,
              private bookmarkStore: PublicBookmarksStore,
              private bookmarkFilterService: BookmarkFilterService,
              private publicBookmarksService: PublicBookmarksService,
              private personalBookmarksService: PersonalBookmarkService,
              private keycloakService: KeycloakService,
              private userDataStore: UserDataStore) {
  }

  @Input()
  set userData(userData: UserData) {
    if (userData) {
      const emptyUserData = Object.keys(userData).length === 0 && userData.constructor === Object; // = {}
      if (emptyUserData) {
        this._userData = userData; // = {}
      } else {
        this._userData = userData;
        this.autocompleteSearches = [];
        this._userData.searches.forEach(search => this.autocompleteSearches.push(search.text));
        this.filteredSearches = this.searchControl.valueChanges
          .pipe(
            startWith(null),
            map((searchText: string | null) => {
              return searchText ? this._filter(searchText) : this.autocompleteSearches.slice();
            })
          );
      }
    }
  }

  ngOnInit(): void {
    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.searchDomain = 'personal';
        this.userIsLoggedIn = true;
        this.keycloakService.loadUserProfile().then(keycloakProfile => {
          this.userId = keycloakProfile.id;
        });
      } else {
        this.searchDomain = 'public';
      }
    });

    this.searchControl.valueChanges.subscribe(val => {
      this.searchText = val;
      this.showNotFound = false;
      if (val.trim() === '') {
        this.showSearchResults = false;
      }
    });

  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.autocompleteSearches.filter(option => option.toLowerCase().includes(filterValue));
  }

  showMoreResults() {
    this.counter += 10;
    this.searchBookmarks(this.searchText, this.searchDomain);
  }

  ngAfterViewInit(): void {
    if (this.q) {
      this.searchControl.setValue(this.q);
      this.searchBookmarks(this.q, this.searchDomain);
    }
  }

  onBookmarkDeleted(deleted: boolean) {
    if (deleted) {
      this.searchControl.setValue(this.searchText);
    }
  }

  /**
   *
   * @param bookmark
   */
  gotoBookmarkDetail(bookmark: Bookmark): void {
    const link = ['/bookmarks', bookmark._id];
    this.router.navigate(link);
  }

  setQueryFromParentComponent(queryFromOutside: string) {
    this.searchControl.setValue(queryFromOutside);
    this.searchBookmarks(queryFromOutside, this.searchDomain);
  }

  onDomainChange(newValue) {
    this.searchDomain = newValue;
    if (this.searchText && this.searchText !== '') {
      this.searchBookmarks(this.searchText, this.searchDomain);
    }
  }

  onSaveClick() {
    const now = new Date();
    const newSearch: Search = {
      text: this.searchText,
      createdAt: now,
      lastAccessedAt: now,
      searchDomain: this.searchDomain
    }
    const emptyUserData = Object.keys(this._userData).length === 0 && this._userData.constructor === Object;
    if (emptyUserData) {
      this._userData = {
        userId: this.userId,
        searches: [newSearch]
      }
    } else {
      this._userData.searches.unshift(newSearch);
    }
    this.userDataStore.updateUserData(this._userData).subscribe();
  }

  onSelectionChanged(event: MatAutocompleteSelectedEvent) {
    const selectedValue = event.option.value;
    const index = this._userData.searches.findIndex((search: Search) => search.text === selectedValue);
    const updatedSearch: Search = this._userData.searches.splice(index, 1)[0];
    updatedSearch.lastAccessedAt = new Date();
    this._userData.searches.unshift(updatedSearch);

    this.userDataStore.updateUserData(this._userData).subscribe();
    this.searchBookmarks(selectedValue, this.searchDomain);
  }

  focusOnSearchControl() {
    this.isFocusOnSearchControl = true;
  }

  unFocusOnSearchControl() {
    this.isFocusOnSearchControl = false;
  }

  searchBookmarks(query: string, lang: string) {
    if (query.trim() !== '') {
      if (this.previousTerm !== query) {
        this.previousTerm = query;
        this.counter = 10;
      }
      this.searchText = query;
      let filteredPublicBookmarks: Observable<Bookmark[]>;
      if (this.searchDomain === 'public') {
        filteredPublicBookmarks = this.publicBookmarksService.getFilteredPublicBookmarks(query, 'all', this.counter);
      } else {
        filteredPublicBookmarks = this.personalBookmarksService.getFilteredPersonalBookmarks(query, 'all', this.counter, this.userId);
      }
      filteredPublicBookmarks.subscribe(bookmarks => {
        this.numberOfResultsFiltered = bookmarks.length;
        if (this.numberOfResultsFiltered > 0) {
          this.showNotFound = false;
          this.showSearchResults = true;
          this.filteredBookmarks = observableOf(bookmarks.slice(0, this.counter));
        } else {
          this.showNotFound = true;
          this.filteredBookmarks = observableOf<Bookmark[]>([]);
        }
      });
    }

  }
}
