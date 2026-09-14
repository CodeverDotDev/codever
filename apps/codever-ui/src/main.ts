import { enableProdMode, provideZoneChangeDetection } from '@angular/core';
import { OVERLAY_DEFAULT_CONFIG } from '@angular/cdk/overlay';
import { platformBrowser } from '@angular/platform-browser';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowser()
  .bootstrapModule(AppModule, {
    applicationProviders: [
      provideZoneChangeDetection(),
      { provide: OVERLAY_DEFAULT_CONFIG, useValue: { usePopover: false } },
    ],
  })
  .catch((err) => console.log(err));
