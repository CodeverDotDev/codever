import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  template:
    '  <div id="about-content" class="jumbotron"><h2>Page not found - please verify the URL</h2> </div>',
})
export class PageNotFoundComponent {}
