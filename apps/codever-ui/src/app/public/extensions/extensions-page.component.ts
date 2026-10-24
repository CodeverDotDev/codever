import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ExtensionsComponent } from '../../shared/extensions/extensions.component';

@Component({
  selector: 'app-extensions-page',
  templateUrl: './extensions-page.component.html',
  styleUrls: ['./extensions-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ExtensionsComponent],
})
export class ExtensionsPageComponent {}
