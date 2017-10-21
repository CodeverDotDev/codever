import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import {KeycloakService} from './keycloak.service';
import {AsyncSubject} from 'rxjs/AsyncSubject';
import 'rxjs/add/operator/mergeMap';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private keycloakService: KeycloakService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.keycloakService.isLoggedIn()) {
      return next.handle(req);
    } else {
      return this.setAuthHeader(req).flatMap((modifiedReq) => {
        const newReq = req.clone(modifiedReq);
        return next.handle(newReq);
      });
    }


/*    const auth = this.keycloakService.getKeycloak();

    if (auth && auth.token) {
       auth.updateToken(30).success((resolve, reject) => {
        const authReq = req.clone({setHeaders: {Authorization: 'bearer ' + auth.token}});
        resolve();
        return next.handle(authReq);
      }).error(() => {
        reject();
      });
    } else {
      return next.handle(req);
    }*/
/*    if (this.keycloakService.isLoggedIn()) {

    } else {
      return next.handle(req);
    }*/
  }

  private setAuthHeader(req: HttpRequest<any>): Observable<HttpRequest<any>> {
    const subject = new AsyncSubject<HttpRequest<any>>();

    const auth = this.keycloakService.getKeycloak();

    if (auth && auth.token) {
      auth.updateToken(30).success(() => {
        const authReq = req.clone({headers: req.headers.set('Authorization', 'Bearer ' + auth.token)});
        subject.next(authReq);
        subject.complete();
      }).error(() => {
        console.error('Failed to update token');
        subject.complete();
      });
    } else {
      // not authenticated redirect to login
      this.keycloakService.login();
    }
    return subject;
  }

}
