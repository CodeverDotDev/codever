
import { Component, Input } from '@angular/core';
import { Bookmark } from '../bookmark';
import {BookmarkService} from "../bookmark.service";
import {ActivatedRoute, Params} from "@angular/router";
import {Location} from "@angular/common";

@Component({
  selector: 'my-bookmark-detail',
  templateUrl: './bookmark-detail.component.html',
  styleUrls: ['./bookmark-detail.component.scss']
})
export class BookmarkDetailComponent {

  @Input()
  bookmark: Bookmark;

  constructor(
    private bookmarkService: BookmarkService,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.route.params.forEach((params: Params) => {
      let id = params['id'];
      this.bookmarkService.getBookmark(id)
        .then(bookmark => this.bookmark = bookmark);
    });
  }

  goBack(): void {
    this.location.back();
  }

  save(): void {
    this.bookmarkService.update(this.bookmark)
      .then(() => this.goBack());
  }

}
