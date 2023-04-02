import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import iziToast, { IziToastSettings } from 'izitoast';
import { UserDataService } from '../../../core/user-data.service';
import { UserDataStore } from '../../../core/user/userdata.store';
import { UserData } from '../../../core/model/user-data';

@Component({
  selector: 'app-delete-bookmark-dialog',
  templateUrl: './import-bookmarks-dialog.component.html',
  styleUrls: ['./import-bookmarks-dialog.component.scss'],
})
export class ImportBookmarksDialogComponent implements OnInit {
  uploadImageLabel = 'Choose bookmarks html file';
  selectedFileSrc: string;

  userId: string;
  userDisplayName: string;

  constructor(
    private userDataStore: UserDataStore,
    private userDataService: UserDataService,
    private dialogRef: MatDialogRef<ImportBookmarksDialogComponent>,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    const currentDate = new Date();
    this.userId = data.userId;
  }

  ngOnInit() {
    this.userDataStore.getUserData$().subscribe((userData: UserData) => {
      this.userDisplayName = userData.profile.displayName;
    });
  }

  close() {
    this.dialogRef.close();
  }

  download() {}

  uploadBookmarks(fileInput: HTMLInputElement) {
    const file: File = fileInput.files[0];
    this.uploadImageLabel = `${file.name} (${(file.size * 0.000001).toFixed(
      2
    )} MB)`;
    {
      const reader = new FileReader();

      reader.addEventListener('load', (event: any) => {
        this.selectedFileSrc = event.target.result;
        this.userDataService
          .uploadBookmarks(this.userId, file, this.userDisplayName)
          .subscribe(
            (response: any) => {
              const iziToastSettings: IziToastSettings = {
                title: 'Bookmarks successfully imported',
                timeout: 5000,
                message: `${response.created.length} newly created. ${response.duplicatesSize} duplicates`,
              };
              iziToast.success(iziToastSettings);
              this.dialogRef.close(response);
            },
            () => {
              const iziToastSettings: IziToastSettings = {
                title:
                  'There was a problem importing bookmarks. Please try again later.',
              };
              iziToast.error(iziToastSettings);
            }
          );
      });

      if (file) {
        reader.readAsDataURL(file);
      }
    }
  }
}
