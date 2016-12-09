import {Injectable} from "@angular/core";
import {Http, RequestOptionsArgs, Response, Headers } from "@angular/http";
import {Observable, AsyncSubject} from "rxjs";
import {KeycloakService} from "./keycloak.service";

@Injectable()
export class HttpWrapperService {
  constructor(private http: Http, private keycloakService: KeycloakService) {
  }

  private getAuthHeader(options?: RequestOptionsArgs): Observable<Headers> {
    let subject = new AsyncSubject<Headers>();
    let headers = (options && options.headers) ? options.headers : new Headers();
    const keycloak = this.keycloakService.getKeycloak();
    if (keycloak && keycloak.token) {
      keycloak.updateToken(5).success(() => {
        headers.append("Authorization", "Bearer " + keycloak.token);
        subject.next(headers);
        subject.complete();
      }).error(() => {
        subject.next(headers);
        subject.complete();
      });
    } else {
      subject.next(headers);
      subject.complete();
    }
    return subject;
  }

  public get(url: string, options?: RequestOptionsArgs): Observable<Response> {
    let subject = new AsyncSubject<Response>();
    this.getAuthHeader(options).subscribe((headers) => {
      this.http.get(url, {
        headers: headers
      }).subscribe((data) => {
          subject.next(data);
      }, (error) => {
          subject.error(error);
      }, () => {
          subject.complete();
      });
    });
    return subject;
  }

  public post(url: string, postData: any, options?: RequestOptionsArgs): Observable<Response> {
    let subject = new AsyncSubject<Response>();
    this.getAuthHeader(options).subscribe((headers) => {
      this.http.post(url, postData, {
        headers: headers
      }).subscribe((data) => {
          subject.next(data);
      }, (error) => {
          subject.error(error);
      }, () => {
          subject.complete();
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
        subject.next(data);
      }, (error) => {
        subject.error(error);
      }, () => {
        subject.complete();
      });
    });
    return subject;
  }

}
