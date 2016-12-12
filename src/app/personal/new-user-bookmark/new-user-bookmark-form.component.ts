import {Component, OnInit} from "@angular/core";
import {Bookmark} from "../../model/bookmark";
import {Location} from "@angular/common";
import {FormGroup, FormBuilder, Validators} from "@angular/forms";
import {KeycloakService} from "../../keycloak/keycloak.service";
import {UserBookmarkStore} from "../../personal/store/UserBookmarkStore";

@Component({
  selector: 'user-bookmark-form',
  templateUrl: 'new-user-bookmark-form.component.html'
})
export class UserBookmarkFormComponent implements OnInit {

  model = new Bookmark('', '', '', [], '');
  bookmarkForm: FormGroup;
  userId = null;

  constructor(
    private userBookmarkStore: UserBookmarkStore,
    private location: Location,
    private formBuilder: FormBuilder,
    private keycloakService: KeycloakService
  ){
    const keycloak = keycloakService.getKeycloak();
    if(keycloak) {
      this.userId = keycloak.subject;
    }
  }

  ngOnInit(): void {
    this.bookmarkForm = this.formBuilder.group({
      name: ['', Validators.required],
      location: ['', Validators.required],
      category: ['', Validators.required],
      tagsLine:['', Validators.required],
      description:'',
      shared: false
    });
  }

  goBack(): void {
    this.location.back();
  }

  saveBookmark(model: Bookmark, isValid: boolean) {
    model.tags = model.tagsLine.split(",");
    var newBookmark = new Bookmark(model.name, model.location, model.category,model.tagsLine.split(","), model.description);

    newBookmark.userId = this.userId;
    newBookmark.shared = model.shared;

    let obs = this.userBookmarkStore.addBookmark(this.userId, newBookmark);

    obs.subscribe(
      res => {
        this.goBack();
      });
  }
}
