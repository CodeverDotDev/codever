import { Component } from '@angular/core';
import { VERSION } from 'environments/version';

@Component({
  selector: 'app-version',
  templateUrl: './version.component.html',
  styleUrls: ['./version.component.css'],
})
export class VersionComponent {
  version = VERSION;
}
