import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Bookmark } from '../../../core/model/bookmark';
import { Router } from '@angular/router';

@Component({
  selector: 'app-public-bookmark-present-dialog',
  templateUrl: './public-bookmark-present-dialog.component.html',
  styleUrls: ['./public-bookmark-present-dialog.component.scss'],
})
export class PublicBookmarkPresentDialogComponent {
  bookmark: Bookmark;

  constructor(
    private router: Router,
    private dialogRef: MatDialogRef<PublicBookmarkPresentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.bookmark = data.bookmark;
  }
  copyToMine() {
    this.dialogRef.close('COPY_TO_MINE');
    const link = [`./my-bookmarks/${this.bookmark._id}/copy-to-mine`];
    this.router.navigate(link, {
      state: { bookmark: this.bookmark },
      queryParams: { hidePublicCheckbox: true },
    });
  }

  likeBookmark() {
    this.dialogRef.close('LIKE_BOOKMARK');
  }

  close() {
    this.dialogRef.close('LIKE_CANCEL');
  }
}
