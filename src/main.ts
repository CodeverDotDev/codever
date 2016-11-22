import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import {KeycloakService} from "./app/keycloak/keycloak.service";

// depending on the env mode, enable prod mode or add debugging modules
if (process.env.ENV === 'build') {
  enableProdMode();
}

export function main() {
  KeycloakService.init()
    .then(() => {
      const platform = platformBrowserDynamic();
      return platform.bootstrapModule(AppModule);
    })
    .catch(() => window.location.reload());
}

if (document.readyState === 'complete') {
  main();
} else {
  document.addEventListener('DOMContentLoaded', main);
}
