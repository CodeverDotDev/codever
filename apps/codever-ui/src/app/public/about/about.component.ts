import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ExtensionsComponent } from '../../shared/extensions/extensions.component';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  imports: [ExtensionsComponent],
})
export class AboutComponent {
  environment = environment;
}
