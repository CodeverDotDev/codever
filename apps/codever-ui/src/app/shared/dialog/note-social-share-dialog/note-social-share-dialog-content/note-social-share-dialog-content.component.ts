import { Component, Input, OnChanges } from '@angular/core';
import { Note } from '../../../../core/model/note';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-note-social-share-dialog-content',
  templateUrl: './note-social-share-dialog-content.component.html',
})
export class NoteSocialShareDialogContentComponent implements OnChanges {
  @Input()
  shareableUrl: string;

  @Input()
  note: Note;

  tweetText: string;
  tagsStr: string;
  copyLinkButtonText = 'Copy shareable link';

  constructor(private clipboard: Clipboard) {}

  ngOnChanges() {
    if (this.note && this.note.public) {
      this.tagsStr = this.note.tags
        .map((tag) => this.prepareTagForTweet(tag))
        .join(',');
      this.tweetText = this.note.title + '\n';
      this.copyLinkButtonText = 'Copy link';
    }
  }

  private prepareTagForTweet(tag: string): string {
    return tag
      .split('-')
      .map((word) => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('');
  }

  copyToClipboard(location: string) {
    const copied = this.clipboard.copy(location);
    if (copied) {
      this.copyLinkButtonText = 'Copied';
      setTimeout(() => (this.copyLinkButtonText = 'Link'), 1300);
    }
  }
}

