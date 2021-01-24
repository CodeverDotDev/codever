import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { PublicBookmarksService } from '../public/bookmarks/public-bookmarks.service';
import { PersonalBookmarksService } from '../core/personal-bookmarks.service';
import { PersonalCodeletsService } from '../core/personal-codelets.service';
import { Observable } from 'rxjs';
import { Bookmark } from '../core/model/bookmark';
import { Codelet } from '../core/model/codelet';
import { SearchNotificationService } from '../core/search-notification.service';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakServiceWrapper } from '../core/keycloak-service-wrapper.service';
import { UserInfoStore } from '../core/user/user-info.store';
import { UserDataStore } from '../core/user/userdata.store';
import { Search, UserData } from '../core/model/user-data';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { PaginationNotificationService } from '../core/pagination-notification.service';
import { SearchDomain } from '../core/model/search-domain.enum';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { LoginDialogHelperService } from '../core/login-dialog-helper.service';
import { LoginRequiredDialogComponent } from '../shared/login-required-dialog/login-required-dialog.component';
import { PublicSnippetsService } from '../public/snippets/public-snippets.service';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnInit {

  searchText: string; // holds the value in the search box
  searchDomain: string;

  currentPage: number;
  callerPaginationSearchResults = 'search-results';
  // callerPaginationSearchResultsSnippets = 'search-results-snippets';

  userId: string;
  userIsLoggedIn = false;

  searchResults$: Observable<Bookmark[] | Codelet[]>;
  private userData$: Observable<UserData>;

  selectedTabIndex = 1; // default search in public bookmarks
  private searchInclude: string;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private publicBookmarksService: PublicBookmarksService,
              private publicSnippetsService: PublicSnippetsService,
              private personalBookmarksService: PersonalBookmarksService,
              private personalCodeletsService: PersonalCodeletsService,
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
        this.userInfoStore.getUserInfo$().subscribe(userInfo => {
          this.userData$ = this.userDataStore.getUserData$();
          this.userId = userInfo.sub;

          this.searchBookmarks(this.searchText, this.searchDomain, this.searchInclude);
        });
      } else {
        switch (this.searchDomain) {
          case SearchDomain.PUBLIC_BOOKMARKS: {
            this.searchBookmarks(this.searchText, SearchDomain.PUBLIC_BOOKMARKS, 'all');
            break;
          }
          case SearchDomain.PUBLIC_SNIPPETS: {
            this.searchBookmarks(this.searchText, SearchDomain.PUBLIC_SNIPPETS, 'all');
            break;
          }
        }
        this.searchPublicBookmarks_when_SearchText_but_No_SearchDomain();
      }
    });

    this.searchNotificationService.searchTriggeredSource$.subscribe(searchData => {
      if (searchData.searchDomain === SearchDomain.MY_BOOKMARKS
        || searchData.searchDomain === SearchDomain.MY_SNIPPETS) {
        this.selectedTabIndex = 0;
      } else {
        this.selectedTabIndex = 1;
      }
      this.searchBookmarks(searchData.searchText, searchData.searchDomain, 'all');
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
        this.searchBookmarks(this.searchText, this.searchDomain, 'all');
      }
    });
  }

  private initSelectedTabIndex(searchDomain: string) {
    if (searchDomain === SearchDomain.MY_BOOKMARKS || searchDomain === SearchDomain.MY_SNIPPETS) {
      this.selectedTabIndex = 0;
    } else {
      this.selectedTabIndex = 1;
    }
  }

  private searchPublicBookmarks_when_SearchText_but_No_SearchDomain() {
    if (this.searchText) {
      this.searchBookmarks(this.searchText, SearchDomain.PUBLIC_BOOKMARKS, 'all');
    }
  }

  private searchBookmarks(searchText: string, searchDomain: string, searchInclude: string) {
    this.searchDomain = searchDomain;
    this.searchText = searchText;
    this.saveRecenSearch(searchText, searchDomain);
    switch (searchDomain) {
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
        this.searchResults$ = this.personalCodeletsService.getFilteredPersonalCodelets(
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
  }

  private saveRecenSearch(searchText: string, searchDomain) {
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
            sd: SearchDomain.MY_SNIPPETS,
            include: searchInclude
          },
          queryParamsHandling: 'merge'
        }
      );
      this.searchBookmarks(this.searchText, SearchDomain.MY_SNIPPETS, searchInclude);
    } else {
      const dialogConfig = this.loginDialogHelperService.loginDialogConfig('You need to be logged in to search through personal codelets');
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
          sd: SearchDomain.PUBLIC_SNIPPETS,
          page: '1',
          include: searchInclude
        },
        queryParamsHandling: 'merge'
      }
    );
    this.searchBookmarks(this.searchText, SearchDomain.PUBLIC_SNIPPETS, searchInclude);
  }

  private tryPublicBookmarks(searchInclude: string) {
    this.selectedTabIndex = 1;
    this.currentPage = 1;
    this.searchInclude = searchInclude;
    this.router.navigate(['.'],
      {
        relativeTo: this.route,
        queryParams: {
          sd: SearchDomain.PUBLIC_BOOKMARKS,
          page: '1',
          include: searchInclude
        },
        queryParamsHandling: 'merge'
      }
    );
    this.searchBookmarks(this.searchText, SearchDomain.PUBLIC_BOOKMARKS, searchInclude);
  }

  private tryPersonalBookmarks(searchInclude) {
    if (this.userIsLoggedIn) {
      this.selectedTabIndex = 0;
      this.searchDomain = SearchDomain.MY_BOOKMARKS;
      this.currentPage = 1;
      this.searchInclude = searchInclude;
      this.router.navigate(['.'],
        {
          relativeTo: this.route,
          queryParams: {
            sd: SearchDomain.MY_BOOKMARKS,
            page: '1',
            include: searchInclude
          },
          queryParamsHandling: 'merge'
        }
      );
      this.searchBookmarks(this.searchText, SearchDomain.MY_BOOKMARKS, searchInclude);
    } else {
      const dialogConfig = this.loginDialogHelperService.loginDialogConfig('You need to be logged in to search through personal bookmarks');
      this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    }
  }

  tabSelectionChanged(event: MatTabChangeEvent) {
    this.selectedTabIndex = event.index;
    switch (this.selectedTabIndex) {
      case 0 : {
        if (this.userIsLoggedIn) {
          if (this.searchDomain === SearchDomain.PUBLIC_BOOKMARKS) {
            this.searchDomain = SearchDomain.MY_BOOKMARKS;
            this.tryPersonalBookmarks('all');
          }
          if (this.searchDomain === SearchDomain.PUBLIC_SNIPPETS) {
            this.searchDomain = SearchDomain.MY_SNIPPETS;
            this.tryMySnippets('all');
          }
        }
        break;
      }
      case 1 : {
        if (this.searchDomain === SearchDomain.MY_BOOKMARKS) {
          this.searchDomain = SearchDomain.PUBLIC_BOOKMARKS;
          this.tryPublicBookmarks('all');
        }
        if (this.searchDomain === SearchDomain.MY_SNIPPETS) {
          this.searchDomain = SearchDomain.PUBLIC_SNIPPETS
          this.tryPublicSnippets('all');
        }
        break;
      }
    }
  }

}
