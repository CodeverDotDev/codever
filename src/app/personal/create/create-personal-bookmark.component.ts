import {debounceTime, distinctUntilChanged, map, startWith} from 'rxjs/operators';
import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Bookmark} from '../../core/model/bookmark';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {MarkdownService} from '../markdown.service';
import {KeycloakService} from 'keycloak-angular';
import {COMMA, ENTER, SPACE} from '@angular/cdk/keycodes';
import {MatAutocompleteSelectedEvent, MatChipInputEvent} from '@angular/material';
import {Observable, throwError as observableThrowError} from 'rxjs';
import {languages} from '../../shared/language-options';
import {tagsValidator} from '../../shared/tags-validation.directive';
import {PublicBookmarksStore} from '../../public/bookmarks/store/public-bookmarks-store.service';
import {PublicBookmarksService} from '../../public/bookmarks/public-bookmarks.service';
import {descriptionSizeValidator} from '../../shared/description-size-validation.directive';
import {RateBookmarkRequest, RatingActionType} from '../../core/model/rate-bookmark.request';
import {HttpErrorResponse, HttpResponse} from '@angular/common/http';
import {PersonalBookmarksService} from '../../core/personal-bookmarks.service';
import {UserDataStore} from '../../core/user/userdata.store';
import {Logger} from '../../core/logger.service';
import {ActivatedRoute, Router} from '@angular/router';
import {ErrorService} from '../../core/error/error.service';
import {UserDataService} from '../../core/user-data.service';
import {UserInfoStore} from '../../core/user/user-info.store';
import {SuggestedTagsStore} from '../../core/user/suggested-tags.store';
import {WebpageData} from '../../core/model/webpage-data';

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

  url; // value of "url" query parameter if present

  @ViewChild('tagInput', {static: false})
  tagInput: ElementRef;

  constructor(
    private formBuilder: FormBuilder,
    private keycloakService: KeycloakService,
    private publicBookmarksService: PublicBookmarksService,
    private userDataService: UserDataService,
    private markdownService: MarkdownService,
    private publicBookmarksStore: PublicBookmarksStore,
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
    this.url = this.route.snapshot.queryParamMap.get('url');
    this.buildForm();
  }

  buildForm(): void {
    this.bookmarkForm = this.formBuilder.group({
      name: ['', Validators.required],
      location: [this.url ? this.url : '', Validators.required],
      tags: this.formBuilder.array([], [tagsValidator, Validators.required]),
      publishedOn: null,
      githubURL: '',
      description: ['', descriptionSizeValidator],
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
    this.bookmarkForm.get('location').valueChanges.pipe(
      debounceTime(1000),
      distinctUntilChanged(), )
      .subscribe(location => {
        this.verifyExistenceInPersonalBookmarks(location);

      });
  }

  private verifyExistenceInPersonalBookmarks(location) {
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
  }

  private getScrapeData(location) {
    this.personalBookmarkPresent = false;
    const youtubeVideoId = this.getYoutubeVideoId(location);
    if (youtubeVideoId) {
      this.bookmarkForm.get('youtubeVideoId').patchValue(youtubeVideoId, {emitEvent: false});
      this.publicBookmarksService.getYoutubeVideoData(youtubeVideoId).subscribe((webpageData: WebpageData) => {
          this.patchFormAttributesWithScrapedData(webpageData);
        },
        error => {
          console.error(`Problems when scraping data for youtube id ${youtubeVideoId}`, error);
          this.updateFormWithScrapingDataFromLocation(location);
        });
    } else {
      const stackoverflowQuestionId = this.getStackoverflowQuestionId(location);
      if (stackoverflowQuestionId) {
        this.bookmarkForm.get('stackoverflowQuestionId').patchValue(stackoverflowQuestionId, {emitEvent: false});
        this.publicBookmarksService.getStackoverflowQuestionData(stackoverflowQuestionId).subscribe((webpageData: WebpageData) => {
            this.patchFormAttributesWithScrapedData(webpageData);
          },
          error => {
            console.error(`Problems when scraping data for stackoverflow id ${stackoverflowQuestionId}`, error);
            this.updateFormWithScrapingDataFromLocation(location);
          });
      } else {
        this.updateFormWithScrapingDataFromLocation(location);
      }
    }
  }

  private patchFormAttributesWithScrapedData(webpageData) {
    if (webpageData.title) {
      this.bookmarkForm.get('name').patchValue(webpageData.title, {emitEvent: false});
    }
    if (webpageData.publishedOn) {
      this.bookmarkForm.get('publishedOn').patchValue(webpageData.publishedOn, {emitEvent: false});
    }
    if (webpageData.metaDescription) {
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
    this.publicBookmarksService.getScrapingData(location).subscribe((webpageData: WebpageData) => {
        this.patchFormAttributesWithScrapedData(webpageData);
      },
      error => {
        console.error(`Problems when scraping data for locaation ${location}`, error);
      });
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
      tags.push(this.formBuilder.control(value.trim()));
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
        res => {
          const headers = res.headers;
          // get the bookmark id, which lies in the "location" response header
          const lastSlashIndex = headers.get('location').lastIndexOf('/');
          const newBookmarkId = headers.get('location').substring(lastSlashIndex + 1);
          newBookmark._id = newBookmarkId;

          if (bookmark.shared) {
            this.publicBookmarksStore.addBookmarkToPublicStore(newBookmark);
          }
          if (this.bookmarkForm.controls['readLater'].value === true) {
            this.userDataStore.addToHistoryAndReadLater(newBookmark);
          } else {
            this.userDataStore.addToHistory(newBookmark);
          }

          if (this.url) {
            window.location.href = this.url;
          } else {
            this.router.navigate(
              ['/'],
              {
                queryParams: {tab: 'history'}
              });
          }
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
      action: RatingActionType.LIKE,
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


