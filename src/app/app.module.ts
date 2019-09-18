import {APP_INITIALIZER, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {ReactiveFormsModule} from '@angular/forms';
import {AppComponent} from './app.component';
import {AppRoutingModule} from './app.routing';
import {SharedModule} from './shared/shared.module';
import {CoreModule} from './core/core.module';
import {PublicBookmarksModule} from './public/public.module';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {KeycloakAngularModule, KeycloakService} from 'keycloak-angular';
import {initializer} from './app-init';
import {RouterModule} from '@angular/router';
import {PageNotFoundComponent} from './not-found.component';
import {MAT_CHIPS_DEFAULT_OPTIONS, MatChipsModule} from '@angular/material';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {OverlayModule} from '@angular/cdk/overlay';
import {ServiceWorkerModule} from '@angular/service-worker';
import {environment} from '../environments/environment';
import {LoaderInterceptorService} from './core/loader/loader-interceptor.service';
import {LoaderComponent} from './shared/loader/loader.component';
import { SocialButtonsModule } from './social-buttons/social-buttons.module';
import { UserInfoStore } from './core/user/user-info.store';
import { UserDataStore } from './core/user/userdata.store';

@NgModule({
  exports: [
    MatChipsModule
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    RouterModule,
    // app modules - notice that PersonalBookmarksModule is not listed, as it is lazy loaded
    SharedModule,
    CoreModule,
    KeycloakAngularModule,
    PublicBookmarksModule,
    SocialButtonsModule,
    OverlayModule,
    // routing module
    AppRoutingModule,
    ServiceWorkerModule.register('/ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializer,
      multi: true,
      deps: [KeycloakService, UserInfoStore, UserDataStore]
    },
    {
      provide: MAT_CHIPS_DEFAULT_OPTIONS,
      useValue: {
        separatorKeyCodes: [ENTER, COMMA]
      }
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoaderInterceptorService,
      multi: true
    }

  ],
  declarations: [
    AppComponent,
    PageNotFoundComponent,
    LoaderComponent,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
