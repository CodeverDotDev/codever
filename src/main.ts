import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import {KeycloakService} from './app/core/keycloak/keycloak.service';

if (environment.production) {
  enableProdMode();
}

KeycloakService.initKeycloak()
  .then(() => platformBrowserDynamic().bootstrapModule(AppModule))
  .catch(e => window.location.reload());
