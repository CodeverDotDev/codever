import { Component } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-howto-bookmarklets',
  templateUrl: './how-to-bookmarklet.component.html',
  styleUrls: ['./how-to-bookmarklet.component.scss'],
})
export class HowToBookmarkletComponent {
  environment = environment;
}
