import {Component, OnInit} from '@angular/core';
import {Bookmark} from "../bookmark";
import {BookmarkService} from "../bookmark.service";
import {Location} from "@angular/common";
import {FormGroup, FormBuilder, Validators} from "@angular/forms";

@Component({
  selector: 'bookmark-form',
  templateUrl: 'bookmark-form.component.html',
  styleUrls: ['./bookmark-form.component.scss']
})
export class BookmarkFormComponent implements OnInit {

  model = new Bookmark('', '', '', [], '');

  submitted = false;
  active=true;

  newBookmarkForm: FormGroup;

  constructor(
    private bookmarkService: BookmarkService,
    private location: Location,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.newBookmarkForm = this.formBuilder.group({
      name: ['', Validators.required],
      location: ['', Validators.required],
      category: ['', Validators.required],
      tags:['', Validators.pattern("[^,]+")],
      description:''
    });
  }

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

  save(model: Bookmark, isValid: boolean) {
    this.submitted = true;
    console.log(model, isValid);
  }
}
