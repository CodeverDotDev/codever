import { Observable } from 'rxjs';

import { map, startWith } from 'rxjs/operators';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PublicBookmarksStore } from '../../public/bookmarks/store/public-bookmarks-store.service';
import { KeycloakService } from 'keycloak-angular';
import { Search, UserData } from '../../core/model/user-data';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UserDataStore } from '../../core/user/userdata.store';
import { PublicBookmarksService } from '../../public/bookmarks/public-bookmarks.service';
import { PersonalBookmarksService } from '../../core/personal-bookmarks.service';
import { KeycloakServiceWrapper } from '../../core/keycloak-service-wrapper.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { PaginationNotificationService } from '../../core/pagination-notification.service';
import { LoginRequiredDialogComponent } from '../dialog/login-required-dialog/login-required-dialog.component';
import { PersonalSnippetsService } from '../../core/personal-snippets.service';
import { SearchNotificationService } from '../../core/search-notification.service';
import { SearchDomain } from '../../core/model/search-domain.enum';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { searchDomains } from '../../core/model/search-domains-map';
import { AddTagFilterToSearchDialogComponent } from './add-tag-filter-dialog/add-tag-filter-to-search-dialog.component';
import { DialogMeasurementsHelper } from '../../core/helper/dialog-measurements.helper';

@Component({
  selector: 'app-searchbar',
  templateUrl: './searchbar.component.html',
  styleUrls: ['./searchbar.component.scss']
})
export class SearchbarComponent implements OnInit {

  @Input()
  context: string;

  @Output()
  searchTriggered = new EventEmitter<boolean>();

  @Output()
  searchTextCleared = new EventEmitter<boolean>();

  @ViewChild('publicSearchBox') searchBoxField: ElementRef;

  _userData: UserData;

  searchControl = new FormControl();
  searchBoxText: string; // holds the value in the search box
  public showNotFound = false;

  userIsLoggedIn = false;
  userId: string;

  autocompleteSearches: Search[] = [];
  filteredSearches: Observable<Search[]>;

  options: Search[] = [{text: 'one'}, {text: 'two'}, {text: 'three'}];
  filteredOptions: Observable<Search[]>;

  isFocusOnSearchControl = false;

  autoSelector = 'auto';

  showSearchResults = false;
  hover = false;

  public innerWidth: any;

  searchDomain = SearchDomain.PUBLIC_BOOKMARKS.valueOf();
  searchDomains = searchDomains;

  currentPage: number;
  callerPaginationSearchResults = 'search-results';

  constructor(private router: Router,
              private route: ActivatedRoute,
              private searchNotificationService: SearchNotificationService,
              private bookmarkStore: PublicBookmarksStore,
              private publicBookmarksService: PublicBookmarksService,
              private personalBookmarksService: PersonalBookmarksService,
              private personalCodeletsService: PersonalSnippetsService,
              private paginationNotificationService: PaginationNotificationService,
              private keycloakService: KeycloakService,
              private keycloakServiceWrapper: KeycloakServiceWrapper,
              private userDataStore: UserDataStore,
              private userInfoStore: UserInfoStore,
              private dialogMeasurementsHelper: DialogMeasurementsHelper,
              private addTagsToSearchDialog: MatDialog,
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

    return this.autocompleteSearches.filter(search => this.includesFilterValues(search, filterValue) && search.searchDomain === this.searchDomain);
  }

  private includesFilterValues(search: Search, filterValue: string) {
    const isEvery = filterValue.split(' ').every(element => search.text.toLowerCase().includes(element));

    // return search.text.toLowerCase().includes(filterValue);
    return isEvery;
  }

