import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { Bookmark } from '../../../core/model/bookmark';

@Component({
  selector: 'app-play-youtube-video-dialog',
  templateUrl: './play-youtube-video-dialog.component.html',
  styleUrls: ['./play-youtube-video-dialog.component.scss'],
})
export class PlayYoutubeVideoDialogComponent {
  bookmark: Bookmark;
  safeUrl: any;

  constructor(
    private dialogRef: MatDialogRef<PlayYoutubeVideoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data,
    private _sanitizer: DomSanitizer
  ) {
    this.bookmark = data.bookmark;
    this.safeUrl = this._sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${this.bookmark.youtubeVideoId}`
    );
  }

  close() {
    this.dialogRef.close('Play Youtube Video Closed');
  }
}
