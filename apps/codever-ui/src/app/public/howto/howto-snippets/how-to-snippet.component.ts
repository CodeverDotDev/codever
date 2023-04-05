import { Component } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-howto-snippets',
  templateUrl: './how-to-snippet.component.html',
  styleUrls: ['./how-to-snippet.component.scss'],
})
export class HowToSnippetComponent {
  environment = environment;
}
