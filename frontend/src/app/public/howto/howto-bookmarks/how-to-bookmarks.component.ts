import { Component, OnInit } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-howto-bookmarks',
  templateUrl: './how-to-bookmarks.component.html',
  styleUrls: ['./how-to-bookmarks.component.scss'],
})
export class HowToBookmarksComponent implements OnInit {
  environment = environment;

  ngOnInit() {}
}
