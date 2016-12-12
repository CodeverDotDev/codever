
import { Component, Input } from '@angular/core';
import { Bookmark } from '../../model/bookmark';
import {ActivatedRoute, Params} from "@angular/router";
import {Location} from "@angular/common";
import {UserBookmarkStore} from "../store/UserBookmarkStore";

@Component({
  selector: 'my-bookmark-detail',
  templateUrl: './bookmark-detail.component.html',
  styleUrls: ['./bookmark-detail.component.scss']
})
export class BookmarkDetailComponent {

  bookmark: Bookmark;

  constructor(
    private userBookmarkStore: UserBookmarkStore,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.route.params.forEach((params: Params) => {
      let id = params['id'];
      this.bookmark = this.userBookmarkStore.getBookmark(id);
      this.bookmark.tagsLine = '';
      this.bookmark.tags.forEach(tag => {
        this.bookmark.tagsLine += tag + ",";
      });
      this.bookmark.tagsLine = this.bookmark.tagsLine.replace(/,\s*$/, ""); //remove last comma and trailing spaces
      console.log(this.bookmark);
    });
  }

  goBack(): void {
    this.location.back();
  }

  updateBookmark():void {
    this.bookmark.tags = this.bookmark.tagsLine.split(",");
    let obs = this.userBookmarkStore.updateBookmark(this.bookmark);

    obs.subscribe(
      res => {
        this.goBack();
      });
  }

}
