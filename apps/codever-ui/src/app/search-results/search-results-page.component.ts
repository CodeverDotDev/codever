import { Component, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Bookmark } from '../core/model/bookmark';
import { SearchNotificationService } from '../core/search-notification.service';
import { AuthenticationService } from '../core/auth/authentication.service';
import { KeycloakServiceWrapper } from '../core/keycloak-service-wrapper.service';
import { UserInfoStore } from '../core/user/user-info.store';
import { UserDataStore } from '../core/user/userdata.store';
import { UserData } from '../core/model/user-data';
import { MatTabChangeEvent } from '@angular/material/tabs';

import { SearchDomain } from '../core/model/search-domain.enum';
import { MatDialog } from '@angular/material/dialog';
import { LoginDialogHelperService } from '../core/login-dialog-helper.service';
import { LoginRequiredDialogComponent } from '../shared/dialog/login-required-dialog/login-required-dialog.component';
import { PersonalSearchService } from '../core/personal-search.service';
import { PublicSearchService } from '../core/public-search.service';
import { Note } from '../core/model/note';

@Component({
    selector: 'app-search-results',
    templateUrl: './search-results-page.component.html',
    styleUrls: ['./search-results-page.component.scss'],
    standalone: false
})
export class SearchResultsPageComponent implements OnInit, OnDestroy {
  searchText: string; // holds the value in the search box
  searchDomain: string;

  currentPage: number;
  callerPaginationSearchResults = 'search-results';

  userId: string;
  userIsLoggedIn = false;

  searchResults$: Observable<(Bookmark | Note)[]>;
  private userData$: Observable<UserData>;

  selectedTabIndex = 1; // default search in public
  private searchInclude: string;

  typeFilter$ = new BehaviorSubject<'all' | 'bookmark' | 'note'>('all');
  filteredSearchResults$: Observable<(Bookmark | Note)[]>;

  searchTriggeredSubscription: any;

