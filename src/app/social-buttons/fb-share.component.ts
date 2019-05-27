import { AfterViewInit, Component, Input } from '@angular/core';

/**
 * https://developers.facebook.com/docs/plugins/share-button/
 */

@Component({
  selector: 'fb-share',
  template: `
    <div class="fb-share-button"
         [attr.data-href]="url"
         data-layout="button_count"
         data-share="true">
    </div>`
})
export class FbShareComponent implements AfterViewInit {
  @Input() url = location.href;

  constructor() {
    // initialise facebook sdk after it loads if required
    if (!window['fbAsyncInit']) {
      window['fbAsyncInit'] = function () {
        window['FB'].init({
          appId: 'your-app-id',
          autoLogAppEvents: true,
          xfbml: true,
          version: 'v3.0'
        });
      };
    }

    // load facebook sdk if required
    const url = 'https://connect.facebook.net/en_US/sdk.js';
    if (!document.querySelector(`script[src='${url}']`)) {
      const script = document.createElement('script');
      script.src = url;
      document.body.appendChild(script);
    }
  }

  ngAfterViewInit(): void {
    // render facebook button
    window['FB'] && window['FB'].XFBML.parse();
  }
}
