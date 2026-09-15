import { Component } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CodeverBookmarkletComponent } from './codever-bookmarklet/codever-bookmarklet.component';

@Component({
  selector: 'app-howto-bookmarklets',
  templateUrl: './how-to-bookmarklet.component.html',
  styleUrls: ['./how-to-bookmarklet.component.scss'],
  imports: [CodeverBookmarkletComponent],
})
export class HowToBookmarkletComponent {
  environment = environment;
}
