import { Observable, of } from 'rxjs';

import { map, startWith } from 'rxjs/operators';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Bookmark } from '../../core/model/bookmark';
import { PublicBookmarksStore } from '../../public/bookmarks/store/public-bookmarks-store.service';
import { KeycloakService } from 'keycloak-angular';
import { Search, UserData } from '../../core/model/user-data';
import { MatAutocompleteSelectedEvent, MatDialog, MatDialogConfig } from '@angular/material';
import { UserDataStore } from '../../core/user/userdata.store';
import { PublicBookmarksService } from '../bookmarks/public-bookmarks.service';
import { PersonalBookmarksService } from '../../core/personal-bookmarks.service';
import { KeycloakServiceWrapper } from '../../core/keycloak-service-wrapper.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { environment } from '../../../environments/environment';
import { PaginationNotificationService } from '../../core/pagination-notification.service';
import { LoginRequiredDialogComponent } from '../../shared/login-required-dialog/login-required-dialog.component';
import { Codelet } from '../../core/model/codelet';
import { PersonalCodeletsService } from '../../core/personal-codelets.service';

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
  searchTextCleared = new EventEmitter<boolean>();

  _userData: UserData;

  searchResults$: Observable<Bookmark[] | Codelet[]>;

  searchControl = new FormControl();
  searchText: string; // holds the value in the search box
  public showNotFound = false;

  userIsLoggedIn = false;
  userId: string;

  autocompleteSearches: Search[] = [];
  filteredSearches: Observable<Search[]>;

  isFocusOnSearchControl = false;

  showSearchResults = false;
  hover = false;

  searchDomain = 'public';

  searchDomains: SearchDomain[] = [
    {value: 'personal', viewValue: 'My bookmarks'},
    {value: 'public', viewValue: 'Public bookmarks'},
    {value: 'my-codelets', viewValue: 'My codelets'}
  ];

  currentPage: number;
  callerPaginationSearchResults = 'search-results';

  constructor(private router: Router,
              private route: ActivatedRoute,
              private bookmarkStore: PublicBookmarksStore,
              private publicBookmarksService: PublicBookmarksService,
              private personalBookmarksService: PersonalBookmarksService,
              private personalCodeletsService: PersonalCodeletsService,
              private paginationNotificationService: PaginationNotificationService,
              private keycloakService: KeycloakService,
              private keycloakServiceWrapper: KeycloakServiceWrapper,
              private userDataStore: UserDataStore,
              private userInfoStore: UserInfoStore,
              private loginDialog: MatDialog) {
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
            this.autocompleteSearches = this._userData.searches;
            this.setFilteredSearches$(this.searchDomain);
          }
        });
    }

  }

  private setFilteredSearches$(searchDomain: string) {
    this.filteredSearches = this.searchControl.valueChanges
      .pipe(
        startWith(null),
        map((searchText: string | null) => {
          return searchText ? this._filter(searchText) : this.autocompleteSearches.filter(item => item.searchDomain === searchDomain);
        })
      );
  }

  private _filter(value: string): Search[] {
    const filterValue = value.toLowerCase();

    return this.autocompleteSearches.filter(item => item.text.toLowerCase().includes(filterValue) && item.searchDomain === this.searchDomain);
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
          case 'my-codelets': {
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

    const page = this.route.snapshot.queryParamMap.get('page');
    if (page) {
      this.currentPage = parseInt(page, 0);
    } else {
      this.currentPage = 1;
    }

    this.paginationNotificationService.pageNavigationClicked$.subscribe(paginationAction => {
      if (paginationAction.caller === this.callerPaginationSearchResults) {
        this.currentPage = paginationAction.page;
        this.searchBookmarks(this.searchText);
      }
    })
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

  onBookmarkDeleted(deleted: boolean) {
    if (deleted) {
      this.searchControl.setValue(this.searchText);
    }
  }

  onSearchDomainChange(newValue) {
    this.setFilteredSearches$(newValue);

    if ((newValue === 'personal' || newValue === 'my-codelets') && !this.userIsLoggedIn) {
      this.searchDomain = 'public';
      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.data = {
        message: 'You need to be logged in to search in your personal bookmarks'
      };

      const dialogRef = this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    } else {
      this.searchDomain = newValue;
      this.syncQueryParamsWithSearchBox();
      if (this.searchText && this.searchText !== '') {
        this.searchBookmarks(this.searchText);
      }
    }
  }

  onSaveSearchClick() {
    const now = new Date();
    const newSearch: Search = {
      text: this.searchText,
      createdAt: now,
      lastAccessedAt: now,
      searchDomain: this.searchDomain,
      count: 1
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
    this.userDataStore.updateUserData$(this._userData).subscribe();
  }

  onAutocompleteSelectionChanged(event: MatAutocompleteSelectedEvent) {
    const selectedValue = event.option.value;
    const index = this._userData.searches.findIndex((search: Search) => search.text === selectedValue);
    const updatedSearch: Search = this._userData.searches.splice(index, 1)[0];
    updatedSearch.lastAccessedAt = new Date();
    if (updatedSearch.count) {
      updatedSearch.count++;
    } else {
      updatedSearch.count = 1;
    }
    this._userData.searches.unshift(updatedSearch);

    this.userDataStore.updateUserData$(this._userData).subscribe();
    this.searchBookmarks(selectedValue);
  }

  focusOnSearchControl() {
    this.isFocusOnSearchControl = true;
  }

  unFocusOnSearchControl() {
    this.isFocusOnSearchControl = false;
  }

  searchBookmarksFromSearchBox(searchText: string) {
    this.currentPage = 1;
    this.searchBookmarks(searchText);
    this.syncQueryParamsWithSearchBox();
  }

  searchBookmarks(searchText: string) {
    if (searchText.trim() !== '') {
      if (this.searchDomain === 'personal' && this.userId) {
        this.searchResults$ = this.personalBookmarksService.getFilteredPersonalBookmarks(searchText, environment.PAGINATION_PAGE_SIZE, this.currentPage, this.userId);
        this.showSearchResults = true;
        this.searchTriggered.emit(true);
      } else if (this.searchDomain === 'my-codelets' && this.userId) {
        this.searchResults$ = this.personalCodeletsService.getFilteredPersonalCodelets(searchText, environment.PAGINATION_PAGE_SIZE, this.currentPage, this.userId);
        this.showSearchResults = true;
        this.searchTriggered.emit(true);
      } else {
        this.searchResults$ = this.publicBookmarksService.getFilteredPublicBookmarks(searchText, environment.PAGINATION_PAGE_SIZE, this.currentPage, 'relevant');
        this.showSearchResults = true;
        this.searchTriggered.emit(true);
      }
    }

  }

  syncQueryParamsWithSearchBox() {
    if (this.searchText) {
      this.router.navigate(['.'],
        {
          relativeTo: this.route,
          queryParams: {q: this.searchText, sd: this.searchDomain, page: this.currentPage},
          queryParamsHandling: 'merge'
        }
      );
    } else {
      this.searchTextCleared.emit(true);
      this.router.navigate(['./'],
        {
          relativeTo: this.route,
          queryParams: {q: null, sd: null, page: null},
          queryParamsHandling: 'merge'
        }
      );
    }
  }

  clearSearchText() {
    this.searchControl.patchValue('');
  }

  searchAlreadySaved(autocompleteSearches: Search[], searchText: string) {
    for (const search of autocompleteSearches) {
      if (search.text.includes(searchText)) {
        return true;
      }
    }
    return false;
  }
}
