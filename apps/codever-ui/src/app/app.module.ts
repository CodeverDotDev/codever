import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app.routing';
import { SharedModule } from './shared/shared.module';
import { CoreModule } from './core/core.module';
import { PublicResourcesModule } from './public/public.module';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import {
  KeycloakAngularModule,
  KeycloakEventType,
  KeycloakService,
} from 'keycloak-angular';
import { initializer } from './app-init';
import { RouterModule } from '@angular/router';
import { PageNotFoundComponent } from './not-found.component';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { OverlayModule } from '@angular/cdk/overlay';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { LoaderInterceptorService } from './core/loader/loader-interceptor.service';
import { LoaderComponent } from './shared/loader/loader.component';
import { SocialButtonsModule } from './social-buttons/social-buttons.module';
import { UserInfoStore } from './core/user/user-info.store';
import { UserDataStore } from './core/user/userdata.store';
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
import { SnippetNotFoundComponent } from './not-found/snippet-not-found.component';
import { SystemService } from './core/cache/system.service';
import { NewEntryComponent } from './new-entry/new-entry.component';

function initializeKeycloak(
  keycloak: KeycloakService,
  userInfoStore: UserInfoStore,
  userDataStore: UserDataStore,
  _systemService: SystemService
) {
  return () => {
    _systemService.checkVersion();
    keycloak.keycloakEvents$.subscribe((event) => {
      if (event.type === KeycloakEventType.OnAuthSuccess) {
        userInfoStore.getUserInfoOidc$().subscribe((userInfo) => {
          userDataStore.loadInitialUserDataFromDb(
            userInfo.sub,
            userInfo.given_name,
            userInfo.email
          );
          console.log('load initial userInfo');
        });
      }
      if (event.type === KeycloakEventType.OnAuthLogout) {
        this.userDataStore.resetUserDataStore();
      }
      if (event.type === KeycloakEventType.OnTokenExpired) {
        keycloak.updateToken(20);
      }
    });

    keycloak.init({
      config: {
        url: environment.keycloak.url, // .ie: http://localhost:8080/auth/
        realm: environment.keycloak.realm, // .ie: master
        clientId: environment.keycloak.clientId, // .ie: account
      },
      initOptions: {
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri:
          window.location.origin + '/assets/silent-check-sso.html',
      },
      bearerExcludedUrls: ['/api/public', '/assets'],
    });
  };
}

@NgModule({
  exports: [MatChipsModule],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    RouterModule,
    // app modules - notice that MyBookmarksModule is not listed, as it is lazy loaded
    SharedModule,
    CoreModule,
    KeycloakAngularModule,
    PublicResourcesModule,
    SocialButtonsModule,
    OverlayModule,
    // routing module
    AppRoutingModule,
    HighlightModule,
    ServiceWorkerModule.register('/ngsw-worker.js', {
      enabled: environment.production,
    }),
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializer,
      multi: true,
      deps: [KeycloakService, UserInfoStore, UserDataStore, SystemService],
    },
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
    AppService,
  ],
  declarations: [
    AppComponent,
    PageNotFoundComponent,
    SnippetNotFoundComponent,
    LoaderComponent,
    NewEntryComponent,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
