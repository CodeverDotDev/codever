import { Component, Inject, OnInit } from '@angular/core';
import { Bookmark } from '../../../core/model/bookmark';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserData } from '../../../core/model/user-data';
import { DatePipe } from '@angular/common';
import { PersonalBookmarksService } from '../../../core/personal-bookmarks.service';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-social-share-dialog',
  templateUrl: './social-share-dialog.component.html',
  providers: [DatePipe],
})
export class SocialShareDialogComponent implements OnInit {
  userIsLoggedIn: boolean;
  userOwnsBookmark: boolean;
  shareableId$: Observable<any>;
  public bookmark: Bookmark;
  userData: UserData;
  tagsStr: string;
  tweetText: string;
  copyLinkButtonText = 'Link';
  copyLinkButtonShareableText = 'Copy';
  readonly environment = environment;

  constructor(
    private datePipe: DatePipe,
    private dialogRef: MatDialogRef<SocialShareDialogComponent>,
    private personalBookmarksService: PersonalBookmarksService,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.bookmark = data.bookmark;
    this.userIsLoggedIn = data.userIsLoggedIn;
    this.userOwnsBookmark = data.userOwnsBookmark;
    this.shareableId$ = this.personalBookmarksService.createOrGetShareableId(
      data.userId,
      this.bookmark._id
    );
    this.tagsStr = this.bookmark.tags
      .map((tag) => {
        return this.prepareTagForTweet(tag);
      })
      .join(',');
    this.tweetText = this.bookmark.name + '\n';
    if (this.bookmark.publishedOn) {
      this.tweetText +=
        'Published on ' +
        this.datePipe.transform(this.bookmark.publishedOn, 'yyyy-MM-dd') +
        '\n';
    }
    if (this.bookmark.sourceCodeURL) {
      this.tweetText += 'Source code ' + this.bookmark.sourceCodeURL + '\n\n';
    }
  }

  ngOnInit() {}

  cancel() {
    this.dialogRef.close('SHARE_CANCELED');
  }

  onShareButtonClick() {
    this.dialogRef.close('SHARE_BUTTON_CLICKED');
  }

  /**
   * Multiple word tagsStr are "-" separated for codingmarks. To make them twitter conform we will camel case them
   * e.g. "protocal-buffers" will become "#ProtocalBuffers". For single words #java becomes #Java.
   *
   * @param tag
   */
  private prepareTagForTweet(tag: string): string {
    return tag
      .split('-')
      .map((word) => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('');
  }

  copyToClipboard(location: string, trigger: string) {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = location;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    const copyResult = document.execCommand('copy');
    if (copyResult) {
      if (trigger === 'linkButton') {
        this.copyLinkButtonText = 'Copied';
        setTimeout(() => (this.copyLinkButtonText = 'Link'), 1300);
      } else {
        // trigger === 'shareableLinkButton'
        this.copyLinkButtonShareableText = 'Copied';
        setTimeout(() => (this.copyLinkButtonShareableText = 'Copy'), 1300);
      }
    }
    document.body.removeChild(selBox);
  }
}
