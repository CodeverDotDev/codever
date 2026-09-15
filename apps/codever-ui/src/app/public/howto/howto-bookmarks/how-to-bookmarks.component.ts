import { Component } from '@angular/core';
import { environment } from '../../../../environments/environment';
import {
  MatTabGroup,
  MatTab,
  MatTabLabel,
  MatTabContent,
} from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { CodeverBookmarkletComponent } from '../howto-bookmarklets/codever-bookmarklet/codever-bookmarklet.component';

@Component({
  selector: 'app-howto-bookmarks',
  templateUrl: './how-to-bookmarks.component.html',
  styleUrls: ['./how-to-bookmarks.component.scss'],
  imports: [
    MatTabGroup,
    MatTab,
    MatTabLabel,
    MatTabContent,
    RouterLink,
    CodeverBookmarkletComponent,
  ],
})
export class HowToBookmarksComponent {
  environment = environment;
}
