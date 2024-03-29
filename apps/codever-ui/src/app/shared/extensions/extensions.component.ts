import { Component, Input } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-extensions',
  templateUrl: './extensions.component.html',
  styleUrls: ['./extensions.component.scss'],
})
export class ExtensionsComponent {
  environment = environment;

  @Input()
  logoSize = 48;

  @Input()
  showEntryParagraph = true;
}
