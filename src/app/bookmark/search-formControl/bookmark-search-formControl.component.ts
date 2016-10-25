import { Component, OnInit } from '@angular/core';
import { Router }            from '@angular/router';
import { Observable }        from 'rxjs';
import { BookmarkSearchFormControlService } from './bookmark-search-formControl.service';
import { Bookmark } from '../bookmark';
import {FormControl} from "@angular/forms";

@Component({
    selector: 'bookmark-search-formControl',
    template: `
      <div>
        <h2>Bookmark Search</h2>
        <input type="text" [formControl]="term">
        <ul>
          <li>Mock Bookmark name</li>
          <li *ngFor="let item of items | async">{{item.name}}</li>
        </ul>
      </div>  
    `,
    providers: [BookmarkSearchFormControlService]
})
export class BookmarkSearchFormControlComponent implements OnInit {

    items: Observable<Bookmark[]>;
    term = new FormControl();

    constructor(
        private bookmarkSearchService: BookmarkSearchFormControlService,
        private router: Router) {}

    ngOnInit() {
      this.items = this.term.valueChanges
        .debounceTime(400)
        .distinctUntilChanged()
        .switchMap(term => this.bookmarkSearchService.search(term));
    }

  //switchMap((search): Observable<Array<MyModel>> => {

    gotoDetail(bookmark: Bookmark): void {
        let link = ['/bookmarks', bookmark._id];
        this.router.navigate(link);
    }
}
