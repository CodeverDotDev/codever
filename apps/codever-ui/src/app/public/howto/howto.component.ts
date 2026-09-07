import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-howto',
    templateUrl: './howto.component.html',
    styleUrls: ['./howto.component.scss'],
    standalone: false
})
export class HowtoComponent {
  environment = environment;
}
