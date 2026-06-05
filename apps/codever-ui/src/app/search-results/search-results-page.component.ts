import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { PublicBookmarksService } from '../public/bookmarks/public-bookmarks.service';
import { PersonalBookmarksService } from '../core/personal-bookmarks.service';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Bookmark } from '../core/model/bookmark';
import { SearchNotificationService } from '../core/search-notification.service';
import { KeycloakService } from 'keycloak-angular';
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
import { PersonalNotesService } from '../core/personal-notes.service';
import { Note } from '../core/model/note';
import { PublicNotesService } from '../public/notes/public-notes.service';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results-page.component.html',
  styleUrls: ['./search-results-page.component.scss'],
})
export class SearchResultsPageComponent implements OnInit, OnDestroy {
  searchText: string; // holds the value in the search box
  searchDomain: string;

  currentPage: number;
  callerPaginationSearchResults = 'search-results';

  userId: string;
  userIsLoggedIn = false;

  searchResults$: Observable<
    Bookmark[] | Note[] | (Bookmark | Note)[]
  >;
  private userData$: Observable<UserData>;

  selectedTabIndex = 1; // default search in personal data
  private searchInclude: string;

  typeFilter$ = new BehaviorSubject<'all' | 'bookmark' | 'note'>('all');
  filteredSearchResults$: Observable<(Bookmark | Note)[]>;

  searchTriggeredSubscription: any;

