import {debounceTime, distinctUntilChanged} from 'rxjs/operators';
import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Bookmark} from '../../core/model/bookmark';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {PersonalBookmarksStore} from '../../core/store/PersonalBookmarksStore';
import {MarkdownService} from '../markdown.service';
import {KeycloakService} from 'keycloak-angular';
import {BookmarkStore} from '../../public/bookmark/store/BookmarkStore';
import {PublicBookmarksService} from '../../public/bookmark/public-bookmarks.service';
import {COMMA, ENTER, SPACE} from '@angular/cdk/keycodes';
import {MatAutocompleteSelectedEvent, MatChipInputEvent} from '@angular/material';
import {Observable} from 'rxjs/index';
import {map, startWith} from 'rxjs/internal/operators';

@Component({
  selector: 'app-new-personal-bookmark-form',
  templateUrl: './create-new-personal-bookmark.component.html',
  styleUrls: ['./create-new-personal-bookmark.component.scss']
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

  allTags = [
    'Apple',
    'Lemon',
    'Lime',
    'Orange',
    'Strawberry'
  ];

  tagCtrl = new FormControl();

  filteredTags: Observable<any[]>;

  @ViewChild('tagInput') tagInput: ElementRef;

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

    this.filteredTags = this.tagCtrl.valueChanges.pipe(
      startWith(null),
      map((tag: string | null) => tag ? this.filter(tag) : this.allTags.slice())
/*      startWith(''),
      map(val => this.filter(val))*/
    );
  }

/*  filter(val: string): string[] {
    return this.allTags.filter(option => option.toLowerCase().indexOf(val.toLowerCase()) === 0);
  }*/
  filter(name: string) {
    return this.allTags.filter(tag => tag.toLowerCase().indexOf(name.toLowerCase()) === 0);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const tags = this.bookmarkForm.get('tags') as FormArray;
    tags.push(this.formBuilder.control(event.option.viewValue));
    this.tagInput.nativeElement.value = '';
    this.tagCtrl.setValue(null);
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

    this.bookmarkForm.get('location').valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(), )
      .subscribe(location => {
        console.log('Location: ', location);
        if (this.personalBookmarksStore.getBookmarkByLocation(location)) {
          this.personalBookmarkPresent = true;
        } else {
          this.personalBookmarkPresent = false;
          this.bookmarkService.getScrapingData(location).subscribe(response => {
            if (response) {
              this.bookmarkForm.get('name').patchValue(response.title, {emitEvent : false});
              this.bookmarkForm.get('description').patchValue(response.metaDescription, {emitEvent : false});
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

    this.tagCtrl.setValue(null);
  }

  remove(index: number): void {
    const tags = this.bookmarkForm.get('tags') as FormArray;

    if (index >= 0) {
      tags.removeAt(index);
    }
  }

  getTagsErrorMessage() {
    if (this.bookmarkForm.get('tags').hasError('required')) {
      return 'You must enter a value';
    }
/*    return this.bookmarkForm.get('tags').hasError('required') ? 'You must enter a value' :
      this.bookmarkForm.get('tags').hasError('email') ? 'Not a valid email' :
        '';*/
  }

  get tags() { return <FormArray>this.bookmarkForm.get('tags'); }
}
