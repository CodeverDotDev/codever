import { Component, ChangeDetectionStrategy } from '@angular/core';
import { VERSION } from '../../../environments/version';

@Component({
  selector: 'app-version',
  templateUrl: './version.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./version.component.css'],
})
export class VersionComponent {
  version = VERSION;
}