  searchInOtherCategoriesTip =
    'You can also try looking in other sections 👆👆 OR find elsewhere 👇👇';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private personalSearchService: PersonalSearchService,
    private publicSearchService: PublicSearchService,
    private keycloakService: AuthenticationService,
    private keycloakServiceWrapper: KeycloakServiceWrapper,
    private userInfoStore: UserInfoStore,
    private userDataStore: UserDataStore,
    private searchNotificationService: SearchNotificationService,
    private loginDialogHelperService: LoginDialogHelperService,
    public loginDialog: MatDialog,
    private location: Location
  ) {}

  ngOnInit() {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.searchText = this.route.snapshot.queryParamMap.get('q');
    this.searchDomain =
      this.route.snapshot.queryParamMap.get('sd') ||
      SearchDomain.ALL_PUBLIC;
    this.searchInclude =
      this.route.snapshot.queryParamMap.get('include') || 'all';

    // Read persisted type filter from URL
    const typeParam = this.route.snapshot.queryParamMap.get('type') as
      | 'all'
      | 'bookmark'
      | 'note';
    this.typeFilter$.next(typeParam || 'all');

    // Remap legacy domains to unified domains
    if (this.searchDomain === SearchDomain.MY_SNIPPETS) {
      this.searchDomain = SearchDomain.MY_NOTES;
    } else if (this.searchDomain === SearchDomain.PUBLIC_SNIPPETS) {
      this.searchDomain = SearchDomain.PUBLIC_NOTES;
    }

    // Remap old personal domains to all-mine with type filter
    if (
      this.searchDomain === SearchDomain.MY_BOOKMARKS ||
      this.searchDomain === SearchDomain.MY_NOTES
    ) {
      const mappedType =
        this.searchDomain === SearchDomain.MY_BOOKMARKS ? 'bookmark' : 'note';
      if (!typeParam) {
        this.typeFilter$.next(mappedType);
      }
      this.searchDomain = SearchDomain.ALL_MINE;
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { sd: SearchDomain.ALL_MINE, type: mappedType },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }

    // Remap old public domains to all-public with type filter
    if (
      this.searchDomain === SearchDomain.PUBLIC_BOOKMARKS ||
      this.searchDomain === SearchDomain.PUBLIC_NOTES
    ) {
      const mappedType =
        this.searchDomain === SearchDomain.PUBLIC_BOOKMARKS ? 'bookmark' : 'note';
      if (!typeParam) {
        this.typeFilter$.next(mappedType);
      }
      this.searchDomain = SearchDomain.ALL_PUBLIC;
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { sd: SearchDomain.ALL_PUBLIC, type: mappedType },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }

    this.initSelectedTabIndex(this.searchDomain);

    this.searchNotificationService.updateSearchBar({
      searchText: this.searchText,
      searchDomain: this.searchDomain,
    });

    this.initPageNavigation();

    const isLoggedIn = this.keycloakService.isLoggedIn();
    if (isLoggedIn) {
      if (isLoggedIn) {
        this.userIsLoggedIn = true;
        this.userInfoStore.getUserInfoOidc$().subscribe((userInfo) => {
          this.userData$ = this.userDataStore.getUserData$();
          this.userId = userInfo.sub;

          this.searchResults(
            this.searchText,
            this.searchDomain,
            this.searchInclude
          );
        });
      } else {
        this.searchResults(
          this.searchText,
          this.searchDomain === SearchDomain.ALL_MINE
            ? SearchDomain.ALL_PUBLIC
            : this.searchDomain,
          this.searchInclude
        );
      }
    }

    this.searchTriggeredSubscription =
      this.searchNotificationService.searchTriggeredSource$.subscribe(
        (searchData) => {
          this.initSelectedTabIndex(searchData.searchDomain);
          this.searchResults(
            searchData.searchText,
            searchData.searchDomain,
            'all'
          );
        }
      );
  }

  private initPageNavigation() {
    const page = this.route.snapshot.queryParamMap.get('page');
    if (page) {
      this.currentPage = parseInt(page, 0);
    } else {
      this.currentPage = 1;
    }
  }

  private initSelectedTabIndex(searchDomain: string) {
    switch (searchDomain) {
      case SearchDomain.ALL_MINE:
      case SearchDomain.MY_BOOKMARKS:
      case SearchDomain.MY_NOTES: {
        this.selectedTabIndex = 0;
        break;
      }
      case SearchDomain.ALL_PUBLIC:
      case SearchDomain.PUBLIC_BOOKMARKS:
      case SearchDomain.PUBLIC_NOTES: {
        this.selectedTabIndex = 1;
        break;
      }
      default: {
        this.selectedTabIndex = 1;
      }
    }
  }

  private searchResults(
    searchText: string,
    searchDomain: string,
    searchInclude: string
  ) {
    this.searchDomain = searchDomain;
    this.searchText = searchText;
    switch (searchDomain) {
      case SearchDomain.ALL_MINE: {
        this.searchResults$ = this.personalSearchService.getSearchResults(
          this.userId,
          this.searchText,
          environment.PAGINATION_PAGE_SIZE,
          this.currentPage,
          searchInclude
        );
        break;
      }
      case SearchDomain.ALL_PUBLIC: {
        this.searchResults$ = this.publicSearchService.getSearchResults(
          searchText,
          environment.PAGINATION_PAGE_SIZE,
          this.currentPage,
          searchInclude
        );
        break;
      }
    }
    this.filteredSearchResults$ = combineLatest([
      this.searchResults$,
      this.typeFilter$,
    ]).pipe(
      map(([results, filter]) => {
        if (filter === 'all') {
          return results as (Bookmark | Note)[];
        }
        return (results as (Bookmark | Note)[]).filter(
          (r) => r.type === filter
        );
      })
    );
    this.searchResults$.subscribe((results) => {
      if (results && results.length > 0) {
        this.saveRecentSearch(searchText, searchDomain);
      }
    });
  }

  private saveRecentSearch(searchText: string, searchDomain) {
    if (this.userIsLoggedIn) {
      this.userDataStore.saveRecentSearch(searchText, searchDomain);
    }
  }

  tryAllMine(searchInclude: string) {
    if (this.userIsLoggedIn) {
      this.selectedTabIndex = 0;
      this.searchInclude = searchInclude;
      this.router.navigate(['.'], {
        relativeTo: this.route,
        queryParams: {
          q: this.searchText,
          sd: SearchDomain.ALL_MINE,
          include: searchInclude,
        },
      });
    } else {
      const dialogConfig = this.loginDialogHelperService.loginDialogConfig(
        'You need to be logged in to search through personal bookmarks and notes'
      );
      this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    }
  }

  tryAllPublic(searchInclude: string) {
    this.selectedTabIndex = 1;
    this.currentPage = 1;
    this.searchInclude = searchInclude;
    this.router.navigate(['.'], {
      relativeTo: this.route,
      queryParams: {
        q: this.searchText,
        sd: SearchDomain.ALL_PUBLIC,
        page: '1',
        include: searchInclude,
      },
    });
  }

  /**
   * Maps a tab index to its search domain.
   * Tabs: 0=Personal, 1=Public
   */
  private getSearchDomainForTabIndex(index: number): string {
    const domainMap = [SearchDomain.ALL_MINE, SearchDomain.ALL_PUBLIC];
    return domainMap[index] || '';
  }

  setTypeFilter(filter: 'all' | 'bookmark' | 'note'): void {
    this.typeFilter$.next(filter);

    // Update the URL to persist the filter without triggering a router navigation.
    // router.navigate() would destroy & re-create the component (shouldReuseRoute = false)
    // causing a redundant backend call — the results are already fetched and only need
    // client-side filtering via filteredSearchResults$.
    const params = new URLSearchParams(window.location.search);
    if (filter === 'all') {
      params.delete('type');
    } else {
      params.set('type', filter);
    }
    const queryString = params.toString();
    const path = window.location.pathname + (queryString ? '?' + queryString : '');
    this.location.replaceState(path);
  }

  tabSelectionChanged(event: MatTabChangeEvent) {
    // Determine which domain this tab index maps to.
    // If it matches the already-active domain, this is a spurious event — ignore it.
    const targetDomain = this.getSearchDomainForTabIndex(event.index);
    if (targetDomain === this.searchDomain) {
      return;
    }
    this.selectedTabIndex = event.index;
    switch (this.selectedTabIndex) {
      case 0: { this.tryAllMine('all'); break; }
      case 1: { this.tryAllPublic('all'); break; }
    }
  }

  ngOnDestroy(): void {
    this.searchTriggeredSubscription.unsubscribe();
  }
}
