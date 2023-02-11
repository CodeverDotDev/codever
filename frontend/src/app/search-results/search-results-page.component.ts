import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { PublicBookmarksService } from '../public/bookmarks/public-bookmarks.service';
import { PersonalBookmarksService } from '../core/personal-bookmarks.service';
import { PersonalSnippetsService } from '../core/personal-snippets.service';
import { Observable } from 'rxjs';
import { Bookmark } from '../core/model/bookmark';
import { Snippet } from '../core/model/snippet';
import { SearchNotificationService } from '../core/search-notification.service';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakServiceWrapper } from '../core/keycloak-service-wrapper.service';
import { UserInfoStore } from '../core/user/user-info.store';
import { UserDataStore } from '../core/user/userdata.store';
import { UserData } from '../core/model/user-data';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { PaginationNotificationService } from '../core/pagination-notification.service';
import { SearchDomain } from '../core/model/search-domain.enum';
import { MatDialog } from '@angular/material/dialog';
import { LoginDialogHelperService } from '../core/login-dialog-helper.service';
import { LoginRequiredDialogComponent } from '../shared/dialog/login-required-dialog/login-required-dialog.component';
import { PublicSnippetsService } from '../public/snippets/public-snippets.service';
import { PersonalSearchService } from '../core/personal-search.service';
import { PersonalNotesService } from '../core/personal-notes.service';
import { Note } from '../core/model/note';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results-page.component.html',
  styleUrls: ['./search-results-page.component.scss']
})
export class SearchResultsPageComponent implements OnInit, OnDestroy {

  searchText: string; // holds the value in the search box
  searchDomain: string;

  currentPage: number;
  callerPaginationSearchResults = 'search-results';

  userId: string;
  userIsLoggedIn = false;

  searchResults$: Observable<Bookmark[] | Snippet[] | Note[] | (Bookmark | Snippet | Note)[]>;
  private userData$: Observable<UserData>;

  selectedTabIndex = 4; // default search in public bookmarks
  private searchInclude: string;

  searchTriggeredSubscription: any;

  searchInOtherCategoriesTip = 'You can also try looking in other sections 👆👆 OR find elsewhere 👇👇';

  constructor(private route: ActivatedRoute,
              private router: Router,
              private publicBookmarksService: PublicBookmarksService,
              private publicSnippetsService: PublicSnippetsService,
              private personalSearchService: PersonalSearchService,
              private personalBookmarksService: PersonalBookmarksService,
              private personalSnippetsService: PersonalSnippetsService,
              private personalNotesService: PersonalNotesService,
              private keycloakService: KeycloakService,
              private keycloakServiceWrapper: KeycloakServiceWrapper,
              private userInfoStore: UserInfoStore,
              private userDataStore: UserDataStore,
              private searchNotificationService: SearchNotificationService,
              private paginationNotificationService: PaginationNotificationService,
              private loginDialogHelperService: LoginDialogHelperService,
              public loginDialog: MatDialog) {
  }

