import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Bookmark } from '../../core/model/bookmark';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MarkdownService } from '../markdown.service';
import { KeycloakService } from 'keycloak-angular';
import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';
import { MatAutocompleteSelectedEvent, MatChipInputEvent } from '@angular/material';
import { Observable, throwError as observableThrowError } from 'rxjs';
import { languages } from '../../shared/language-options';
import { tagsValidator } from '../../shared/tags-validation.directive';
import { PublicBookmarksStore } from '../../public/bookmarks/store/public-bookmarks-store.service';
import { PublicBookmarksService } from '../../public/bookmarks/public-bookmarks.service';
import { descriptionSizeValidator } from '../../shared/description-size-validation.directive';
import { RateBookmarkRequest, RatingActionType } from '../../core/model/rate-bookmark.request';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { PersonalBookmarksService } from '../../core/personal-bookmarks.service';
import { UserDataStore } from '../../core/user/userdata.store';
import { Logger } from '../../core/logger.service';
import { Router } from '@angular/router';
import { ErrorService } from '../../core/error/error.service';
import { UserDataService } from '../../core/user-data.service';
import { UserInfoStore } from '../../core/user/user-info.store';

@Component({
  selector: 'app-new-personal-bookmark-form',
  templateUrl: './create-personal-bookmark.component.html',
  styleUrls: ['./create-personal-bookmark.component.scss']
})
export class CreatePersonalBookmarkComponent implements OnInit {

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

  languages = languages;

  autocompleteTags = [];

  tagsControl = new FormControl();

  filteredTags: Observable<any[]>;

  @ViewChild('tagInput') tagInput: ElementRef;

  constructor(
    private formBuilder: FormBuilder,
    private keycloakService: KeycloakService,
    private publicBookmarksService: PublicBookmarksService,
    private userDataService: UserDataService,
    private markdownService: MarkdownService,
    private publicBookmarksStore: PublicBookmarksStore,
    private personalBookmarksService: PersonalBookmarksService,
    private userInfoStore: UserInfoStore,
    private userDataStore: UserDataStore,
    private logger: Logger,
    private router: Router,
    private errorService: ErrorService
  ) {

    // keycloakService.loadUserProfile().then(keycloakProfile => {
      this.userInfoStore.getUserInfo$().subscribe(userInfo => {
        this.userId = userInfo.sub;

        personalBookmarksService.getTagsOfUser(this.userId).subscribe(tags => {
          this.autocompleteTags = tags.sort();

          this.filteredTags = this.tagsControl.valueChanges.pipe(
            startWith(null),
            map((tag: string | null) => {
              return tag ? this.filter(tag) : this.autocompleteTags.slice();
            })
          );
        });
      });
  }

  ngOnInit(): void {
    this.buildForm();
  }

  buildForm(): void {
    this.bookmarkForm = this.formBuilder.group({
      name: ['', Validators.required],
      location: ['', Validators.required],
      tags: this.formBuilder.array([], [tagsValidator, Validators.required]),
      publishedOn: null,
      githubURL: '',
      description: ['', descriptionSizeValidator],
      shared: false,
      language: 'en'
    });

    this.bookmarkForm.get('location').valueChanges.pipe(
      debounceTime(1000),
      distinctUntilChanged(), )
      .subscribe(location => {
        this.personalBookmarksService.getPersonalBookmarkByLocation(this.userId, location).subscribe(httpResponse => {
          if (httpResponse.status === 200) {
            this.personalBookmarkPresent = true;
          } else {
            this.getScrapeData(location);
          }
        },
          (errorResponse: HttpErrorResponse) => {
            if (errorResponse.status === 404) {
              this.getScrapeData(location);
            }
          });

      });
  }

  private getScrapeData(location) {
    this.personalBookmarkPresent = false;
    this.publicBookmarksService.getScrapingData(location).subscribe(response => {
      if (response) {
        this.bookmarkForm.get('name').patchValue(response.title, {emitEvent: false});
        this.bookmarkForm.get('description').patchValue(response.metaDescription, {emitEvent: false});
      }
    });
  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our tag
    if ((value || '').trim()) {
      const tags = this.bookmarkForm.get('tags') as FormArray;
      tags.push(this.formBuilder.control(value.trim()));
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.tagsControl.setValue(null);
    this.tags.markAsDirty();
  }

  remove(index: number): void {
    const tags = this.bookmarkForm.get('tags') as FormArray;

    if (index >= 0) {
      tags.removeAt(index);
    }
    this.tags.markAsDirty();
  }

  filter(name: string) {
    return this.autocompleteTags.filter(tag => tag.toLowerCase().indexOf(name.toLowerCase()) === 0);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const tags = this.bookmarkForm.get('tags') as FormArray;
    tags.push(this.formBuilder.control(event.option.viewValue));
    this.tagInput.nativeElement.value = '';
    this.tagsControl.setValue(null);
  }

  saveBookmark(bookmark: Bookmark) {
    const newBookmark: Bookmark = {
      name: bookmark.name,
      location: bookmark.location,
      language: bookmark.language,
      tags: bookmark.tags,
      publishedOn: bookmark.publishedOn,
      githubURL: bookmark.githubURL,
      description: bookmark.description,
      descriptionHtml: this.markdownService.toHtml(bookmark.description),
      userId: this.userId,
      shared: bookmark.shared,
      starredBy: [],
      lastAccessedAt: new Date(),
      stars: 0
    };

    this.personalBookmarksService.createBookmark(this.userId, newBookmark)
      .subscribe(
        res => {
          const headers = res.headers;
          // get the bookmark id, which lies in the "location" response header
          const lastSlashIndex = headers.get('location').lastIndexOf('/');
          const newBookmarkId = headers.get('location').substring(lastSlashIndex + 1);
          newBookmark._id = newBookmarkId;

          if (bookmark.shared) {
            this.publicBookmarksStore.addBookmarkToPublicStore(newBookmark);
          }
          this.userDataStore.addToHistory(newBookmark);
          this.router.navigate(
            ['/'],
            {
              queryParams: {tab: 'history'}
            });
        },
        (error: HttpResponse<any>) => {
          this.errorService.handleError(error.body.json());
          return observableThrowError(error.body.json());
        }
      );
  }

  onClickMakePublic(checkboxValue) {
    if (checkboxValue) {
      this.makePublic = true;
      const location: string = this.bookmarkForm.controls['location'].value;
      this.publicBookmarksService.getPublicBookmarkByLocation(location).subscribe(response => {
        if (response) {
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
    this.displayModal = 'none';
    this.makePublic = false;
    if (this.existingPublicBookmark.starredBy.indexOf(this.userId) === -1) {
      this.existingPublicBookmark.starredBy.push(this.userId);
      this.rateBookmark(this.existingPublicBookmark);
    }
  }

  private rateBookmark(bookmark: Bookmark) {
    const rateBookmarkRequest: RateBookmarkRequest = {
      ratingUserId: this.userId,
      action: RatingActionType.STAR,
      bookmark: bookmark
    }
    const obs = this.userDataService.rateBookmark(rateBookmarkRequest);
    obs.subscribe(
      res => {
        this.publicBookmarksStore.updateBookmarkInPublicStore(bookmark);
      }
    );
  }

  onCancelClick() {
    this.displayModal = 'none';
    this.makePublic = false;
  }

  get tags() {
    return <FormArray>this.bookmarkForm.get('tags');
  }

  get description() {
    return this.bookmarkForm.get('description');
  }
}


