import {
  enableProdMode,
  provideAppInitializer,
  ErrorHandler,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import {
  platformBrowser,
  BrowserModule,
  bootstrapApplication,
} from '@angular/platform-browser';

import { environment } from './environments/environment';
import {
  provideKeycloak,
  createInterceptorCondition,
  IncludeBearerTokenCondition,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  includeBearerTokenInterceptor,
} from 'keycloak-angular';
import { initializeKeycloakEvents } from './app/app-init';
import { MAT_CHIPS_DEFAULT_OPTIONS } from '@angular/material/chips';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
  withInterceptors,
} from '@angular/common/http';
import { LoaderInterceptorService } from './app/core/loader/loader-interceptor.service';
import { HIGHLIGHT_OPTIONS, HighlightModule } from 'ngx-highlightjs';
import { ChunkLoadErrorHandler } from './app/core/error/chunk-load-error.handler';
import { AppService } from './app/app.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CoreModule } from './app/core/core.module';
import { PublicResourcesModule } from './app/public/public.module';
import { OverlayModule } from '@angular/cdk/overlay';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AppRoutingModule } from './app/app.routing';
import { ServiceWorkerModule } from '@angular/service-worker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppComponent } from './app/app.component';

const bearerTokenUrlCondition =
  createInterceptorCondition<IncludeBearerTokenCondition>({
    urlPattern: new RegExp(
      `^${escapeRegExp(environment.API_URL)}/(?!public)`,
      'i'
    ),
    bearerPrefix: 'Bearer',
  });
const keycloakUrlCondition =
  createInterceptorCondition<IncludeBearerTokenCondition>({
    urlPattern: new RegExp(
      `^${escapeRegExp(environment.keycloak.url)}(/.*)?$`,
      'i'
    ),
    bearerPrefix: 'Bearer',
  });
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
    importProvidersFrom(
      BrowserModule,
      BrowserAnimationsModule,
      ReactiveFormsModule,
      RouterModule,
      CoreModule,
      PublicResourcesModule,
      OverlayModule,
      DragDropModule,
      // routing module
      AppRoutingModule,
      HighlightModule,
      ServiceWorkerModule.register('/ngsw-worker.js', {
        enabled: environment.production,
      }),
      MatTooltipModule
    ),
    provideKeycloak({
      config: {
        url: environment.keycloak.url, // .ie: http://localhost:8080/auth/
        realm: environment.keycloak.realm, // .ie: master
        clientId: environment.keycloak.clientId, // .ie: account
      },
      initOptions: {
        onLoad: 'check-sso',
        checkLoginIframe: false,
        flow: 'standard',
        silentCheckSsoRedirectUri:
          window.location.origin + '/assets/silent-check-sso.html',
      },
      providers: [
        {
          provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
          useValue: [bearerTokenUrlCondition, keycloakUrlCondition],
        },
      ],
    }),
    provideAppInitializer(initializeKeycloakEvents),
    {
      provide: MAT_CHIPS_DEFAULT_OPTIONS,
      useValue: {
        separatorKeyCodes: [ENTER, COMMA],
      },
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoaderInterceptorService,
      multi: true,
    },
    {
      provide: HIGHLIGHT_OPTIONS,
      useValue: {
        fullLibraryLoader: () => import('highlight.js'),
      },
    },
    {
      provide: ErrorHandler,
      useClass: ChunkLoadErrorHandler,
    },
    AppService,
    provideHttpClient(
      withInterceptorsFromDi(),
      withInterceptors([includeBearerTokenInterceptor])
    ),
  ],
}).catch((err) => console.log(err));
