import {Observable, of as observableOf} from 'rxjs';

import {catchError, debounceTime, switchMap} from 'rxjs/operators';
import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import {Router} from '@angular/router';
import {BookmarkFilterService} from '../../core/filter.service';
import {Codingmark} from '../../core/model/codingmark';
import {List} from 'immutable';
import {languages} from '../language-options';
import {PublicCodingmarksStore} from '../../public/codingmark/store/public-codingmarks-store.service';
import {KeycloakService} from 'keycloak-angular';
import {PersonalCodingmarksStore} from '../../core/store/personal-codingmarks-store.service';

@Component({
    selector: 'app-codingmark-search',
    templateUrl: './codingmark-search.component.html',
    styleUrls: [ './codingmark-search.component.scss' ]
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

  term = new FormControl();
  queryText: string;
  public showNotFound = false;
  public numberOfResultsFiltered: number;
  counter = 10;
  previousTerm: string;
  language = 'all';

  languages = languages;

  userIsLoggedIn = false;

  constructor(private router: Router,
              private bookmarkStore: PublicCodingmarksStore,
              private bookmarkFilterService: BookmarkFilterService,
              private keycloakService: KeycloakService) {}

  ngOnInit(): void {
    this.keycloakService.isLoggedIn().then(value => {
      this.userIsLoggedIn = value;
    });

    this.filteredBookmarks = this.term.valueChanges.pipe(
      debounceTime(1500),
      // TODO - next line should be reactived when getting results via HTTP
      // .distinctUntilChanged()   ignore if next search term is same as previous
      switchMap(term => {
        // this.counter = 0; // we initialise the counter
        if (term) { // switch to new observable each time

          if (this.previousTerm !== term ) {
            this.previousTerm = term;
            this.counter = 10;
          }

          this.queryText = term;
          this.filterBookmarksBySearchTerm = this.bookmarkFilterService.filterBookmarksBySearchTerm(term, this.language, this.codingmarks);
          this.numberOfResultsFiltered = this.filterBookmarksBySearchTerm.length;
          if (this.numberOfResultsFiltered > 0 ) {
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


  }

  showMoreResults() {
    this.term.setValue(this.queryText); // trigger this.term.valueChanges
    this.counter += 10;
  }

  ngAfterViewInit(): void {
    if (this.query) {
      this.term.setValue(this.query);
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
    this.term.setValue(queryFromOutside);
  }

  onLanguageChange(newValue) {
    console.log('onLanguageChange' + newValue);
    this.language = newValue;
    this.term.setValue(this.queryText);
  }

  onSaveClick() {
    console.log('Saving search ' + this.queryText);
  }
}
