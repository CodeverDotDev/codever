import { Observable, of as observableOf } from 'rxjs';

import { map, startWith } from 'rxjs/operators';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BookmarkFilterService } from '../../core/filter.service';
import { Bookmark } from '../../core/model/bookmark';
import { PublicBookmarksStore } from '../../public/bookmarks/store/public-bookmarks-store.service';
import { KeycloakService } from 'keycloak-angular';
import { Search, UserData } from '../../core/model/user-data';
import { MatAutocompleteSelectedEvent } from '@angular/material';
import { UserDataStore } from '../../core/user/userdata.store';
import { PublicBookmarksService } from '../bookmarks/public-bookmarks.service';
import { PersonalBookmarkService } from '../../core/personal-bookmark.service';
import { KeycloakServiceWrapper } from '../../core/keycloak-service-wrapper.service';

export interface SearchDomain {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-public-bookmark-search',
  templateUrl: './public-bookmark-search.component.html',
  styleUrls: ['./public-bookmark-search.component.scss']
})
export class PublicBookmarkSearchComponent implements OnInit {

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
              private route: ActivatedRoute,
              private bookmarkStore: PublicBookmarksStore,
              private bookmarkFilterService: BookmarkFilterService,
              private publicBookmarksService: PublicBookmarksService,
              private personalBookmarksService: PersonalBookmarkService,
              private keycloakService: KeycloakService,
              private keycloakServiceWrapper: KeycloakServiceWrapper,
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

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.autocompleteSearches.filter(option => option.toLowerCase().includes(filterValue));
  }

  ngOnInit(): void {
    this.searchText = this.route.snapshot.queryParamMap.get('q');
    this.searchDomain = this.route.snapshot.queryParamMap.get('sd');

    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.userIsLoggedIn = true;
        this.keycloakService.loadUserProfile().then(keycloakProfile => {
          this.userId = keycloakProfile.id;

          if (!this.searchDomain) {
            if (!this.searchText) {
              this.searchDomain = 'personal'; // without q param we are preparing to look in personal bookmarks
            } else {
              this.searchDomain = 'public';
            }
          } else if (this.searchText) {
            this.searchControl.setValue(this.searchText);
            this.searchBookmarks(this.searchText);
          }
        });
      } else {
        switch (this.searchDomain) {
          case 'personal': {
            this.keycloakServiceWrapper.login();
            break;
          }
          default: {
            this.searchDomain = 'public';
            break;
          }
        }
        if (this.searchText) {
          this.searchControl.setValue(this.searchText);
          this.searchBookmarks(this.searchText);
        }
      }
    });

    this.watchSearchBoxValueChanges();
  }

  private watchSearchBoxValueChanges() {
    this.searchControl.valueChanges.subscribe(val => {
      this.searchText = val;
      this.showNotFound = false;
      if (val.trim() === '') {
        this.showSearchResults = false;
      }
    });
  }

  onShowMoreResults() {
    this.counter += 10;
    this.searchBookmarks(this.searchText);
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

  onSearchDomainChange(newValue) {
    this.searchDomain = newValue;
    if (this.searchText && this.searchText !== '') {
      this.searchBookmarks(this.searchText);
    }
  }

  onSaveSearchClick() {
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

  onAutocompleteSelectionChanged(event: MatAutocompleteSelectedEvent) {
    const selectedValue = event.option.value;
    const index = this._userData.searches.findIndex((search: Search) => search.text === selectedValue);
    const updatedSearch: Search = this._userData.searches.splice(index, 1)[0];
    updatedSearch.lastAccessedAt = new Date();
    this._userData.searches.unshift(updatedSearch);

    this.userDataStore.updateUserData(this._userData).subscribe();
    this.searchBookmarks(selectedValue);
  }

  focusOnSearchControl() {
    this.isFocusOnSearchControl = true;
  }

  unFocusOnSearchControl() {
    this.isFocusOnSearchControl = false;
  }

  searchBookmarks(searchText: string) {
    if (searchText.trim() !== '') {
      this.syncQueryParamsWithSearchBox();
      if (this.previousTerm !== searchText) {
        this.previousTerm = searchText;
        this.counter = 10;
      }
      let filteredPublicBookmarks: Observable<Bookmark[]>;
      if (this.searchDomain === 'personal') {
        filteredPublicBookmarks = this.personalBookmarksService.getFilteredPersonalBookmarks(searchText, this.counter, this.userId);
      } else {
        filteredPublicBookmarks = this.publicBookmarksService.getFilteredPublicBookmarks(searchText, this.counter);
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

  private syncQueryParamsWithSearchBox() {
    this.router.navigate(['.'],
      {
        relativeTo: this.route,
        queryParams: {q: this.searchText, sd: this.searchDomain}
      }
    );
  }
}
