import {Component, OnInit, NgZone} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {Bookmark} from "../../model/bookmark";
import {FormControl} from "@angular/forms";
import {BookmarkFilterService} from "../../filter.service";
import {UserBookmarkStore} from "../store/UserBookmarkStore";

@Component({
    selector: 'personal-bookmark-search',
    templateUrl: 'personal-bookmark-search.component.html',
    styleUrls: [ 'personal-bookmark-search.component.scss' ]
})
export class PersonalBookmarkSearchComponent implements OnInit {

    bookmarks: Observable<Bookmark[]>;
    term = new FormControl();

    constructor(
      private zone:NgZone,
      private userBookmarkStore: UserBookmarkStore,
      private bookmarkFilterService: BookmarkFilterService) {}

    ngOnInit(): void {
        this.bookmarks = this.term.valueChanges
            .debounceTime(400)        // wait for 300ms pause in events
            .distinctUntilChanged()   // ignore if next search term is same as previous
            .switchMap(term => term   // switch to new observable each time
                // return the http search observable
                ? Observable.of(this.bookmarkFilterService.filterBookmarksBySearchTerm(term, this.userBookmarkStore.getBookmarksValue()))
                // or the observable of empty heroes if no search term
                : Observable.of<Bookmark[]>([]))
            .catch(error => {
                // TODO: real error handling
                console.log(error);
                return Observable.of<Bookmark[]>([]);
            });
      this.zone.run(() => {
        console.log("ZONE RUN bookmark deleted");
      });
    }

}
