import {Component, OnInit} from '@angular/core';
import {Bookmark} from "../../model/bookmark";
import {Location} from "@angular/common";
import {FormGroup, FormBuilder, Validators} from "@angular/forms";
import {BookmarkStore} from "../store/BookmarkStore";
import {KeycloakService} from "../../keycloak/keycloak.service";
import {UserBookmarkStore} from "../../personal/store/UserBookmarkStore";

@Component({
  selector: 'bookmark-form',
  templateUrl: 'bookmark-form.component.html',
  styleUrls: ['./bookmark-form.component.scss']
})
export class BookmarkFormComponent implements OnInit {

  model = new Bookmark('', '', '', [], '');
  bookmarkForm: FormGroup;
  isUserLoggedIn = false;
  userId = null;

  constructor(
    private bookmarkStore: BookmarkStore,
    private userBookmarkStore: UserBookmarkStore,
    private location: Location,
    private formBuilder: FormBuilder,
    private keycloakService: KeycloakService
  ){
    const keycloak = keycloakService.getKeycloak();
    if(keycloak) {
      this.userId = keycloak.subject;
      this.isUserLoggedIn = true;
    }
  }

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

    if(this.isUserLoggedIn){
      newBookmark.userId = this.userId;
      let obs = this.userBookmarkStore.addBookmark(this.userId, newBookmark);

      obs.subscribe(
        res => {
          this.goBack();
        });
    } else {
      let obs = this.bookmarkStore.addBookmark(newBookmark);

      obs.subscribe(
        res => {
          this.goBack();
        });
    }

  }
}
