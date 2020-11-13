import { concatMap, debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Bookmark } from '../../core/model/bookmark';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MarkdownService } from '../../core/markdown/markdown.service';
import { KeycloakService } from 'keycloak-angular';
import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Observable, throwError as observableThrowError } from 'rxjs';
import { languages } from '../../shared/language-options';
import { tagsValidator } from '../../shared/tags-validation.directive';
import { PublicBookmarksStore } from '../../public/bookmarks/store/public-bookmarks-store.service';
import { PublicBookmarksService } from '../../public/bookmarks/public-bookmarks.service';
import { HttpResponse } from '@angular/common/http';
import { PersonalBookmarksService } from '../../core/personal-bookmarks.service';
import { UserDataStore } from '../../core/user/userdata.store';
import { Logger } from '../../core/logger.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ErrorService } from '../../core/error/error.service';
import { UserDataService } from '../../core/user-data.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { SuggestedTagsStore } from '../../core/user/suggested-tags.store';
import { WebpageInfo } from '../../core/model/webpage-info';
import { MyBookmarksStore } from '../../core/user/my-bookmarks.store';
import { PublicBookmarkPresentDialogComponent } from './public-bookmark-present-dialog/public-bookmark-present-dialog.component';
import { AdminService } from '../../core/admin/admin.service';
import { WebpageInfoService } from '../../core/webpage-info/webpage-info.service';
import { UserDataHistoryStore } from '../../core/user/userdata.history.store';
import { UserDataReadLaterStore } from '../../core/user/userdata.readlater.store';
import { UserData } from '../../core/model/user-data';
import { DatePipe } from '@angular/common';
import { textSizeValidator } from '../../core/validators/text-size.validator';
import { StackoverflowHelper } from '../../core/stackoverflow.helper';
import { UserDataPinnedStore } from '../../core/user/userdata.pinned.store';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

@Component({
  selector: 'app-save-bookmark-form',
  templateUrl: './save-bookmark-form.component.html',
  styleUrls: ['./save-bookmark-form.component.scss']
})
export class SaveBookmarkFormComponent implements OnInit {

  bookmarkForm: FormGroup;
  userId = null;
  private userData: UserData;
  makePublic = false;
  personalBookmarkPresent = false;
  existingPersonalBookmark: Bookmark;

  // chips
  selectable = true;
  removable = true;

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
  popupExt; // if present will go popup to the submitted url

  @Input()
  desc; // value of "desc" query parameter if present

  @Input()
  title; // value of "title" query parameter if present

  @Input()
  bookmark$: Observable<Bookmark>;

  @ViewChild('tagInput', {static: false})
  tagInput: ElementRef;

  @Input()
  isUpdate = false;

