import { Component } from '@angular/core';

import { ApiService } from './shared';

import '../style/app.scss';

@Component({
  selector: 'my-app', // <my-app></my-app>
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss', './app.forms.scss'],
})
export class AppComponent {
  url = 'https://github.com/Codingpedia/bookmarks';

  constructor(private api: ApiService) {
    // Do something with api
  }
}
