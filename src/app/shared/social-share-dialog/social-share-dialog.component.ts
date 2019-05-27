import { Component, Inject, OnInit } from '@angular/core';
import { Bookmark } from '../../core/model/bookmark';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { UserData } from '../../core/model/user-data';

@Component({
  selector: 'app-social-share-dialog',
  templateUrl: './social-share-dialog.component.html',
  styleUrls: ['./social-share-dialog.component.scss']
})
export class SocialShareDialogComponent implements OnInit {

  public bookmark: Bookmark;
  userData: UserData;
  tagsStr: string;

  constructor(
    private dialogRef: MatDialogRef<SocialShareDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.bookmark = data.bookmark;
    this.tagsStr = this.bookmark.tags.map(tag => {
      return this.prepareTagForTweet(tag);
    }).join(',');
  }

  ngOnInit() {
  }

  cancel() {
    this.dialogRef.close('SHARE_CANCELED');
  }

  onShareButtonClick() {
    console.log('share button cliecked')
    this.dialogRef.close('SHARE_BUTTON_CLICKED');
  }

  /**
   * Multiple word tagsStr are "-" separated for codingmarks. To make them twitter conform we will camel case them
   * e.g. "protocal-buffers" will become "#ProtocalBuffers". For single words #java becomes #Java.
   *
   * @param tag
   */
  private prepareTagForTweet(tag: string): string {
    return tag.split('-').map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join('');
  }
}
