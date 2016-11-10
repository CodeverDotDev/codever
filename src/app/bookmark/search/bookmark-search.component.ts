import { Component, OnInit } from '@angular/core';
import { Router }            from '@angular/router';
import { Observable }        from 'rxjs/Observable';
import { Subject }           from 'rxjs/Subject';
import { BookmarkSearchService } from './bookmark-search.service';
import { Bookmark } from '../../model/bookmark';
import {BookmarkStore} from "../state/BookmarkStore";

@Component({
    selector: 'bookmark-search',
    templateUrl: 'bookmark-search.component.html',
    styleUrls: [ 'bookmark-search.component.scss' ],
    providers: [BookmarkSearchService]
})
export class BookmarkSearchComponent implements OnInit {

    bookmarks: Observable<Bookmark[]>;
    private searchTerms = new Subject<string>();

    constructor(
        private bookmarkSearchService: BookmarkSearchService,
        private bookmarkStore: BookmarkStore,
        private router: Router) {}

    // Push a search term into the observable stream.
    search(term: string): void {
        this.searchTerms.next(term);
    }

    ngOnInit(): void {
        this.bookmarks = this.searchTerms
            .debounceTime(300)        // wait for 300ms pause in events
            .distinctUntilChanged()   // ignore if next search term is same as previous
            .switchMap(term => term   // switch to new observable each time
                // return the http search observable
                ? this.bookmarkStore.filterBookmarksBySearchTerm('the')
                // or the observable of empty heroes if no search term
                : Observable.of<Bookmark[]>([]))
            .catch(error => {
                // TODO: real error handling
                console.log(error);
                return Observable.of<Bookmark[]>([]);
            });
    }

    gotoDetail(bookmark: Bookmark): void {
        let link = ['/bookmarks', bookmark._id];
        this.router.navigate(link);
    }
}