  ngOnInit(): void {
    this.innerWidth = window.innerWidth;

    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.userIsLoggedIn = true;
        this.searchDomain = SearchDomain.MY_BOOKMARKS;
      }
    });

    this.searchNotificationService.searchTriggeredFromNavbar$.subscribe(searchData => {
      this.searchDomain = searchData.searchDomain;
      this.searchControl.setValue(searchData.searchText);
    });

    this.watchSearchBoxValueChanges();
  }

  private watchSearchBoxValueChanges() {
    this.searchControl.valueChanges.subscribe(val => {
      this.searchBoxText = val;
    });
  }

  onBookmarkDeleted(deleted: boolean) {
    if (deleted) {
      this.searchControl.setValue(this.searchBoxText);
    }
  }

  onSearchDomainChange(selectedSearchDomain) {
    this.searchDomain = selectedSearchDomain;
    this.watchSearchBoxValueChanges();
    this.setFilteredSearches$(selectedSearchDomain);
    if ((selectedSearchDomain === SearchDomain.MY_BOOKMARKS || selectedSearchDomain === SearchDomain.MY_SNIPPETS) && !this.userIsLoggedIn) {
      this.searchDomain = SearchDomain.PUBLIC_BOOKMARKS;
      this.showLoginRequiredDialog('You need to be logged in to search in your personal bookmarks');
    } else {
      this.searchDomain = selectedSearchDomain;
      this.searchBoxField.nativeElement.focus();
      this.searchBoxField.nativeElement.select();
    }
  }

  private showLoginRequiredDialog(message: string) {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      message: message
    };

    const dialogRef = this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
  }

  /**
   * It saves the current search with the current timestamp - it gets pushed
   * at the "top" of saved searches so it will be displayed at the top in suggested searches
   */
  onSaveSearchClick() {
    if (!this.userIsLoggedIn) {
      this.showLoginRequiredDialog('You need to be logged in to save searches')
    } else {
      const now = new Date();
      const newSearch: Search = {
        text: this.searchBoxText,
        createdAt: now,
        lastAccessedAt: now,
        searchDomain: this.searchDomain,
        count: 1,
        saved: true
      }
      const emptyUserData = Object.keys(this._userData).length === 0 && this._userData.constructor === Object;
      if (emptyUserData) {
        this._userData = {
          userId: this.userId,
          searches: [newSearch]
        }
      } else {
        const existingSavedSearchIndex = this._userData.searches.findIndex(
          element => element.searchDomain === this.searchDomain
            && element.text.trim().toLowerCase() === this.searchBoxText.trim().toLowerCase());
        if (existingSavedSearchIndex !== -1) {
          const existingSavedSearch: Search = this._userData.searches.splice(existingSavedSearchIndex, 1)[0];
          existingSavedSearch.lastAccessedAt = now;
          existingSavedSearch.count++;
          existingSavedSearch.saved = true;
          this._userData.searches.unshift(existingSavedSearch);
        } else {
          this._userData.searches.unshift(newSearch);
        }
      }
      this.userDataStore.updateUserData$(this._userData).subscribe();
    }
  }

  onAutocompleteSelectionChanged(event: MatAutocompleteSelectedEvent) {
    const selectedValue = event.option.value;
    this.triggerBookmarkSearch(selectedValue);
  }

  focusOnSearchControl() {
    this.isFocusOnSearchControl = true;
  }

  unFocusOnSearchControl() {
    this.isFocusOnSearchControl = false;
  }

  searchBookmarksFromSearchBox(searchText: string) {
    this.currentPage = 1;
    this.triggerBookmarkSearch(searchText);
  }

  triggerBookmarkSearch(searchText: string) {
    const searchTextNotEmpty = searchText.trim() !== '';
    if (searchTextNotEmpty) {
      this.router.navigate(['./search'],
        {
          queryParams: {q: searchText, sd: this.searchDomain, page: this.currentPage, include: 'all'}
        }).then(() => {
        this.searchNotificationService.triggerSearch(
          {
            searchText: this.searchBoxText,
            searchDomain: this.searchDomain
          });
      });
    }
  }

  clearSearchBoxText() {
    this.searchControl.patchValue('');
  }

  @HostListener('window:keydown.control.s', ['$event'])
  focusOnSearchBoxHotKey(event: KeyboardEvent) {
    event.preventDefault();
    this.searchBoxField.nativeElement.focus();
    this.searchBoxField.nativeElement.select();
  }

  getPlaceholderTextForSearchbar() {
    let response = 'Search';
    if (this.innerWidth <= 1400) {
      response += ' ' + this.searchDomains.get(this.searchDomain);
    } else {
      response += '...';
    }

    return response;
  }

  watchForTags(value: string) {
    if (value === 'qq') {
      this.filteredSearches = this.filteredOptions;
    }

    console.log('input value ', value);
  }

  addTagFilter() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.width = this.dialogMeasurementsHelper.getRelativeWidth(60);
    dialogConfig.data = {
      userId: this.userId,
      searchDomain: this.searchDomain
    };

    const dialogRef = this.addTagsToSearchDialog.open(AddTagFilterToSearchDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(
      tagsString => {
        if (tagsString) {
          const existingQueryValue = this.searchControl.value ? this.searchControl.value : '';
          this.searchControl.patchValue(`${existingQueryValue} ${tagsString}`);
          this.searchBoxField.nativeElement.focus();
        }
      }
    );
  }

}
