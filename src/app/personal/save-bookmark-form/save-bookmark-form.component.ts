import { concatMap, debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Bookmark } from '../../core/model/bookmark';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MarkdownService } from '../markdown.service';
import { KeycloakService } from 'keycloak-angular';
import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';
import { MatAutocompleteSelectedEvent, MatChipInputEvent, MatDialog, MatDialogConfig } from '@angular/material';
import { Observable, throwError as observableThrowError } from 'rxjs';
import { languages } from '../../shared/language-options';
import { tagsValidator } from '../../shared/tags-validation.directive';
import { PublicBookmarksStore } from '../../public/bookmarks/store/public-bookmarks-store.service';
import { PublicBookmarksService } from '../../public/bookmarks/public-bookmarks.service';
import { descriptionSizeValidator } from '../../shared/description-size-validation.directive';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { PersonalBookmarksService } from '../../core/personal-bookmarks.service';
import { UserDataStore } from '../../core/user/userdata.store';
import { Logger } from '../../core/logger.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ErrorService } from '../../core/error/error.service';
import { UserDataService } from '../../core/user-data.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { SuggestedTagsStore } from '../../core/user/suggested-tags.store';
import { WebpageData } from '../../core/model/webpage-data';
import { MyBookmarksStore } from '../../core/user/my-bookmarks.store';
import { PublicBookmarkPresentDialogComponent } from './public-bookmark-present-dialog/public-bookmark-present-dialog.component';

@Component({
  selector: 'app-save-bookmark-form',
  templateUrl: './save-bookmark-form.component.html',
  styleUrls: ['./save-bookmark-form.component.scss']
})
export class SaveBookmarkFormComponent implements OnInit {

  bookmarkForm: FormGroup;
  userId = null;
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

  @Input()
  url; // value of "url" query parameter if present

  @Input()
  popup; // if present will go popup to the submitted url

  @Input()
  desc; // value of "desc" query parameter if present

  @Input()
  title; // value of "title" query parameter if present

  @Input()
  bookmark$: Observable<Bookmark>;

  @ViewChild('tagInput', {static: false})
  tagInput: ElementRef;

  @Input()
  isUpdate: boolean;

  bookmark: Bookmark;