  ngOnInit() {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.searchText = this.route.snapshot.queryParamMap.get('q');
    this.searchDomain = this.route.snapshot.queryParamMap.get('sd') || SearchDomain.PUBLIC_BOOKMARKS;
    this.searchInclude = this.route.snapshot.queryParamMap.get('include') || 'all';
    this.searchNotificationService.updateSearchBar({
      searchText: this.searchText,
      searchDomain: this.searchDomain
    });

    this.initPageNavigation();

    this.initSelectedTabIndex(this.searchDomain);

    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.userIsLoggedIn = true;
        this.userInfoStore.getUserInfoOidc$().subscribe(userInfo => {
          this.userData$ = this.userDataStore.getUserData$();
          this.userId = userInfo.sub;

          this.searchResults(this.searchText, this.searchDomain, this.searchInclude);
        });
      } else {
        switch (this.searchDomain) {
          case SearchDomain.PUBLIC_BOOKMARKS: {
            this.searchResults(this.searchText, SearchDomain.PUBLIC_BOOKMARKS, 'all');
            break;
          }
          case SearchDomain.PUBLIC_SNIPPETS: {
            this.searchResults(this.searchText, SearchDomain.PUBLIC_SNIPPETS, 'all');
            break;
          }
          default : {
            this.searchPublicBookmarks_when_SearchText_but_No_SearchDomain();
          }
        }
      }
    });

    this.searchTriggeredSubscription = this.searchNotificationService.searchTriggeredSource$.subscribe(searchData => {
      switch (this.searchDomain) {
        case SearchDomain.ALL_MINE: {
          this.selectedTabIndex = 0;
          break;
        }
        case SearchDomain.MY_BOOKMARKS: {
          this.selectedTabIndex = 1;
          break;
        }
        case SearchDomain.MY_SNIPPETS: {
          this.selectedTabIndex = 2;
          break;
        }
        case SearchDomain.MY_NOTES: {
          this.selectedTabIndex = 3;
          break;
        }
        case SearchDomain.PUBLIC_BOOKMARKS: {
          this.selectedTabIndex = 4;
          break;
        }
        case SearchDomain.PUBLIC_SNIPPETS: {
          this.selectedTabIndex = 5;
          break;
        }
        default : {
          this.selectedTabIndex = 4;
        }
      }

      this.searchResults(searchData.searchText, searchData.searchDomain, 'all');
    });
  }

  private initPageNavigation() {
    const page = this.route.snapshot.queryParamMap.get('page');
    if (page) {
      this.currentPage = parseInt(page, 0);
    } else {
      this.currentPage = 1;
    }
    this.paginationNotificationService.pageNavigationClicked$.subscribe(paginationAction => {
      if (paginationAction.caller === this.callerPaginationSearchResults) {
        this.currentPage = paginationAction.page;
        this.searchResults(this.searchText, this.searchDomain, 'all');
      }
    });
  }

  private initSelectedTabIndex(searchDomain: string) {
    switch (searchDomain) {
      case SearchDomain.ALL_MINE : {
        this.selectedTabIndex = 0;
        break;
      }
      case SearchDomain.MY_BOOKMARKS : {
        this.selectedTabIndex = 1;
        break;
      }
      case SearchDomain.MY_SNIPPETS : {
        this.selectedTabIndex = 2;
        break;
      }
      case SearchDomain.MY_NOTES : {
        this.selectedTabIndex = 3;
        break;
      }
      case SearchDomain.PUBLIC_BOOKMARKS : {
        this.selectedTabIndex = 4;
        break
      }
      case SearchDomain.PUBLIC_SNIPPETS : {
        this.selectedTabIndex = 5;
        break
      }
    }
  }

  private searchPublicBookmarks_when_SearchText_but_No_SearchDomain() {
    if (this.searchText) {
      this.searchResults(this.searchText, SearchDomain.PUBLIC_BOOKMARKS, 'all');
    }
  }

  private searchResults(searchText: string, searchDomain: string, searchInclude: string) {
    this.searchDomain = searchDomain;
    this.searchText = searchText;
    switch (searchDomain) {
      case SearchDomain.ALL_MINE : {
        this.searchResults$ = this.personalSearchService.getSearchResults(
          this.userId,
          this.searchText,
          environment.PAGINATION_PAGE_SIZE,
          this.currentPage,
          searchInclude);
        break;
      }
      case SearchDomain.MY_BOOKMARKS : {
        this.searchResults$ = this.personalBookmarksService.getFilteredPersonalBookmarks(
          this.searchText,
          environment.PAGINATION_PAGE_SIZE,
          this.currentPage,
          this.userId,
          searchInclude);
        break;
      }
      case SearchDomain.MY_SNIPPETS : {
        this.searchResults$ = this.personalSnippetsService.getFilteredPersonalSnippets(
          searchText,
          environment.PAGINATION_PAGE_SIZE,
          this.currentPage,
          this.userId,
          searchInclude);
        break;
      }
      case SearchDomain.MY_NOTES : {
        this.searchResults$ = this.personalNotesService.getFilteredPersonalNotes(
          searchText,
          environment.PAGINATION_PAGE_SIZE,
          this.currentPage,
          this.userId,
          searchInclude);
        break;
      }
      case SearchDomain.PUBLIC_BOOKMARKS : {
        this.searchResults$ = this.publicBookmarksService.searchPublicBookmarks(
          searchText,
          environment.PAGINATION_PAGE_SIZE,
          this.currentPage,
          'relevant',
          searchInclude
        );
        break;
      }
      case SearchDomain.PUBLIC_SNIPPETS : {
        this.searchResults$ = this.publicSnippetsService.searchPublicSnippets(
          searchText,
          environment.PAGINATION_PAGE_SIZE,
          this.currentPage,
          'relevant',
          searchInclude
        );
        break;
      }
    }
    this.searchResults$.subscribe(results => {
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

  private tryMySnippets(searchInclude: string) {
    if (this.userIsLoggedIn) {
      this.selectedTabIndex = 0;
      this.searchInclude = searchInclude;
      this.router.navigate(['.'],
        {
          relativeTo: this.route,
          queryParams: {
            q: this.searchText,
            sd: SearchDomain.MY_SNIPPETS,
            include: searchInclude
          },
        }
      );
    } else {
      const dialogConfig = this.loginDialogHelperService.loginDialogConfig('You need to be logged in to search through personal snippets');
      this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    }

  }

  private tryMyNotes(searchInclude: string) {
    if (this.userIsLoggedIn) {
      this.selectedTabIndex = 0;
      this.searchInclude = searchInclude;
      this.router.navigate(['.'],
        {
          relativeTo: this.route,
          queryParams: {
            q: this.searchText,
            sd: SearchDomain.MY_NOTES,
            include: searchInclude
          },
        }
      );
    } else {
      const dialogConfig = this.loginDialogHelperService.loginDialogConfig('You need to be logged in to search through your notes');
      this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    }

  }

  tryAllMine(searchInclude: string) {
    if (this.userIsLoggedIn) {
      this.selectedTabIndex = 0;
      this.searchInclude = searchInclude;
      this.router.navigate(['.'],
        {
          relativeTo: this.route,
          queryParams: {
            q: this.searchText,
            sd: SearchDomain.ALL_MINE,
            include: searchInclude
          },
        }
      );
    } else {
      const dialogConfig = this.loginDialogHelperService.loginDialogConfig('You need to be logged in to search through personal snippets');
      this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    }

  }

  private tryPublicSnippets(searchInclude: string) {
    this.selectedTabIndex = 1;
    this.currentPage = 1;
    this.searchInclude = searchInclude;
    this.router.navigate(['.'],
      {
        relativeTo: this.route,
        queryParams: {
          q: this.searchText,
          sd: SearchDomain.PUBLIC_SNIPPETS,
          page: '1',
          include: searchInclude
        },
      }
    );
  }

  private tryPublicBookmarks(searchInclude: string) {
    this.selectedTabIndex = 1;
    this.currentPage = 1;
    this.searchInclude = searchInclude;
    this.router.navigate(['.'],
      {
        relativeTo: this.route,
        queryParams: {
          q: this.searchText,
          sd: SearchDomain.PUBLIC_BOOKMARKS,
          page: '1',
          include: searchInclude
        },
      }
    );
  }

  private tryMyBookmarks(searchInclude) {
    if (this.userIsLoggedIn) {
      this.selectedTabIndex = 0;
      this.searchDomain = SearchDomain.MY_BOOKMARKS;
      this.currentPage = 1;
      this.searchInclude = searchInclude;
      this.router.navigate(['.'],
        {
          relativeTo: this.route,
          queryParams: {
            q: this.searchText,
            sd: SearchDomain.MY_BOOKMARKS,
            page: '1',
            include: searchInclude
          },
        }
      );
    } else {
      const dialogConfig = this.loginDialogHelperService.loginDialogConfig('You need to be logged in to search through personal bookmarks');
      this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    }
  }

  tabSelectionChanged(event: MatTabChangeEvent) {
    this.selectedTabIndex = event.index;
    switch (this.selectedTabIndex) {
      case 0 : {
        this.tryAllMine('all');
        break;
      }
      case 1 : {
        this.tryMyBookmarks('all');
        break;
      }
      case 2 : {
        this.tryMySnippets('all');
        break;
      }
      case 3 : {
        this.tryMyNotes('all');
        break;
      }
      case 4 : {
        this.tryPublicBookmarks('all');
        break;
      }
      case 5 : {
        this.tryPublicSnippets('all');
        break;
      }
    }
  }

  ngOnDestroy(): void {
    this.searchTriggeredSubscription.unsubscribe();
  }

}
