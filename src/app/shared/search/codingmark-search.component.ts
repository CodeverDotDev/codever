import {Observable, of as observableOf} from 'rxjs';

import {catchError, debounceTime, map, startWith, switchMap} from 'rxjs/operators';
import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import {Router} from '@angular/router';
import {BookmarkFilterService} from '../../core/filter.service';
import {Codingmark} from '../../core/model/codingmark';
import {List} from 'immutable';
import {languages} from '../language-options';
import {PublicCodingmarksStore} from '../../public/codingmark/store/public-codingmarks-store.service';
import {KeycloakService} from 'keycloak-angular';
import {UserService} from '../../core/user.service';
import {Search, UserData} from '../../core/model/user-data';
import {MatAutocompleteSelectedEvent} from '@angular/material';

@Component({
  selector: 'app-codingmark-search',
  templateUrl: './codingmark-search.component.html',
  styleUrls: ['./codingmark-search.component.scss']
})
export class CodingmarkSearchComponent implements OnInit, AfterViewInit {

  @Input()
  codingmarks: Observable<List<Codingmark>>;

  @Input()
  query: string;

  @Input()
  context: string;

  filteredBookmarks: Observable<Codingmark[]>;
  private filterBookmarksBySearchTerm: Codingmark[];

  searchControl = new FormControl();
  queryText: string;
  public showNotFound = false;
  public numberOfResultsFiltered: number;
  counter = 10;
  previousTerm: string;
  language = 'all';

  languages = languages;

  userIsLoggedIn = false;

  userData: UserData = {searches: []};
  autocompleteSearches = [];
  filteredSearches: Observable<any[]>;

  constructor(private router: Router,
              private bookmarkStore: PublicCodingmarksStore,
              private bookmarkFilterService: BookmarkFilterService,
              private keycloakService: KeycloakService,
              private userService: UserService) {
  }

  ngOnInit(): void {
    this.keycloakService.isLoggedIn().then(value => {
      this.userIsLoggedIn = value;
      this.keycloakService.loadUserProfile().then(keycloakProfile => {
        // this.userId = keycloakProfile.id;
        this.userData.userId = keycloakProfile.id;
        this.userService.getUserData(keycloakProfile.id).subscribe(data => {
            this.userData = data;
            this.userData.searches.forEach(search => this.autocompleteSearches.push(search.text));
            this.userData.searches = this.userData.searches.sort((a, b) => {
              const result: number = a.lastAccessedAt == null ? (b.lastAccessedAt == null ? 0 : 1)
                : b.lastAccessedAt == null ? -1 : a.lastAccessedAt < b.lastAccessedAt ? 1 : a.lastAccessedAt > b.lastAccessedAt ? -1 : 0;
              return result;
            });
          },
          error => {
          }
        );
      });
    });


    this.filteredBookmarks = this.searchControl.valueChanges.pipe(
      debounceTime(1500),
      // TODO - next line should be reactived when getting results via HTTP
      // .distinctUntilChanged()   ignore if next search term is same as previous
      switchMap(term => {
        // this.counter = 0; // we initialise the counter
        if (term) { // switch to new observable each time

          if (this.previousTerm !== term) {
            this.previousTerm = term;
            this.counter = 10;
          }

          this.queryText = term;
          this.filterBookmarksBySearchTerm = this.bookmarkFilterService.filterBookmarksBySearchTerm(term, this.language, this.codingmarks);
          this.numberOfResultsFiltered = this.filterBookmarksBySearchTerm.length;
          if (this.numberOfResultsFiltered > 0) {
            this.showNotFound = false;
            return observableOf(this.filterBookmarksBySearchTerm.slice(0, this.counter)); // get the first 10 results
          } else {
            this.showNotFound = true;
            return observableOf<Codingmark[]>([]);
          }
        } else {
          this.numberOfResultsFiltered = 0;
          // or the observable of empty codingmarks if no search term
          return observableOf<Codingmark[]>([]);
        }
      }),
      catchError(error => {
        console.log(error);
        return observableOf<Codingmark[]>([]);
      }), );


    this.filteredSearches = this.searchControl.valueChanges
      .pipe(
        startWith(null),
        map((searchText: string | null) => {
          return searchText ? this._filter(searchText) : this.autocompleteSearches.slice();
        })
      );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.autocompleteSearches.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
  }

  showMoreResults() {
    this.searchControl.setValue(this.queryText); // trigger this.searchControl.valueChanges
    this.counter += 10;
  }

  ngAfterViewInit(): void {
    if (this.query) {
      this.searchControl.setValue(this.query);
    }
  }

  /**
   *
   * @param codingmark
   */
  gotoCodingmarkDetail(codingmark: Codingmark): void {
    const link = ['/codingmarks', codingmark._id];
    this.router.navigate(link);
  }

  setQueryFromParentComponent(queryFromOutside: string) {
    this.searchControl.setValue(queryFromOutside);
  }

  onLanguageChange(newValue) {
    console.log('onLanguageChange' + newValue);
    this.language = newValue;
    this.searchControl.setValue(this.queryText);
  }

  onSaveClick() {
    const now = new Date();
    const newSearch: Search = {
      text: this.queryText,
      createdAt: now,
      lastAccessedAt: now
    }
    this.autocompleteSearches.push(this.queryText);
    this.userData.searches.push(newSearch);
    this.userService.updateUserData(this.userData).subscribe();
  }

  onSelectionChanged(event: MatAutocompleteSelectedEvent) {
    const selectedValue = event.option.value;
    // const index = this.userData.searches.findIndex((search: Search) => search.text.localeCompare(selectedValue));
    const index = this.userData.searches.findIndex((search: Search) => search.text === selectedValue);
    const updatedSearch: Search  = this.userData.searches.splice(index, 1)[0];
    updatedSearch.lastAccessedAt = new Date();
    this.userData.searches.unshift(updatedSearch);

    const indexInOptions = this.autocompleteSearches.indexOf(selectedValue);
    this.autocompleteSearches.splice(indexInOptions, 1);
    this.autocompleteSearches.unshift(selectedValue);


    this.userService.updateUserData(this.userData).subscribe();
  }

}
