import { Component, ElementRef, AfterViewInit, Input } from '@angular/core';

@Component({
  selector: 'tweet',
  template: `<a class="twitter-share-button"
                href="https://twitter.com/intent/tweet"

                [attr.data-size]="small"
                [attr.data-text]="text"
                [attr.data-url]="url"
                [attr.data-hashtags]="hashTags"
                [attr.data-via]="via"
                [attr.related]="related"
                >
            </a>`
})

/**
 * Twitter links:
 * https://developer.twitter.com/en/docs/twitter-for-websites/tweet-button/overview.html
 *
 * Tweet Button parameters
 * https://developer.twitter.com/en/docs/twitter-for-websites/tweet-button/guides/parameter-reference1
 *
 * Javascript dynamic embedd
 * https://developer.twitter.com/en/docs/twitter-for-websites/tweet-button/guides/javascript-factory-function
 */
export class TweetComponent implements AfterViewInit {
  @Input() text = '';
  @Input() url = location.href;
  @Input() hashTags = '';
  @Input() via = 'BookmarksDev';
  @Input() related = '';


  constructor() {
    // load twitter sdk if required
    const url = 'https://platform.twitter.com/widgets.js';
    if (!document.querySelector(`script[src='${url}']`)) {
      const script = document.createElement('script');
      script.src = url;
      document.body.appendChild(script);
    }
  }

  ngAfterViewInit(): void {
    // render tweet button
    window['twttr'] && window['twttr'].widgets.load();
  }
}

