import {Component, OnInit, AfterViewInit, OnChanges, SimpleChanges} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {BookmarkSearchService} from "./bookmark-search.service";
import {BookmarkStore} from "../store/BookmarkStore";
import {FormControl} from "@angular/forms";
import {Router} from "@angular/router";
import {BookmarkFilterService} from "../../../core/filter.service";
import {Bookmark} from "../../../core/model/bookmark";
import {Input} from "@angular/core";
import {List} from "immutable";

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

  term = new FormControl();
  queryText: string;
  public showNotFound: boolean = false;
  constructor(private router: Router, private bookmarkStore: BookmarkStore, private bookmarkFilterService: BookmarkFilterService) {}

  ngOnInit(): void {

    this.filteredBookmarks = this.term.valueChanges
      .debounceTime(600)        // wait for 600ms pause in events
      .distinctUntilChanged()   // ignore if next search term is same as previous
      .switchMap(term => {
        if(term){// switch to new observable each time
          this.queryText = term;
          let filterBookmarksBySearchTerm:Bookmark[] = this.bookmarkFilterService.filterBookmarksBySearchTerm(term, this.bookmarks);
          if(filterBookmarksBySearchTerm.length > 0 ){
            this.showNotFound = false;
            return Observable.of(filterBookmarksBySearchTerm);
          } else {
            this.showNotFound = true;
            return Observable.of<Bookmark[]>([])
          }
        } else {
          // or the observable of empty bookmarks if no search term
          return Observable.of<Bookmark[]>([])
        }
      })
      .catch(error => {
        console.log(error);
        return Observable.of<Bookmark[]>([]);
      });


  }

  ngAfterViewInit(): void {
    if(this.query) {
      this.term.setValue(this.query);
    }
  }

  /**
   *
   * @param bookmark
   */
  gotoDetail(bookmark: Bookmark): void {
    let link = ['/bookmarks', bookmark._id];
    this.router.navigate(link);
  }

  setQueryFromParentComponent(queryFromOutside: string){
    this.term.setValue(queryFromOutside);
  }

}
