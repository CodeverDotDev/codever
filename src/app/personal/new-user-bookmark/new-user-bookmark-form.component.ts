import {Component, OnInit} from "@angular/core";
import {Bookmark} from "../../model/bookmark";
import {FormGroup, FormBuilder, Validators} from "@angular/forms";
import {KeycloakService} from "../../core/keycloak/keycloak.service";
import {UserBookmarkStore} from "../../personal/store/UserBookmarkStore";
import {Router} from "@angular/router";
import {BookmarkService} from "../../bookmark/bookmark.service";
import {MarkdownService} from "../markdown.service";

@Component({
  selector: 'user-bookmark-form',
  templateUrl: 'new-user-bookmark-form.component.html'
})
export class UserBookmarkFormComponent implements OnInit {

  model = new Bookmark('', '', '', [], '',  '');
  bookmarkForm: FormGroup;
  userId = null;

  constructor(
    private userBookmarkStore: UserBookmarkStore,
    private router: Router,
    private formBuilder: FormBuilder,
    private keycloakService: KeycloakService,
    private bookmarkService: BookmarkService,
    private markdownServce: MarkdownService
  ){
    const keycloak = keycloakService.getKeycloak();
    if(keycloak) {
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
      tagsLine:['', Validators.required],
      description:'',
      shared: false
    });

    this.bookmarkForm.controls['location'].valueChanges
      .debounceTime(400)
      .distinctUntilChanged()
      .subscribe(location => {
        console.log('Location: ', location);
        this.bookmarkService.getBookmarkTitle(location).subscribe(response => {
          if(response){
            this.bookmarkForm.controls['name'].patchValue(response.title, {emitEvent : false});
          }
        });
      });
  }

  saveBookmark(model: Bookmark) {
    model.tags = model.tagsLine.split(",");
    var newBookmark = new Bookmark(model.name, model.location, model.category,model.tagsLine.split(","), model.description, null);

    newBookmark.userId = this.userId;
    newBookmark.shared = model.shared;

    newBookmark.descriptionHtml = this.markdownServce.toHtml(newBookmark.description);

    let obs = this.userBookmarkStore.addBookmark(this.userId, newBookmark);

    obs.subscribe(
      res => {
        console.log(res);
        this.router.navigate(['/personal']);
      });
  }
}
