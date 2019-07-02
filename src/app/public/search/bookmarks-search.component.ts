import { Observable } from 'rxjs';

import { map, startWith } from 'rxjs/operators';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { BookmarkFilterService } from '../../core/filter.service';
import { Bookmark } from '../../core/model/bookmark';
import { PublicBookmarksStore } from '../../public/bookmarks/store/public-bookmarks-store.service';
import { KeycloakService } from 'keycloak-angular';
import { Search, UserData } from '../../core/model/user-data';
import { MatAutocompleteSelectedEvent } from '@angular/material';
import { UserDataStore } from '../../core/user/userdata.store';
import { PublicBookmarksService } from '../bookmarks/public-bookmarks.service';
import { PersonalBookmarksService } from '../../core/personal-bookmarks.service';
import { KeycloakServiceWrapper } from '../../core/keycloak-service-wrapper.service';
import { UserInfoStore } from '../../core/user/user-info.store';

export interface SearchDomain {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-bookmark-search',
  templateUrl: './bookmarks-search.component.html',
  styleUrls: ['./bookmark-search.component.scss']
})
export class BookmarksSearchComponent implements OnInit {

  @Input()
  context: string;

  @Output()
  searchTriggered = new EventEmitter<boolean>();

  @Output()
  clearSearchText = new EventEmitter<boolean>();

  _userData: UserData;


  searchResults$: Observable<Bookmark[]>;

  searchControl = new FormControl();
  searchText: string; // holds the value in the search box
  public showNotFound = false;
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
    {value: 'personal', viewValue: 'Personal & Favorites'},
    {value: 'public', viewValue: 'Public bookmarks'}
  ];

  constructor(private router: Router,
              private location: Location,
              private route: ActivatedRoute,
              private bookmarkStore: PublicBookmarksStore,
              private bookmarkFilterService: BookmarkFilterService,
              private publicBookmarksService: PublicBookmarksService,
              private personalBookmarksService: PersonalBookmarksService,
              private keycloakService: KeycloakService,
              private keycloakServiceWrapper: KeycloakServiceWrapper,
              private userDataStore: UserDataStore,
              private userInfoStore: UserInfoStore) {
  }

  @Input()
  set userData$(userData$: Observable<UserData>) {
    if (userData$) {
      userData$
        .subscribe(userData => {
          this.userId = userData.userId;
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
        });
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
        this.userInfoStore.getUserInfo$().subscribe(userInfo => {
          this.userId = userInfo.sub;

          if (!this.searchDomain) {
            if (!this.searchText) {
              this.searchDomain = 'personal'; // without q param we are preparing to look in personal bookmarks
            } else {
              this.searchDomain = 'public';
              this.searchControl.setValue(this.searchText);
              this.searchBookmarks(this.searchText);
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
      this.syncQueryParamsWithSearchBox();
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

  onSearchDomainChange(newValue) {
    this.searchDomain = newValue;
    this.syncQueryParamsWithSearchBox();
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
      this.searchTriggered.emit(true);

      if (this.previousTerm !== searchText) {
        this.previousTerm = searchText;
        this.counter = 10;
      }
      if (this.searchDomain === 'personal' && this.userId) {
        this.searchResults$ = this.personalBookmarksService.getFilteredPersonalBookmarks(searchText, this.counter, this.userId);
        this.showSearchResults = true;
      } else {
        this.searchResults$ = this.publicBookmarksService.getFilteredPublicBookmarks(searchText, this.counter);
        this.showSearchResults = true;
      }
    }

  }

   syncQueryParamsWithSearchBox() {
    if (this.searchText) {
      this.router.navigate(['.'],
        {
          relativeTo: this.route,
          queryParams: {q: this.searchText, sd: this.searchDomain},
          queryParamsHandling: 'merge'
        }
      );

    } else {
      this.clearSearchText.emit(true);
      this.router.navigate(['./'],
        {
          relativeTo: this.route,
          queryParams: {q: null, sd: null},
          queryParamsHandling: 'merge'
        }
      );
    }
  }

}
