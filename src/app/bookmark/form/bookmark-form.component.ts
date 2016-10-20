import { Component } from '@angular/core';
import {Bookmark} from "../bookmark";
import {BookmarkService} from "../bookmark.service";
import {Location} from "@angular/common";

@Component({
  selector: 'bookmark-form',
  templateUrl: 'bookmark-form.component.html',
  styleUrls: ['./bookmark-form.component.scss']
})
export class BookmarkFormComponent {

  model = new Bookmark('', '', '', [], '');

  submitted = false;
  active=true;

  constructor(
    private bookmarkService: BookmarkService,
    private location: Location
  ) {}

  onSubmit() {
    this.submitted = true;
    this.bookmarkService.create(this.model)
      .then(() => this.goBack());//TODO - go to bookmark details after creation
  }

  newBookmark() {
    this.model = new Bookmark('', '', '', [], '');
    this.active = false;
    setTimeout(() => this.active = true, 0);
  }

  // TODO: Remove this when we're done
  get diagnostic() { return JSON.stringify(this.model); }

  goBack(): void {
    this.location.back();
  }
}
