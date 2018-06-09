
import {distinctUntilChanged, debounceTime} from 'rxjs/operators';
import {Component, OnInit} from '@angular/core';
import {Bookmark} from '../../core/model/bookmark';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {PersonalBookmarksStore} from '../../core/store/PersonalBookmarksStore';
import {Router} from '@angular/router';
import {MarkdownService} from '../markdown.service';
import {KeycloakService} from 'keycloak-angular';
import {BookmarkStore} from '../../public/bookmark/store/BookmarkStore';
import {PublicBookmarksService} from '../../public/bookmark/public-bookmarks.service';
import {COMMA, ENTER, SPACE} from "@angular/cdk/keycodes";
import {MatChipInputEvent} from "@angular/material";

@Component({
  selector: 'app-new-personal-bookmark-form',
  templateUrl: './create-new-personal-bookmark.component.html'
})
export class CreateNewPersonalBookmarkComponent implements OnInit {

  bookmarkForm: FormGroup;
  userId = null;
  existingPublicBookmark: Bookmark;
  displayModal = 'none';
  makePublic = false;
  personalBookmarkPresent = false;

  // chips
  selectable = true;
  removable = true;
  addOnBlur = true;

  // Enter, comma, space
  separatorKeysCodes = [ENTER, COMMA, SPACE];

  constructor(
    private personalBookmarksStore: PersonalBookmarksStore,
    private formBuilder: FormBuilder,
    private keycloakService: KeycloakService,
    private bookmarkService: PublicBookmarksService,
    private markdownServce: MarkdownService,
    private publicBookmarkStore: BookmarkStore
  ) {
    keycloakService.loadUserProfile().then( keycloakProfile => {
    this.userId = keycloakProfile.id;
  });

  }

  ngOnInit(): void {
    this.buildForm();
  }

  buildForm(): void {
    this.bookmarkForm = this.formBuilder.group({
      name: ['', Validators.required],
      location: ['', Validators.required],
      tags: this.formBuilder.array([], [Validators.required]),
      publishedOn: null,
      githubURL: '',
      description: '',
      shared: false,
      language: 'en'
    });

    this.bookmarkForm.controls['location'].valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),)
      .subscribe(location => {
        console.log('Location: ', location);
        if (this.personalBookmarksStore.getBookmarkByLocation(location)) {
          this.personalBookmarkPresent = true;
        } else {
          this.personalBookmarkPresent = false;
          this.bookmarkService.getScrapingData(location).subscribe(response => {
            if (response) {
              this.bookmarkForm.controls['name'].patchValue(response.title, {emitEvent : false});
              this.bookmarkForm.controls['description'].patchValue(response.metaDescription, {emitEvent : false});
            }
          });
        }

      });
  }

  saveBookmark(model: Bookmark) {
    const newBookmark: Bookmark = {
      name: model.name,
      location: model.location,
      language: model.language,
      tags: model.tags,
      publishedOn: model.publishedOn,
      githubURL: model.githubURL,
      description: model.description,
      descriptionHtml: this.markdownServce.toHtml(model.description),
      userId: this.userId,
      shared: model.shared,
      starredBy: [],
      lastAccessedAt: null
  };

    const obs = this.personalBookmarksStore.addBookmark(this.userId, newBookmark);
  }

  onClickMakePublic(checkboxValue) {
    if (checkboxValue) {
      this.makePublic = true;
      const location: string = this.bookmarkForm.controls['location'].value;
      this.bookmarkService.getPublicBookmarkByLocation(location).subscribe(response => {
        if (response) {
          console.log(response);
          this.displayModal = 'block';
          this.existingPublicBookmark = response;
          this.bookmarkForm.patchValue({
            shared: false
          });
        }
      });
    }
  }

  onStarClick() {
    console.log('Starred the bookmark');
    this.displayModal = 'none';
    this.makePublic = false;
    if ( this.existingPublicBookmark.starredBy.indexOf(this.userId) === -1) {
     this.existingPublicBookmark.starredBy.push(this.userId);
     this.updateBookmark(this.existingPublicBookmark);
    }
  }

  private updateBookmark(bookmark: Bookmark) {
    const obs = this.bookmarkService.updateBookmark(bookmark);
    obs.subscribe(
      res => {
        this.publicBookmarkStore.updateBookmark(bookmark);
      }
    );
  }

  onCancelClick() {
    this.displayModal = 'none';
    this.makePublic = false;
  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our fruit
    if ((value || '').trim()) {
      const tags = this.bookmarkForm.get('tags') as FormArray;
      tags.push(this.formBuilder.control(value.trim()));
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  remove(index: number): void {
    const tags = this.bookmarkForm.get('tags')as FormArray;

    if (index >= 0) {
      tags.removeAt(index);
    }
  }

}
