import {Injectable, NgZone} from "@angular/core";
import {Http, RequestOptionsArgs, Response, Headers } from "@angular/http";
import {Observable, AsyncSubject} from "rxjs";
import {KeycloakService} from "./keycloak.service";

@Injectable()
export class HttpWrapperService {
  constructor(private http: Http, private keycloakService: KeycloakService, private ngZone: NgZone) {
  }

  private getAuthHeader(options?: RequestOptionsArgs): Observable<Headers> {
    let subject = new AsyncSubject<Headers>();
    let headers = (options && options.headers) ? options.headers : new Headers();
    const keycloak = this.keycloakService.getKeycloak();

    if (keycloak && keycloak.token) {
      keycloak.updateToken(30).success(() => {
        headers.append("Authorization", "Bearer " + keycloak.token);
        this.ngZone.run(() => {
          subject.next(headers);
          subject.complete();
        });
      }).error(() => {
        /*
        this.ngZone.run(() => {
          subject.next(headers);
          subject.complete();
        });
        */
        this.keycloakService.login();
      });
    } else {
      //not authenticated redirect to login
      this.keycloakService.login();
    }
    return subject;
  }


  public get(url: string, options?: RequestOptionsArgs): Observable<Response> {
    let subject = new AsyncSubject<Response>();
    this.getAuthHeader(options).subscribe((headers) => {
      this.http.get(url, {
        headers: headers
      }).subscribe((data) => {
        this.ngZone.run(() => {
          subject.next(data);
        });
      }, (error) => {
        this.ngZone.run(() => {
          subject.error(error);
        });
      }, () => {
        this.ngZone.run(() => {
          subject.complete();
        });
      });
    });
    return subject;
  }

  public post(url: string, postData: any, options?: RequestOptionsArgs): Observable<Response> {
    let subject = new AsyncSubject<Response>();
    this.getAuthHeader(options).subscribe((headers) => {
      headers.append('Content-Type', 'application/json');
      this.http.post(url, postData, {
        headers: headers
      }).subscribe((data) => {
        this.ngZone.run(() => {
          subject.next(data);
        });
      }, (error) => {
        this.ngZone.run(() => {
          subject.error(error);
        });
      }, () => {
        this.ngZone.run(() => {
          subject.complete();
        });
      });
    });
    return subject;
  }

  public put(url: string, postData: any, options?: RequestOptionsArgs): Observable<Response> {
    let subject = new AsyncSubject<Response>();
    this.getAuthHeader(options).subscribe((headers) => {
      this.http.put(url, postData, {
        headers: headers
      }).subscribe((data) => {
        this.ngZone.run(() => {
          subject.next(data);
        });
      }, (error) => {
        this.ngZone.run(() => {
          subject.error(error);
        });
      }, () => {
        this.ngZone.run(() => {
          subject.complete();
        });
      });
    });
    return subject;
  }

  public delete(url: string, options?: RequestOptionsArgs): Observable<Response> {
    let subject = new AsyncSubject<Response>();
    this.getAuthHeader(options).subscribe((headers) => {
      this.http.delete(url, {
        headers: headers
      }).subscribe((data) => {
        this.ngZone.run(() => {
          subject.next(data);
        });
      }, (error) => {
        this.ngZone.run(() => {
          subject.error(error);
        });
      }, () => {
        this.ngZone.run(() => {
          subject.complete();
        });
      });
    });

    return subject;
  }

}
