import {Component, OnInit} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {BookmarkSearchService} from "./bookmark-search.service";
import {Bookmark} from "../../model/bookmark";
import {BookmarkStore} from "../store/BookmarkStore";
import {FormControl} from "@angular/forms";
import {Router} from "@angular/router";
import {BookmarkFilterService} from "../../filter.service";

@Component({
    selector: 'bookmark-search',
    templateUrl: 'bookmark-search.component.html',
    styleUrls: [ 'bookmark-search.component.scss' ],
    providers: [BookmarkSearchService]
})
export class BookmarkSearchComponent implements OnInit {

    bookmarks: Observable<Bookmark[]>;
    term = new FormControl();

    constructor(private router: Router, private bookmarkStore: BookmarkStore, private bookmarkFilterService: BookmarkFilterService) {}

    ngOnInit(): void {
        this.bookmarks = this.term.valueChanges
            .debounceTime(600)        // wait for 300ms pause in events
            .distinctUntilChanged()   // ignore if next search term is same as previous
            .switchMap(term => term   // switch to new observable each time
                ? this.bookmarkFilterService.filterBookmarksBySearchTerm(term, this.bookmarkStore.getBookmarks())
                // or the observable of empty bookmarks if no search term
                : Observable.of<Bookmark[]>([]))
            .catch(error => {
                // TODO: real error handling
                console.log(error);
                return Observable.of<Bookmark[]>([]);
            });
    }

  /**
   *
   * @param bookmark
   */
  gotoDetail(bookmark: Bookmark): void {
    let link = ['/bookmarks', bookmark._id];
    this.router.navigate(link);
  }
}
