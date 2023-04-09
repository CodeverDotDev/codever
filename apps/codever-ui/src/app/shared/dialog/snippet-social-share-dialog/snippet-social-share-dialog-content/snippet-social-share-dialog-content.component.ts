import { Component, Input, OnChanges } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Snippet } from '../../../../core/model/snippet';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-snippet-social-share-dialog-content',
  templateUrl: './snippet-social-share-dialog-content.component.html',
  providers: [DatePipe],
})
export class SnippetSocialShareDialogContentComponent implements OnChanges {
  @Input()
  shareableUrl: string;

  @Input()
  snippet: Snippet;

  tweetText: string;
  tagsStr: string;
  copyLinkButtonText = 'Copy shareable link';

  constructor(private clipboard: Clipboard) {}

  ngOnChanges() {
    if (this.snippet) {
      if (this.snippet.public) {
        this.tagsStr = this.snippet.tags
          .map((tag) => {
            return this.prepareTagForTweet(tag);
          })
          .join(',');
        this.tweetText = this.snippet.title + '\n';
        this.copyLinkButtonText = 'Copy link';
      }
    }
  }

  /**
   * Multiple word tagsStr are "-" separated for resources. To make them twitter conform we will camel case them
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

  copyToClipboard(location: string) {
    const copied = this.clipboard.copy(location);
    if (copied) {
      this.copyLinkButtonText = 'Copied';
      setTimeout(() => (this.copyLinkButtonText = 'Link'), 1300);
    }
  }
}
