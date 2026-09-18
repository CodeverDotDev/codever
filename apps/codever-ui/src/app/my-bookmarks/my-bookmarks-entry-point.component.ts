import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  template: ` <router-outlet /> `,
  imports: [RouterOutlet],
})
export class MyBookmarksEntryPointComponent {}
