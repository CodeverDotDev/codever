import {Component, OnInit, AfterViewInit, OnChanges, SimpleChanges} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {BookmarkSearchService} from './bookmark-search.service';
import {BookmarkStore} from '../store/BookmarkStore';
import {FormControl} from '@angular/forms';
import {Router} from '@angular/router';
import {BookmarkFilterService} from '../../../core/filter.service';
import {Bookmark} from '../../../core/model/bookmark';
import {Input} from '@angular/core';
import {List} from 'immutable';

@Component({
    selector: 'bookmark-search',
    templateUrl: 'bookmark-search.component.html',
    styleUrls: [ 'bookmark-search.component.scss' ],
    providers: [BookmarkSearchService]
})
export class BookmarkSearchComponent implements OnInit, AfterViewInit {

  @Input()
  bookmarks: Observable<List<Bookmark>>;

  @Input()
  query: string;

  filteredBookmarks: Observable<Bookmark[]>;
  filterBookmarksBySearchTerm: Bookmark[];

  term = new FormControl();
  queryText: string;
  public showNotFound = false;
  public numberOfResultsFiltered: number;
  counter = 10;
  previousTerm: string;

  constructor(private router: Router, private bookmarkStore: BookmarkStore, private bookmarkFilterService: BookmarkFilterService) {}

  ngOnInit(): void {

    this.filteredBookmarks = this.term.valueChanges
      .debounceTime(800)        // wait for 800ms pause in events
      // TODO - next line should be reactived when getting results via HTTP
      // .distinctUntilChanged()   ignore if next search term is same as previous
      .switchMap(term => {
        // this.counter = 0; // we initialise the counter
        if (term) { // switch to new observable each time

          if (this.previousTerm !== term ) {
            this.previousTerm = term;
            this.counter = 10;
          }

          this.queryText = term;
          this.filterBookmarksBySearchTerm = this.bookmarkFilterService.filterBookmarksBySearchTerm(term, this.bookmarks);
          this.numberOfResultsFiltered = this.filterBookmarksBySearchTerm.length;
          if (this.numberOfResultsFiltered > 0 ) {
            this.showNotFound = false;
            return Observable.of(this.filterBookmarksBySearchTerm.slice(0, this.counter)); // get the first 10 results
          } else {
            this.showNotFound = true;
            return Observable.of<Bookmark[]>([]);
          }
        } else {
          // or the observable of empty bookmarks if no search term
          return Observable.of<Bookmark[]>([]);
        }
      })
      .catch(error => {
        console.log(error);
        return Observable.of<Bookmark[]>([]);
      });


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
   * @param bookmark
   */
  gotoDetail(bookmark: Bookmark): void {
    const link = ['/bookmarks', bookmark._id];
    this.router.navigate(link);
  }

  setQueryFromParentComponent(queryFromOutside: string) {
    this.term.setValue(queryFromOutside);
  }

}
