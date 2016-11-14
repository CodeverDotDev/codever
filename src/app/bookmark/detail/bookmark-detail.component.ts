
import { Component, Input } from '@angular/core';
import { Bookmark } from '../../model/bookmark';
import {ActivatedRoute, Params} from "@angular/router";
import {Location} from "@angular/common";
import {BookmarkStore} from "../store/BookmarkStore";

@Component({
  selector: 'my-bookmark-detail',
  templateUrl: './bookmark-detail.component.html',
  styleUrls: ['./bookmark-detail.component.scss']
})
export class BookmarkDetailComponent {

  bookmark: Bookmark;

  constructor(
    private bookmarkStore: BookmarkStore,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.route.params.forEach((params: Params) => {
      let id = params['id'];
      this.bookmark = this.bookmarkStore.getBookmark(id);
    });
  }

  goBack(): void {
    this.location.back();
  }

  updateBookmark():void {
    let obs = this.bookmarkStore.updateBookmark(this.bookmark)

    obs.subscribe(
      res => {
        this.goBack();
      });
  }

}
