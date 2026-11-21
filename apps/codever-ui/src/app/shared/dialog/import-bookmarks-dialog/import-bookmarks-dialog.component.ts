import {
  Component,
  Inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import iziToast, { IziToastSettings } from 'izitoast';
import {
  RestoreBookmarksResult,
  UserDataService,
} from '../../../core/user-data.service';
import { UserDataStore } from '../../../core/user/userdata.store';
import { UserData } from '../../../core/model/user-data';

export type BookmarksImportFormat = 'html' | 'json';

const FILE_LABELS: Record<BookmarksImportFormat, string> = {
  html: 'Choose bookmarks html file',
  json: 'Choose Codever JSON export file',
};

const FILE_ACCEPT: Record<BookmarksImportFormat, string> = {
  html: '.html,.xhtml,text/html',
  json: '.json,application/json',
};

const HTTP_PAYLOAD_TOO_LARGE = 413;

@Component({
  selector: 'app-delete-bookmark-dialog',
  templateUrl: './import-bookmarks-dialog.component.html',
  styleUrls: ['./import-bookmarks-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterLink, FormsModule],
})
export class ImportBookmarksDialogComponent implements OnInit {
  format: BookmarksImportFormat = 'html';
  /** Codever JSON only: restore bookmarks marked public as public. */
  keepPublic = false;

  uploadImageLabel = FILE_LABELS.html;
  selectedFileSrc: string;
  errorMessage: string;
  busy = false;

  userId: string;
  userDisplayName: string;

  constructor(
    private userDataStore: UserDataStore,
    private userDataService: UserDataService,
    private dialogRef: MatDialogRef<ImportBookmarksDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.userId = data.userId;
  }

  ngOnInit() {
    this.userDataStore.getUserData$().subscribe((userData: UserData) => {
      this.userDisplayName = userData.profile.displayName;
    });
  }

  get fileAccept(): string {
    return FILE_ACCEPT[this.format];
  }

  onFormatChange(fileInput?: HTMLInputElement) {
    this.uploadImageLabel = FILE_LABELS[this.format];
    this.errorMessage = undefined;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  close() {
    this.dialogRef.close();
  }

  importFile(fileInput: HTMLInputElement) {
    const file: File = fileInput.files?.[0];
    if (!file) {
      return;
    }
    this.errorMessage = undefined;
    this.uploadImageLabel = `${file.name} (${(file.size * 0.000001).toFixed(
      2
    )} MB)`;
    if (this.format === 'json') {
      return this.restoreCodeverJson(file);
    }
    this.uploadBookmarks(file);
  }

  uploadBookmarks(file: File) {
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
              message:
                `${response.created.length} newly created. ` +
                `${response.duplicatesSize} duplicates` +
                (response.inErrorSize > 0
                  ? `. ${response.inErrorSize} could not be imported`
                  : ''),
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

    reader.readAsDataURL(file);
  }

  async restoreCodeverJson(file: File): Promise<void> {
    let bookmarks: unknown;
    try {
      bookmarks = JSON.parse(await file.text());
    } catch (error) {
      this.errorMessage =
        'The file is not valid JSON. Choose a file from the Codever JSON export.';
      return;
    }
    if (!Array.isArray(bookmarks)) {
      this.errorMessage =
        'The file does not contain a list of bookmarks. Choose a file from' +
        ' the Codever JSON export.';
      return;
    }

    this.busy = true;
    this.userDataService
      .restoreBookmarks(
        this.userId,
        bookmarks,
        this.keepPublic,
        this.userDisplayName
      )
      .subscribe({
        next: (response: RestoreBookmarksResult) => {
          this.busy = false;
          iziToast.success({
            title: 'Bookmarks successfully restored',
            timeout: 5000,
            message: this.restoreSummary(response),
          });
          this.dialogRef.close(response);
        },
        error: (error: HttpErrorResponse) => {
          this.busy = false;
          this.errorMessage =
            error?.status === HTTP_PAYLOAD_TOO_LARGE
              ? 'The file is larger than 6 MB. Split it into smaller files' +
                ' and restore them one after the other.'
              : 'There was a problem restoring bookmarks. Please try again later.';
        },
      });
  }

  private restoreSummary(response: RestoreBookmarksResult): string {
    const parts = [
      `${response.created.length} newly created`,
      `${response.duplicatesSize} already existing (kept unchanged)`,
    ];
    if (response.inErrorSize > 0) {
      parts.push(`${response.inErrorSize} not valid`);
    }
    if (response.madePrivateSize > 0) {
      parts.push(
        `${response.madePrivateSize} made private because the URL is already public`
      );
    }
    return parts.join('. ') + '.';
  }
}