  @Input()
  copyToMine = false;

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
    private webpageInfoService: WebpageInfoService,
    private adminService: AdminService,
    private suggestedTagsStore: SuggestedTagsStore,
    private userInfoStore: UserInfoStore,
    private userDataStore: UserDataStore,
    private userdataHistoryStore: UserDataHistoryStore,
    private userDataReadLaterStore: UserDataReadLaterStore,
    private userDataPinnedStore: UserDataPinnedStore,
    private stackoverflowHelper: StackoverflowHelper,
    private datePipe: DatePipe,
    private logger: Logger,
    private router: Router,
    private route: ActivatedRoute,
    private errorService: ErrorService
  ) {
    this.userInfoStore.getUserInfo$().subscribe(userInfo => {
      this.userId = userInfo.sub;
      this.userDataStore.getUserData$().subscribe(userData => {
        this.userData = userData;
      });
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
    if (this.isUpdate || this.copyToMine) {
      this.bookmark$.subscribe(bookmark => {
        this.bookmark = bookmark;
        this.makePublic = this.bookmark.public;
        if (this.copyToMine) {
          this.makePublic = false;
          this.bookmark._id = null;
          this.bookmark.public = false;
          this.verifyExistenceInPersonalBookmarks(bookmark.location);
        }
        this.bookmarkForm.patchValue(this.bookmark);
        this.bookmarkForm.get('publishedOn').patchValue(this.datePipe.transform(bookmark.publishedOn, 'yyyy-MM-dd')); // issue setting date otherwise on date field
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
      sourceCodeURL: '',
      description: [this.desc ? this.desc : '', textSizeValidator(3000, 300)],
      public: false,
      readLater: false,
      pinned: false,
      language: null,
      youtubeVideoId: null,
      stackoverflowQuestionId: null,
    });

    if (this.url) {
      this.verifyExistenceInPersonalBookmarks(this.url);
    }

    this.onChanges();
  }

  private onChanges() {
    const isNewBookmark = !this.isUpdate && !this.copyToMine;
    if (isNewBookmark) {
      this.bookmarkForm.get('location').valueChanges.pipe(
        debounceTime(1000),
        distinctUntilChanged(), )
        .subscribe(location => {
          this.verifyExistenceInPersonalBookmarks(location);
        });
    }
  }

  private verifyExistenceInPersonalBookmarks(location) {
    this.personalBookmarksService.getPersonalBookmarkByLocation(this.userId, location).subscribe((bookmarks: Bookmark[]) => {
      if (bookmarks.length === 1) {
        this.personalBookmarkPresent = true;
        this.existingPersonalBookmark = bookmarks[0];
      } else if (!this.copyToMine) {
        this.getWebPageInfo(location);
      }
    });
  }

  private getWebPageInfo(location) {
    this.personalBookmarkPresent = false;
    const youtubeVideoId = this.getYoutubeVideoId(location);
    if (youtubeVideoId) {
      this.bookmarkForm.get('youtubeVideoId').patchValue(youtubeVideoId, {emitEvent: false});
      this.webpageInfoService.getYoutubeVideoData(youtubeVideoId).subscribe((webpageData: WebpageInfo) => {
          this.patchFormAttributesWithWebPageData(webpageData);
        },
        error => {
          console.error(`Problems when scraping data for youtube id ${youtubeVideoId}`, error);
          // fallback to scrape from location
          this.updateFormWithScrapingDataFromLocation(location);
        });
    } else {
      const stackoverflowQuestionId = this.stackoverflowHelper.getStackoverflowQuestionIdFromUrl(location);
      if (stackoverflowQuestionId) {
        this.bookmarkForm.get('stackoverflowQuestionId').patchValue(stackoverflowQuestionId, {emitEvent: false});
        this.webpageInfoService.getStackoverflowQuestionData(stackoverflowQuestionId).subscribe((webpageData: WebpageInfo) => {
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
      const webpageData: WebpageInfo = {
        title: this.title,
        metaDescription: this.desc
      }
      this.patchFormAttributesWithWebPageData(webpageData);
    } else { // go try to scrape for description and title if user did not select any text
      this.webpageInfoService.getScrapingData(location).subscribe((webpageData: WebpageInfo) => {
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

  addTag(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our tag (avoid double adding in angular material 9 see - https://stackoverflow.com/questions/52608700/angular-material-mat-chips-autocomplete-bug-matchipinputtokenend-executed-befo)
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

  selectedTag(event: MatAutocompleteSelectedEvent): void {
    const tags = this.bookmarkForm.get('tags') as FormArray;
    tags.push(this.formBuilder.control(event.option.viewValue));
    this.tagInput.nativeElement.value = '';
    this.tagsControl.setValue(null);
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

  saveBookmark(bookmark: Bookmark) {
    if (this.isUpdate) {
      this.updateBookmark(bookmark)
    } else if (this.copyToMine) {
      this.copyBookmarkToMine(bookmark);
    } else {
      this.createBookmark(bookmark);
    }
  }


  updateBookmark(bookmark: Bookmark): void {
    bookmark.descriptionHtml = this.markdownService.toHtml(bookmark.description);
    const now = new Date();
    bookmark.updatedAt = now;
    bookmark.lastAccessedAt = now;
    bookmark.userId = this.bookmark.userId;
    bookmark.userDisplayName = this.bookmark.userDisplayName;
    bookmark._id = this.bookmark._id;

    const updateAsAdmin = this.keycloakService.isUserInRole('ROLE_ADMIN') && bookmark.userId !== this.userId;
    if (updateAsAdmin) {
      this.adminService.updateBookmark(bookmark).subscribe(
        () => {
          this.navigateToHomePageHistoryTab()
        },
        () => this.navigateToHomePageHistoryTab() // TODO add error handling - popover
      );
    } else {
      this.personalBookmarksService.updateBookmark(bookmark).pipe(
        concatMap((updatedBookmark) => this.userDataStore.updateUserDataHistory$(updatedBookmark))
      ).subscribe(
        () => {
          this.userdataHistoryStore.publishHistoryStore(bookmark);
          this.navigateToHomePageHistoryTab()
        },
        () => this.navigateToHomePageHistoryTab() // TODO add error handling - popover
      );
    }
  }

  navigateToHomePageHistoryTab(): void {
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
      sourceCodeURL: bookmark.sourceCodeURL,
      description: bookmark.description,
      descriptionHtml: this.markdownService.toHtml(bookmark.description),
      userId: this.userId,
      userDisplayName: this.userData.profile.displayName,
      public: bookmark.public,
      lastAccessedAt: new Date(),
      likeCount: 0
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

          if (bookmark.public) {
            this.publicBookmarksStore.addBookmarkToPublicStore(newBookmark);
          }

          const readLater = this.bookmarkForm.controls['readLater'].value;
          const pinned = this.bookmarkForm.controls['pinned'].value;
          this.userDataStore.updateHistoryReadLaterAndPinned$(newBookmark, readLater, pinned).subscribe(() => {
            this.publishInUserDataStores(newBookmark, readLater, pinned);

            if (this.url) {
              if (this.popup) {
                this.navigateToBookmarkDetails(newBookmark);
              } else if (this.popupExt) {
                this.navigateToHomePageHistoryTab();
              } else {
                window.location.href = this.url;
              }
            } else {
              this.navigateToHomePageHistoryTab();
            }
          });
        },
        (error: HttpResponse<any>) => {
          this.errorService.handleError(error.body.json());
          return observableThrowError(error.body.json());
        }
      );
  }

  navigateToBookmarkDetails(bookmark: Bookmark): void {
    const link = [`./personal/bookmarks/${bookmark._id}/details`];
    this.router.navigate(link,
      {
        state: {bookmark: bookmark},
        queryParams: {popup: this.popup}
      });
  }

  private publishInUserDataStores(bookmark: Bookmark, readLater, pinned) {
    this.userdataHistoryStore.publishHistoryStore(bookmark);
    if (readLater) {
      this.userDataReadLaterStore.publishReadLaterAfterCreation(bookmark);
    }
    if (pinned) {
      this.userDataPinnedStore.publishPinnedAfterCreation(bookmark);
    }
  }

  onClickMakePublic(checkboxValue) {
    if (checkboxValue) {
      const location: string = this.bookmarkForm.controls['location'].value;
      this.publicBookmarksService.getPublicBookmarkByLocation(location).subscribe(bookmarksForLocation => {
          if (bookmarksForLocation.length === 0) {
            this.makePublic = true;
            this.bookmarkForm.controls['language'].setValue('en');
          } else {
            this.openPublicBookmarkPresentDialog(bookmarksForLocation[0]);
          }
        }
      );
    } else {
      this.makePublic = false;
      this.bookmarkForm.controls['language'].setValue(null);
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
        this.makePublic = false;
        this.bookmarkForm.patchValue({
          public: false
        });
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

  private copyBookmarkToMine(bookmark: Bookmark) {

    bookmark.descriptionHtml = this.markdownService.toHtml(bookmark.description);
    const now = new Date();
    bookmark.updatedAt = now;
    bookmark.lastAccessedAt = now;
    bookmark.userId = this.userId;
    bookmark.userDisplayName = this.userData.profile.displayName;

    this.personalBookmarksService.createBookmark(this.userId, bookmark)
      .subscribe(
        response => {
          const headers = response.headers;
          // get the bookmark id, which lies in the "location" response header
          const lastSlashIndex = headers.get('location').lastIndexOf('/');
          const newBookmarkId = headers.get('location').substring(lastSlashIndex + 1);
          bookmark._id = newBookmarkId;

          this.myBookmarksStore.addToLastCreated(bookmark);

          const readLater = this.bookmarkForm.controls['readLater'].value;
          const pinned = this.bookmarkForm.controls['pinned'].value;
          this.userDataStore.updateHistoryReadLaterAndPinned$(bookmark, readLater, pinned).subscribe(() => {
            this.publishInUserDataStores(bookmark, readLater, pinned);
            this.navigateToHomePageHistoryTab();
          });
        },
        (error: HttpResponse<any>) => {
          this.errorService.handleError(error.body.json());
          return observableThrowError(error.body.json());
        }
      );
  }

  editExistingBookmark(): void {
    const link = [`./personal/bookmarks/${this.existingPersonalBookmark._id}/edit`];
    this.router.navigate(link, {state: {bookmark: this.existingPersonalBookmark}});
  }
}


