import {Component, OnInit} from "@angular/core";
import {Bookmark} from "../../model/bookmark";
import {FormGroup, FormBuilder, Validators, FormControl} from "@angular/forms";
import {KeycloakService} from "../../keycloak/keycloak.service";
import {UserBookmarkStore} from "../../personal/store/UserBookmarkStore";
import {Router} from "@angular/router";
import {BookmarkService} from "../../bookmark/bookmark.service";

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
    private router: Router,
    private formBuilder: FormBuilder,
    private keycloakService: KeycloakService,
    private bookmarkService: BookmarkService
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
      tagsLine:['', Validators.required],
      description:'',
      shared: false
    });

    //this.location = this.bookmarkForm.controls.['location'];

    /*
    this.location.valueChanges.subscribe(data => {
      console.log('Location value changes', data);
    });
    */

 /*
    this.bookmarkForm.valueChanges
      .debounceTime(800)
      .distinctUntilChanged()
      .subscribe(formData => {
        if(formData.location){
          console.log('location changed', formData);
          this.bookmarkService.getBookmarkTitle(formData.location).subscribe(response => {
            console.log('Respoooooooonse: ', response);
            if(response){
              this.bookmarkForm.patchValue({name:response.title});
            }
          });
        }
    });
    */

    this.bookmarkForm.valueChanges
      //.debounceTime(800)
      //.distinctUntilChanged()
      .subscribe(formData => {
        if(formData.location){
          console.log('location changed', formData);
          this.bookmarkService.getBookmarkTitle(formData.location).subscribe(response => {
            console.log('Respoooooooonse: ', response);
            if(response){
              this.bookmarkForm.patchValue({name:response.title});
            }
          });
        }
      });
  }

  saveBookmark(model: Bookmark, isValid: boolean) {
    model.tags = model.tagsLine.split(",");
    var newBookmark = new Bookmark(model.name, model.location, model.category,model.tagsLine.split(","), model.description);

    newBookmark.userId = this.userId;
    newBookmark.shared = model.shared;

    let obs = this.userBookmarkStore.addBookmark(this.userId, newBookmark);

    obs.subscribe(
      res => {
        this.router.navigate(['/personal']);
      });
  }
}
