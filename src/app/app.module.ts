import {APP_INITIALIZER, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {HttpModule, JsonpModule} from '@angular/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AppComponent} from './app.component';
import {AppRoutingModule} from './app.routing';
import './rxjs-extensions';
import {SharedModule} from './shared/shared.module';
import {CoreModule} from './core/core.module';
import {PublicBookmarksModule} from './public/public.module';
import {HttpClientModule} from '@angular/common/http';
import {KeycloakAngularModule, KeycloakService} from "keycloak-angular";
import {initializer} from "./app-init";

@NgModule({
  imports: [
    BrowserModule,
    HttpModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    JsonpModule,
    // app modules - notice that PersonalBookmarksModule is not listed, as it is lazy loaded
    SharedModule,
    CoreModule,
    PublicBookmarksModule,
    // routing module
    AppRoutingModule,
    KeycloakAngularModule
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializer,
      multi: true,
      deps: [KeycloakService]
    }
  ],
  declarations: [
    AppComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
