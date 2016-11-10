import { Component, OnInit } from '@angular/core';
import {Observable} from "rxjs";
import {Bookmark} from "../model/bookmark";
import {FormControl} from "@angular/forms";
import {BookmarkSearchService} from "../bookmark/search/bookmark-search.service";
import {Router} from "@angular/router";
import {NavbarSearchService} from "./NavbarSearchService";

@Component({
  selector: 'my-navigation-search',
  templateUrl: './navigation-search.component.html',
})
export class NavigationSearchComponent {

  items: Observable<Bookmark[]>;
  term = new FormControl();

  constructor(
    private bookmarkSearchService: BookmarkSearchService,
    private navbarSearchService:NavbarSearchService,
    private router: Router) {}

  ngOnInit() {
    this.items = this.term.valueChanges
      .debounceTime(400)
      .distinctUntilChanged()
      .switchMap(term => this.bookmarkSearchService.search(term));

    this.navbarSearchService.announceFoundResults(this.items);
    let link = ['/search-results'];
    this.router.navigate(link);
  }

  gotoDetail(bookmark: Bookmark): void {
    let link = ['/bookmarks', bookmark._id];
    this.router.navigate(link);
  }
}
