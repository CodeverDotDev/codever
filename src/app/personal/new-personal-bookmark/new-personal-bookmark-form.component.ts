import {Component, NgZone, OnInit} from '@angular/core';
import {Bookmark} from '../../core/model/bookmark';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {KeycloakService} from '../../core/keycloak/keycloak.service';
import {PersonalBookmarksStore} from '../../core/store/PersonalBookmarksStore';
import {Router} from '@angular/router';
import {BookmarkService} from '../../public/bookmark/bookmark.service';
import {MarkdownService} from '../markdown.service';
import {HttpErrorResponse} from '@angular/common/http';

@Component({
  selector: 'new-personal-bookmark-form',
  templateUrl: './new-personal-bookmark-form.component.html'
})
export class NewPersonalBookmarkFormComponent implements OnInit {

  private model: any;
  bookmarkForm: FormGroup;
  userId = null;

  displayModal = 'none';
  makePublic = false;
  personalBookmarkPresent = false;

  constructor(
    private personalBookmarksStore: PersonalBookmarksStore,
    private router: Router,
    private formBuilder: FormBuilder,
    private keycloakService: KeycloakService,
    private bookmarkService: BookmarkService,
    private markdownServce: MarkdownService,
    private zone: NgZone
  ) {
    const keycloak = keycloakService.getKeycloak();
    if (keycloak) {
      this.userId = keycloak.subject;
    }
  }

  ngOnInit(): void {
    this.buildForm();
  }

  buildForm(): void {
    this.bookmarkForm = this.formBuilder.group({
      name: ['', Validators.required],
      location: ['', Validators.required],
      tagsLine: ['', Validators.required],
      publishedOn: null,
      githubURL: '',
      description: '',
      shared: false,
      language: 'en'
    });

    this.bookmarkForm.controls['location'].valueChanges
      .debounceTime(400)
      .distinctUntilChanged()
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
    model.tags = model.tagsLine.split(',').map(function(item) {
      return item.trim().replace(' ', '-'); // replace spaces between words (if any) in a tag with dashes
    });

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
      starredBy: []
  };

    const obs = this.personalBookmarksStore.addBookmark(this.userId, newBookmark);

    obs.subscribe(
      res => {
        this.zone.run(() => {
          console.log('ZONE RUN for initial load of bookmarks'); // need to investigate this, or merge it with the async list stuff....
        });
        this.router.navigate(['/personal']);
      });
  }

  onClickMakePublic(checkboxValue) {
    if (checkboxValue) {
      this.makePublic = true;
      const location: string = this.bookmarkForm.controls['location'].value;
      this.bookmarkService.getPublicBookmarkByLocation(location).subscribe(response => {
        if (response) {
          console.log(response);
          this.displayModal = 'block';
        }
      },
        (err: HttpErrorResponse) => {
          if (err.error instanceof Error) {
            // A client-side or network error occurred. Handle it accordingly.
            console.log('An error occurred:', err.error.message);
          } else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong,
            console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
          }
        }
      );
    }
  }

  onStarClick() {
    console.log('Starred the bookmark');
    this.displayModal = 'none';
    this.makePublic = false;
  }

  onCancelClick() {
    this.displayModal = 'none';
    this.makePublic = false;
  }

}
