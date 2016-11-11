import { Component, OnInit } from '@angular/core';
import { Router }            from '@angular/router';
import { Observable }        from 'rxjs/Observable';
import { Subject }           from 'rxjs/Subject';
import { BookmarkSearchService } from './bookmark-search.service';
import { Bookmark } from '../../model/bookmark';
import {BookmarkStore} from "../state/BookmarkStore";
import {FormControl} from "@angular/forms";

@Component({
    selector: 'bookmark-search',
    templateUrl: 'bookmark-search.component.html',
    styleUrls: [ 'bookmark-search.component.scss' ],
    providers: [BookmarkSearchService]
})
export class BookmarkSearchComponent implements OnInit {

    bookmarks: Observable<Bookmark[]>;
    //private searchTerms = new Subject<string>();
    term = new FormControl();

    constructor(
        private bookmarkSearchService: BookmarkSearchService,
        private bookmarkStore: BookmarkStore,
        private router: Router) {}

    ngOnInit(): void {
        this.bookmarks = this.term.valueChanges
            .debounceTime(400)        // wait for 300ms pause in events
            .distinctUntilChanged()   // ignore if next search term is same as previous
            .switchMap(term => term   // switch to new observable each time
                // return the http search observable
                ? this.bookmarkStore.filterBookmarksBySearchTerm(term)
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