  constructor(
    private publicBookmarkPresentDialog: MatDialog,
    private formBuilder: FormBuilder,
    private keycloakService: KeycloakService,
    private publicBookmarksService: PublicBookmarksService,
    private userDataService: UserDataService,
    private markdownService: MarkdownService,
    private publicBookmarksStore: PublicBookmarksStore,
    private myBookmarksStore: MyBookmarksStore,
    private personalBookmarksService: PersonalBookmarksService,
    private suggestedTagsStore: SuggestedTagsStore,
    private userInfoStore: UserInfoStore,
    private userDataStore: UserDataStore,
    private logger: Logger,
    private router: Router,
    private route: ActivatedRoute,
    private errorService: ErrorService
  ) {
    this.userInfoStore.getUserInfo$().subscribe(userInfo => {
      this.userId = userInfo.sub;

      this.suggestedTagsStore.getSuggestedTags$(this.userId).subscribe(tags => {
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
    if (this.isUpdate) { // this is update
      this.bookmark$.subscribe(bookmark => {
        this.bookmark = bookmark;
        this.makePublic = this.bookmark.shared;
        this.bookmarkForm.patchValue(this.bookmark);
        for (let i = 0; i < this.bookmark.tags.length; i++) {
          const formTags = this.bookmarkForm.get('tags') as FormArray;
          formTags.push(this.formBuilder.control(this.bookmark.tags[i]));
        }

        this.tagsControl.setValue(null);
        this.tags.markAsDirty();
      });
    }
  }

  buildForm(): void {
    this.bookmarkForm = this.formBuilder.group({
      name: [this.title ? this.title : '', Validators.required],
      location: [this.url ? this.url : '', Validators.required],
      tags: this.formBuilder.array([], [tagsValidator, Validators.required]),
      publishedOn: null,
      githubURL: '',
      description: [this.desc ? this.desc : '', descriptionSizeValidator],
      shared: false,
      readLater: false,
      language: 'en',
      youtubeVideoId: null,
      stackoverflowQuestionId: null,
    });

    if (this.url) {
      this.verifyExistenceInPersonalBookmarks(this.url);
    }

    this.onChanges();
  }

  private onChanges() {
    if (!this.isUpdate) {
      this.bookmarkForm.get('location').valueChanges.pipe(
        debounceTime(1000),
        distinctUntilChanged(),)
        .subscribe(location => {
          this.verifyExistenceInPersonalBookmarks(location);

        });
    }
  }

  private verifyExistenceInPersonalBookmarks(location) {
    this.personalBookmarksService.getPersonalBookmarkByLocation(this.userId, location).subscribe(httpResponse => {
        if (httpResponse.status === 200) {
          this.personalBookmarkPresent = true;
        } else {
          this.getWebPageData(location);
        }
      },
      (errorResponse: HttpErrorResponse) => {
        if (errorResponse.status === 404) {
          this.getWebPageData(location);
        }
      });
  }

  private getWebPageData(location) {
    this.personalBookmarkPresent = false;
    const youtubeVideoId = this.getYoutubeVideoId(location);
    if (youtubeVideoId) {
      this.bookmarkForm.get('youtubeVideoId').patchValue(youtubeVideoId, {emitEvent: false});
      this.publicBookmarksService.getYoutubeVideoData(youtubeVideoId).subscribe((webpageData: WebpageData) => {
          this.patchFormAttributesWithWebPageData(webpageData);
        },
        error => {
          console.error(`Problems when scraping data for youtube id ${youtubeVideoId}`, error);
          // fallback to scrape from location
          this.updateFormWithScrapingDataFromLocation(location);
        });
    } else {
      const stackoverflowQuestionId = this.getStackoverflowQuestionId(location);
      if (stackoverflowQuestionId) {
        this.bookmarkForm.get('stackoverflowQuestionId').patchValue(stackoverflowQuestionId, {emitEvent: false});
        this.publicBookmarksService.getStackoverflowQuestionData(stackoverflowQuestionId).subscribe((webpageData: WebpageData) => {
            this.patchFormAttributesWithWebPageData(webpageData);
          },
          error => {
            console.error(`Problems when scraping data for stackoverflow id ${stackoverflowQuestionId}`, error);
            // fallback to scrape from location
            this.updateFormWithScrapingDataFromLocation(location);
          });
      } else {
        // for everything else try to scrape the web page for the location
        this.updateFormWithScrapingDataFromLocation(location);
      }
    }
  }

  private patchFormAttributesWithWebPageData(webpageData) {
    if (webpageData.title) {
      this.bookmarkForm.get('name').patchValue(webpageData.title, {emitEvent: false});
    }
    if (webpageData.publishedOn) {
      this.bookmarkForm.get('publishedOn').patchValue(webpageData.publishedOn, {emitEvent: false});
    }
    if (this.desc) {// use user selected text if present
      this.bookmarkForm.get('description').patchValue(this.desc, {emitEvent: false});
    } else if (webpageData.metaDescription) {
      this.bookmarkForm.get('description').patchValue(webpageData.metaDescription, {emitEvent: false});
    }
    if (webpageData.tags) {
      for (let i = 0; i < webpageData.tags.length; i++) {
        const formTags = this.bookmarkForm.get('tags') as FormArray;
        formTags.push(this.formBuilder.control(webpageData.tags[i]));
      }

      this.tagsControl.setValue(null);
      this.tags.markAsDirty();
    }
  }

  private updateFormWithScrapingDataFromLocation(location) {
    if (this.desc) {
      const webpageData: WebpageData = {
        title: this.title,
        metaDescription: this.desc
      }
      this.patchFormAttributesWithWebPageData(webpageData);
    } else { // go try to scrape for description and title if user did not select any text
      this.publicBookmarksService.getScrapingData(location).subscribe((webpageData: WebpageData) => {
          this.patchFormAttributesWithWebPageData(webpageData);
        },
        error => {
          console.error(`Problems when scraping data for location ${location}`, error);
        });
    }

  }

  private getYoutubeVideoId(bookmarkUrl): string {
    let youtubeVideoId = null;
    if (bookmarkUrl.startsWith('https://youtu.be/')) {
      youtubeVideoId = bookmarkUrl.split('/').pop();
    } else if (bookmarkUrl.startsWith('https://www.youtube.com/watch')) {
      youtubeVideoId = bookmarkUrl.split('v=')[1];
      const ampersandPosition = youtubeVideoId.indexOf('&');
      if (ampersandPosition !== -1) {
        youtubeVideoId = youtubeVideoId.substring(0, ampersandPosition);
      }
    }

    return youtubeVideoId;
  };


  private getStackoverflowQuestionId(location: string) {
    let stackoverflowQuestionId = null;
    const regExpMatchArray = location.match(/stackoverflow\.com\/questions\/(\d+)/);
    if (regExpMatchArray) {
      stackoverflowQuestionId = regExpMatchArray[1];
    }

    return stackoverflowQuestionId;
  }

  addTag(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our tag
    if ((value || '').trim()) {
      const tags = this.bookmarkForm.get('tags') as FormArray;
      tags.push(this.formBuilder.control(value.trim().toLowerCase()));
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.tagsControl.setValue(null);
    this.tags.markAsDirty();
  }

  removeTagByIndex(index: number): void {
    const tags = this.bookmarkForm.get('tags') as FormArray;

    if (index >= 0) {
      tags.removeAt(index);
    }
    this.tags.markAsDirty();
  }

  filter(name: string) {
    return this.autocompleteTags.filter(tag => tag.toLowerCase().indexOf(name.toLowerCase()) === 0);
  }

  selectedTag(event: MatAutocompleteSelectedEvent): void {
    const tags = this.bookmarkForm.get('tags') as FormArray;
    tags.push(this.formBuilder.control(event.option.viewValue));
    this.tagInput.nativeElement.value = '';
    this.tagsControl.setValue(null);
  }

  saveBookmark(bookmark: Bookmark) {
    if (this.isUpdate) {
      this.updateBookmark(bookmark)
    } else {
      this.createBookmark(bookmark);
    }
  }


  updateBookmark(bookmark: Bookmark): void {
    bookmark.descriptionHtml = this.markdownService.toHtml(bookmark.description);
    const now = new Date();
    bookmark.updatedAt = now;
    bookmark.lastAccessedAt = now;
    bookmark.userId = this.userId;
    bookmark._id = this.bookmark._id;

    const readLater = this.bookmarkForm.controls['readLater'].value;
    this.personalBookmarksService.updateBookmark(bookmark).pipe(
      concatMap((updatedBookmark) => this.userDataStore.addToHistoryAndReadLater$(updatedBookmark, readLater))
    ).subscribe(
      () => {
        this.publishInStores(bookmark, readLater);
        this.navigateToHomePage()
      } ,
      () => this.navigateToHomePage() // TODO add error handling - popover
    );
  }

  navigateToHomePage(): void {
    this.router.navigate(
      ['/'],
      {
        queryParams: {tab: 'history'}
      }
    );
  }

  private createBookmark(bookmark: Bookmark) {
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
      lastAccessedAt: new Date(),
      likes: 0
    };

    if (bookmark.youtubeVideoId) {
      newBookmark.youtubeVideoId = bookmark.youtubeVideoId;
    }

    if (bookmark.stackoverflowQuestionId) {
      newBookmark.stackoverflowQuestionId = bookmark.stackoverflowQuestionId;
    }

    this.personalBookmarksService.createBookmark(this.userId, newBookmark)
      .subscribe(
        response => {
          const headers = response.headers;
          // get the bookmark id, which lies in the "location" response header
          const lastSlashIndex = headers.get('location').lastIndexOf('/');
          const newBookmarkId = headers.get('location').substring(lastSlashIndex + 1);
          newBookmark._id = newBookmarkId;

          this.myBookmarksStore.addToLastCreated(bookmark);

          if (bookmark.shared) {
            this.publicBookmarksStore.addBookmarkToPublicStore(newBookmark);
          }

          const readLater = this.bookmarkForm.controls['readLater'].value;
          this.userDataStore.addToHistoryAndReadLater$(newBookmark, readLater).subscribe(() => {
            this.publishInStores(newBookmark, readLater);

            if (this.url) {
              if (this.popup) {
                window.close();
              } else {
                window.location.href = this.url;
              }
            } else {
              this.navigateToHomePage();
            }
          });
        },
        (error: HttpResponse<any>) => {
          this.errorService.handleError(error.body.json());
          return observableThrowError(error.body.json());
        }
      );
  }

  private publishInStores(bookmark: Bookmark, readLater) {
    this.userDataStore.publishHistoryAfterCreation(bookmark);
    if (readLater) {
      this.userDataStore.publishLaterReadsAfterCreation(bookmark);
    }
  }

  onClickMakePublic(checkboxValue) {
    if (checkboxValue) {
      const location: string = this.bookmarkForm.controls['location'].value;
      this.publicBookmarksService.getPublicBookmarkByLocation(location).subscribe(bookmark => {
          this.openPublicBookmarkPresentDialog(bookmark);
        },
        (errorResponse: HttpErrorResponse) => {
          if (errorResponse.status === 404) {
            this.makePublic = true;
          }
        }
      );
    } else {
      this.makePublic = false;
    }
  }

  openPublicBookmarkPresentDialog(bookmark: Bookmark) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      bookmark: bookmark
    };

    const dialogRef = this.publicBookmarkPresentDialog.open(PublicBookmarkPresentDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(
      data => {
        if (data === 'LIKE_BOOKMARK') {
          this.likeExistingPublicBookmak(bookmark);
        }
      }
    );
  }

  likeExistingPublicBookmak(bookmark: Bookmark): void {
    this.userDataStore.getUserData$().subscribe(userData => {
      if (userData.likes.indexOf(bookmark._id) === -1) {
        this.userDataStore.likeBookmark(bookmark);
      }
    })
  }

  get tags() {
    return <FormArray>this.bookmarkForm.get('tags');
  }

  get description() {
    return this.bookmarkForm.get('description');
  }

}


