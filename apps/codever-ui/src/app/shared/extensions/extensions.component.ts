import { Component, Input } from '@angular/core';
import { environment } from '../../../environments/environment';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-extensions',
  templateUrl: './extensions.component.html',
  styleUrls: ['./extensions.component.scss'],
  imports: [RouterLink],
})
export class ExtensionsComponent {
  environment = environment;

  @Input()
  logoSize = 48;

  @Input()
  showEntryParagraph = true;
}
