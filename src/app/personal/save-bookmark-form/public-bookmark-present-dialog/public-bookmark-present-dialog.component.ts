import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Bookmark } from '../../../core/model/bookmark';

@Component({
  selector: 'app-delete-bookmarks-by-tag-dialog',
  templateUrl: './public-bookmark-present-dialog.component.html',
  styleUrls: ['./public-bookmark-present-dialog.component.scss']
})
export class PublicBookmarkPresentDialogComponent implements OnInit {

  bookmark: Bookmark;

  constructor(
    private dialogRef: MatDialogRef<PublicBookmarkPresentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.bookmark = data.bookmark;
  }

  ngOnInit() {
  }

  likeBookmark() {
    this.dialogRef.close('LIKE_BOOKMARK');
  }

  close() {
    this.dialogRef.close('LIKE_CANCEL');
  }

}
