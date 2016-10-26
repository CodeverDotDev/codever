import { Component, OnInit } from '@angular/core';
import { Router }            from '@angular/router';
import { Observable }        from 'rxjs';
import {FormControl} from "@angular/forms";
import {BookmarkSearchService} from "../bookmark-search.service";
import {Bookmark} from "../../bookmark";

@Component({
    selector: 'bookmark-search-formControl',
    template: `
      <div>
        <h2>Bookmark Search</h2>
        <input type="text" [formControl]="term">
        <ul>
          <li *ngFor="let item of items | async">{{item.name}}</li>
        </ul>
      </div>  
    `,
    providers: [BookmarkSearchService]
})
export class BookmarkSearchFormControlComponent implements OnInit {

    items: Observable<Bookmark[]>;
    term = new FormControl();

    constructor(
        private bookmarkSearchService: BookmarkSearchService,
        private router: Router) {}

    ngOnInit() {
      this.items = this.term.valueChanges
        .debounceTime(400)
        .distinctUntilChanged()
        .switchMap(term => this.bookmarkSearchService.search(term));
    }

    gotoDetail(bookmark: Bookmark): void {
        let link = ['/bookmarks', bookmark._id];
        this.router.navigate(link);
    }
}
