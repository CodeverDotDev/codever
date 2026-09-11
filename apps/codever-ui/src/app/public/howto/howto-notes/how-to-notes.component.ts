import { Component } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-howto-notes',
    templateUrl: './how-to-notes.component.html',
    styleUrls: ['./how-to-notes.component.scss'],
    standalone: false
})
export class HowToNotesComponent {
  environment = environment;
}

