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
  selector: 'app-howto-notes',
  templateUrl: './how-to-notes.component.html',
  styleUrls: ['./how-to-notes.component.scss'],
  imports: [
    MatTabGroup,
    MatTab,
    MatTabLabel,
    MatTabContent,
    RouterLink,
    CodeverBookmarkletComponent,
  ],
})
export class HowToNotesComponent {
  environment = environment;
}
