import {Component, OnInit} from '@angular/core';
import {Bookmark} from "../../model/bookmark";
import {Location} from "@angular/common";
import {FormGroup, FormBuilder, Validators} from "@angular/forms";
import {BookmarkStore} from "../store/BookmarkStore";

@Component({
  selector: 'bookmark-form',
  templateUrl: 'bookmark-form.component.html',
  styleUrls: ['./bookmark-form.component.scss']
})
export class BookmarkFormComponent implements OnInit {

  model = new Bookmark('', '', '', [], '');
  bookmarkForm: FormGroup;

  constructor(
    private bookmarkStore: BookmarkStore,
    private location: Location,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.bookmarkForm = this.formBuilder.group({
      name: ['', Validators.required],
      location: ['', Validators.required],
      category: ['', Validators.required],
      tagsLine:['', Validators.required],
      description:''
    });
  }

  goBack(): void {
    this.location.back();
  }

  saveBookmark(model: Bookmark, isValid: boolean) {
    model.tags = model.tagsLine.split(",");
    var newBookmark = new Bookmark(model.name, model.location, model.category,model.tagsLine.split(","), model.description);

    let obs = this.bookmarkStore.addBookmark(newBookmark);

    obs.subscribe(
      res => {
        this.goBack();
      });
  }
}
