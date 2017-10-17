import {Injectable, NgZone} from '@angular/core';
import {Http, RequestOptionsArgs, Response, Headers} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {AsyncSubject} from 'rxjs/AsyncSubject';
import {KeycloakService} from './keycloak.service';
import {HttpClient, HttpHeaders} from '@angular/common/http';

@Injectable()
export class HttpClientWrapperService {

  constructor(private http: HttpClient,
              private keycloakService: KeycloakService,
              private ngZone: NgZone) {
  }

  private getAuthHeader(options?: any): Observable<HttpHeaders> {
    const subject = new AsyncSubject<HttpHeaders>();
    const headers = (options && options.headers) ? options.headers : new HttpHeaders();

    const auth = this.keycloakService.getKeycloak();

    if (auth && auth.token) {
      auth.updateToken(30).success(() => {
        headers.set('Authorization', 'Bearer ' + auth.token);
        subject.next(headers);
        subject.complete();
      }).error(() => {
        this.keycloakService.login();
      });
    } else {
      // not authenticated redirect to login
      this.keycloakService.login();
    }
    return subject;
  }

  public get(url: string, options?: RequestOptionsArgs): Observable<Response> {
    console.log('-----------------------------------------------------------------------');
    return this.execute('get', url, options);
  }

  public post(url: string, postData: any, options?: RequestOptionsArgs): Observable<Response> {
    console.log(postData);
    return this.executeWithData('post', url, postData, options);
  }

  public put(url: string, postData: any, options?: RequestOptionsArgs): Observable<Response> {
    return this.executeWithData('put', url, postData, options);
  }


  public delete(url: string, options?: RequestOptionsArgs): Observable<Response> {
    return this.execute('delete', url, options);
  }


  private execute(method: string, url: string, options?: any): Observable<Object> {
    options = options ? options : {};

    const observable = new Observable((observer) => {

      this.getAuthHeader(options).subscribe((headers) => {

        if (typeof options === 'undefined') {
          options = {};
        }
        options.headers = headers;

        this.http[method](url, options).subscribe((data) => {
          this.ngZone.run(() => {
            observer.next(data);
          });
        }, (error) => {
          this.ngZone.run(() => {
            observer.error(error);
          });
        }, () => {
          this.ngZone.run(() => {
            observer.complete();
          });
        });
      });

    });

    return observable;
  }

  private executeWithData(method: string, url: string, dataToSend: any, options?: any): Observable<Response> {
    options = options ? options : {};

    const observable = new Observable((observer) => {
      this.getAuthHeader(options).subscribe((headers) => {

        if (typeof options === 'undefined') {
          options = {};
        }
        headers.set('Content-type', 'application/json');
        options.headers = headers;

        this.http[method](url, dataToSend, options).subscribe((data) => {
          this.ngZone.run(() => {
            observer.next(data);
          });
        }, (error) => {
          this.ngZone.run(() => {
            observer.error(error);
          });
        }, () => {
          this.ngZone.run(() => {
            observer.complete();
          });
        });
      });
    });

    return observable;
  }
}
