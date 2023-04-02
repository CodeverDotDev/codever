import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserData } from '../../../core/model/user-data';
import { UserDataStore } from '../../../core/user/userdata.store';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { UserDataService } from '../../../core/user-data.service';
import { PersonalBookmarksService } from '../../../core/personal-bookmarks.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class UserProfileComponent implements OnInit {
  userProfileForm: FormGroup;

  profileImageChangedStatus = 'init';
  uploadImageLabel = 'Choose file (max size 1MB)';
  private imageFileIsTooBig = false;
  selectedFileSrc: string;

  formSetup = false;

  @Input()
  userData$: Observable<UserData>;
  private userData: UserData;

  constructor(
    private formBuilder: FormBuilder,
    private userDataStore: UserDataStore,
    private userDataService: UserDataService,
    private personalBookmarksService: PersonalBookmarksService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userData$.subscribe((userData) => {
      this.userData = userData;
      if (!this.formSetup) {
        this.buildForm(this.userData);
        this.formSetup = true;
      }
    });
  }

  private buildForm(userData: UserData) {
    this.userProfileForm = this.formBuilder.group({
      displayName: [
        userData.profile.displayName || '',
        Validators.compose([Validators.required, Validators.maxLength(30)]),
      ],
      summary: [userData.profile.summary || '', Validators.maxLength(200)],
      websiteLink: userData.profile.websiteLink || '',
      githubLink: userData.profile.githubLink || '',
      twitterLink: userData.profile.twitterLink || '',
      linkedinLink: userData.profile.linkedinLink || '',
      imageUrl: userData.profile.imageUrl,
    });

    this.userProfileForm.valueChanges.subscribe((data) =>
      console.log('form changes', data)
    );
  }

  onSubmit() {
    this.userData.profile = this.userProfileForm.value;

    this.userDataStore.updateUserData$(this.userData).subscribe(() => {
      const displayName = this.userProfileForm.get('displayName').value;
      if (this.userProfileForm.get('displayName').dirty) {
        this.personalBookmarksService
          .updateDisplayNameInBookmarks(this.userData.userId, displayName)
          .subscribe();
      }

      this.navigateToUserProfile(displayName);
    });
  }

  navigateToUserProfile(displayName: string): void {
    this.router.navigateByUrl(`/users/${this.userData.userId}/${displayName}`);
  }

  changeImage(imageInput: HTMLInputElement) {
    const file: File = imageInput.files[0];
    this.uploadImageLabel = `${file.name} (${(file.size * 0.000001).toFixed(
      2
    )} MB)`;
    if (file.size > 1048576) {
      this.imageFileIsTooBig = true;
    } else {
      this.imageFileIsTooBig = false;
      const reader = new FileReader();

      reader.addEventListener('load', (event: any) => {
        this.selectedFileSrc = event.target.result;
        this.userDataService
          .uploadProfileImage(this.userData.userId, file)
          .subscribe(
            (response) => {
              this.userData.profile.imageUrl = response.url;
              this.userDataStore.updateUserData$(this.userData).subscribe(
                () => {
                  this.profileImageChangedStatus = 'ok';
                },
                () => {
                  this.profileImageChangedStatus = 'fail';
                }
              );
            },
            () => {
              this.profileImageChangedStatus = 'fail';
            }
          );
      });

      if (file) {
        reader.readAsDataURL(file);
      }
    }
  }
}