  searchInOtherCategoriesTip =
    'You can also try looking in other sections 👆👆 OR find elsewhere 👇👇';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private publicBookmarksService: PublicBookmarksService,
    private publicNotesService: PublicNotesService,
    private personalSearchService: PersonalSearchService,
    private personalBookmarksService: PersonalBookmarksService,
    private personalNotesService: PersonalNotesService,
    private keycloakService: KeycloakService,
    private keycloakServiceWrapper: KeycloakServiceWrapper,
    private userInfoStore: UserInfoStore,
    private userDataStore: UserDataStore,
    private searchNotificationService: SearchNotificationService,
    private loginDialogHelperService: LoginDialogHelperService,
    public loginDialog: MatDialog
  ) {}

  ngOnInit() {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.searchText = this.route.snapshot.queryParamMap.get('q');
    this.searchDomain =
      this.route.snapshot.queryParamMap.get('sd') ||
      SearchDomain.PUBLIC_BOOKMARKS;
    this.searchInclude =
      this.route.snapshot.queryParamMap.get('include') || 'all';

    // Read persisted type filter from URL
    const typeParam = this.route.snapshot.queryParamMap.get('type') as
      | 'all'
      | 'bookmark'
      | 'note';
    this.typeFilter$.next(typeParam || 'all');

    // Remap legacy snippet domains to notes
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
        queryParams: { sd: 'all-mine', type: mappedType },
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

    this.keycloakService.isLoggedIn().then((isLoggedIn) => {
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
        switch (this.searchDomain) {
          case SearchDomain.PUBLIC_BOOKMARKS: {
            this.searchResults(
              this.searchText,
              SearchDomain.PUBLIC_BOOKMARKS,
              'all'
            );
            break;
          }
          case SearchDomain.PUBLIC_NOTES: {
            this.searchResults(
              this.searchText,
              SearchDomain.PUBLIC_NOTES,
              'all'
            );
            break;
          }
          default: {
            this.searchPublicBookmarks_when_SearchText_but_No_SearchDomain();
          }
        }
      }
    });

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
    // No need to subscribe to pageNavigationClicked$ here.
    // PageNavigationBarComponent.navigate() already calls syncPageQueryParam(),
    // which updates the URL ?page= param. Because shouldReuseRoute returns false,
    // the route change destroys and re-creates this component, so ngOnInit()
    // picks up the new page from the query params and triggers the search.
    // Subscribing here caused a DUPLICATE API call: one from this handler and
    // another from the component re-initialisation after the route change.
  }

  private initSelectedTabIndex(searchDomain: string) {
    switch (searchDomain) {
      case SearchDomain.ALL_MINE:
      case SearchDomain.MY_BOOKMARKS:
      case SearchDomain.MY_NOTES: {
        this.selectedTabIndex = 0;
        break;
      }
      case SearchDomain.PUBLIC_BOOKMARKS: {
        this.selectedTabIndex = 1;
        break;
      }
      case SearchDomain.PUBLIC_NOTES: {
        this.selectedTabIndex = 2;
        break;
      }
      default: {
        this.selectedTabIndex = 1;
      }
    }
  }

  private searchPublicBookmarks_when_SearchText_but_No_SearchDomain() {
    if (this.searchText) {
      this.searchResults(this.searchText, SearchDomain.PUBLIC_BOOKMARKS, 'all');
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
      case SearchDomain.MY_BOOKMARKS: {
        this.searchResults$ =
          this.personalBookmarksService.getFilteredPersonalBookmarks(
            this.searchText,
            environment.PAGINATION_PAGE_SIZE,
            this.currentPage,
            this.userId,
            searchInclude
          );
        break;
      }
      case SearchDomain.MY_NOTES: {
        this.searchResults$ =
          this.personalNotesService.getFilteredPersonalNotes(
            searchText,
            environment.PAGINATION_PAGE_SIZE,
            this.currentPage,
            this.userId,
            searchInclude
          );
        break;
      }
      case SearchDomain.PUBLIC_BOOKMARKS: {
        this.searchResults$ = this.publicBookmarksService.searchPublicBookmarks(
          searchText,
          environment.PAGINATION_PAGE_SIZE,
          this.currentPage,
          'relevant',
          searchInclude
        );
        break;
      }
      case SearchDomain.PUBLIC_NOTES: {
        this.searchResults$ = this.publicNotesService.searchPublicNotes(
          searchText,
          environment.PAGINATION_PAGE_SIZE,
          this.currentPage,
          'relevant',
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

  private tryMyNotes(searchInclude: string) {
    if (this.userIsLoggedIn) {
      this.selectedTabIndex = 2;
      this.searchInclude = searchInclude;
      this.router.navigate(['.'], {
        relativeTo: this.route,
        queryParams: {
          q: this.searchText,
          sd: SearchDomain.MY_NOTES,
          include: searchInclude,
        },
      });
    } else {
      const dialogConfig = this.loginDialogHelperService.loginDialogConfig(
        'You need to be logged in to search through your notes'
      );
      this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
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
        'You need to be logged in to search through personal bookmarks'
      );
      this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    }
  }

  tryPublicNotes(searchInclude: string) {
    this.selectedTabIndex = 2;
    this.currentPage = 1;
    this.searchInclude = searchInclude;
    this.router.navigate(['.'], {
      relativeTo: this.route,
      queryParams: {
        q: this.searchText,
        sd: SearchDomain.PUBLIC_NOTES,
        page: '1',
        include: searchInclude,
      },
    });
  }

  private tryPublicBookmarks(searchInclude: string) {
    this.selectedTabIndex = 1;
    this.currentPage = 1;
    this.searchInclude = searchInclude;
    this.router.navigate(['.'], {
      relativeTo: this.route,
      queryParams: {
        q: this.searchText,
        sd: SearchDomain.PUBLIC_BOOKMARKS,
        page: '1',
        include: searchInclude,
      },
    });
  }

  private tryMyBookmarks(searchInclude) {
    if (this.userIsLoggedIn) {
      this.selectedTabIndex = 1;
      this.searchDomain = SearchDomain.MY_BOOKMARKS;
      this.currentPage = 1;
      this.searchInclude = searchInclude;
      this.router.navigate(['.'], {
        relativeTo: this.route,
        queryParams: {
          q: this.searchText,
          sd: SearchDomain.MY_BOOKMARKS,
          page: '1',
          include: searchInclude,
        },
      });
    } else {
      const dialogConfig = this.loginDialogHelperService.loginDialogConfig(
        'You need to be logged in to search through personal bookmarks'
      );
      this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    }
  }

  /**
   * Maps a tab index to its search domain.
   * Tabs: 0=All Mine, 1=My Bookmarks, 2=My Notes, 3=Public Bookmarks, 4=Public Notes
   */
  private getSearchDomainForTabIndex(index: number): string {
    const map = [SearchDomain.ALL_MINE, SearchDomain.PUBLIC_BOOKMARKS, SearchDomain.PUBLIC_NOTES];
    return map[index] || '';
  }

  setTypeFilter(filter: 'all' | 'bookmark' | 'note'): void {
    this.typeFilter$.next(filter);
    this.router.navigate(['.'], {
      relativeTo: this.route,
      queryParams: { type: filter === 'all' ? undefined : filter },
      queryParamsHandling: 'merge',
    });
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
      case 1: { this.tryPublicBookmarks('all'); break; }
      case 2: { this.tryPublicNotes('all'); break; }
    }
  }

  ngOnDestroy(): void {
    this.searchTriggeredSubscription.unsubscribe();
  }
}
