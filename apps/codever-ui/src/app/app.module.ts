import { ErrorHandler, NgModule, provideAppInitializer } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app.routing';
import { SharedModule } from './shared/shared.module';
import { CoreModule } from './core/core.module';
import { PublicResourcesModule } from './public/public.module';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  createInterceptorCondition,
  includeBearerTokenInterceptor,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  IncludeBearerTokenCondition,
  provideKeycloak,
} from 'keycloak-angular';
import { initializeKeycloakEvents } from './app-init';
import { RouterModule } from '@angular/router';
import { PageNotFoundComponent } from './not-found.component';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { OverlayModule } from '@angular/cdk/overlay';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { LoaderInterceptorService } from './core/loader/loader-interceptor.service';
import { LoaderComponent } from './shared/loader/loader.component';
import { SocialButtonsModule } from './social-buttons/social-buttons.module';
import { AppService } from './app.service';
import {
  HIGHLIGHT_OPTIONS,
  HighlightModule,
  HighlightOptions,
} from 'ngx-highlightjs';
import {
  MAT_CHIPS_DEFAULT_OPTIONS,
  MatChipsModule,
} from '@angular/material/chips';
import { NoteNotFoundComponent } from './not-found/note-not-found.component';
import { NewEntryComponent } from './new-entry/new-entry.component';
import { QuickAccessResourcesComponent } from './left-navigation-menu/quick-access-resources.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChunkLoadErrorHandler } from './core/error/chunk-load-error.handler';

/** Escapes a string so it can be embedded literally inside a `RegExp`. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Attach the Keycloak bearer token to API calls, except the public endpoints
 * (`/api/public/**`). This replaces the legacy `bearerExcludedUrls` allow/deny
 * list: the v19 interceptor uses an include (allow-list) pattern instead.
 */
const bearerTokenUrlCondition =
  createInterceptorCondition<IncludeBearerTokenCondition>({
    urlPattern: new RegExp(
      `^${escapeRegExp(environment.API_URL)}/(?!public)`,
      'i'
    ),
    bearerPrefix: 'Bearer',
  });

/**
 * Attach the Keycloak bearer token to direct calls to the Keycloak server made
 * via HttpClient — notably the OIDC `userinfo` endpoint used by `UserInfoStore`.
 * (keycloak-js handles token/logout requests itself, outside Angular's HttpClient.)
 */
const keycloakUrlCondition =
  createInterceptorCondition<IncludeBearerTokenCondition>({
    urlPattern: new RegExp(
      `^${escapeRegExp(environment.keycloak.url)}(/.*)?$`,
      'i'
    ),
    bearerPrefix: 'Bearer',
  });

@NgModule({ exports: [MatChipsModule],
    declarations: [
        AppComponent,
        QuickAccessResourcesComponent,
        PageNotFoundComponent,
        NoteNotFoundComponent,
        LoaderComponent,
        NewEntryComponent,
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        RouterModule,
        // app modules - notice that MyBookmarksModule is not listed, as it is lazy loaded
        SharedModule,
        CoreModule,
        PublicResourcesModule,
        SocialButtonsModule,
        OverlayModule,
        DragDropModule,
        // routing module
        AppRoutingModule,
        HighlightModule,
        ServiceWorkerModule.register('/ngsw-worker.js', {
            enabled: environment.production,
        }),
        MatTooltipModule], providers: [
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
    ] })
export class AppModule {}
