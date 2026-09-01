import { Component } from '@angular/core';
import { VERSION } from '../../../environments/version';

@Component({
    selector: 'app-version',
    templateUrl: './version.component.html',
    styleUrls: ['./version.component.css'],
    standalone: false
})
export class VersionComponent {
  version = VERSION;
}
