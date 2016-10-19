import { Component } from '@angular/core';
import {Bookmark} from "../bookmark";

@Component({
  selector: 'bookmark-form',
  templateUrl: 'bookmark-form.component.html',
  styleUrls: ['./bookmark-form.component.scss']
})
export class BookmarkFormComponent {

  model = new Bookmark('test', 'usually a url', 'java', ['jvm', 'performance'], 'some description to search through later');

  submitted = false;

  onSubmit() { this.submitted = true; }

  // TODO: Remove this when we're done
  get diagnostic() { return JSON.stringify(this.model); }
}
