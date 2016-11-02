
import {Injectable} from "@angular/core";
import {BehaviorSubject} from "rxjs";
import {List} from 'immutable';
import {BookmarkService} from "../bookmark.service";
import {asObservable} from "./asObservable";

@Injectable()
export class BookmarkStore {

    private _bookmarks: BehaviorSubject<List<BookmarkStore>> = new BehaviorSubject(List([]))

    constructor(private bookmarkService: BookmarkService) {
        this.loadInitialData();
    }

    private loadInitialData() {
        this.bookmarkService.getBookmarks()
            .subscribe(
                res => {
                    this._bookmarks.next(List(res));
                },
                err => console.log("Error retrieving bookmarks")
            );
    }

    get bookmarks(){
        return asObservable(this._bookmarks);
    }
}

