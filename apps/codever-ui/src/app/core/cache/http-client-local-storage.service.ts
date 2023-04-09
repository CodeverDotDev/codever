import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LocalStorageService } from './local-storage.service';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { localStorageKeys } from '../model/localstorage.cache-keys';

export enum Verbs {
  GET = 'GET',
  PUT = 'PUT',
  POST = 'POST',
  DELETE = 'DELETE',
}

@Injectable()
export class HttpClientLocalStorageService {
  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService
  ) {}

  get<T>(options: HttpOptions): Observable<T> {
    return this.httpCall(Verbs.GET, options);
  }

  delete<T>(options: HttpOptions): Observable<T> {
    return this.httpCall(Verbs.DELETE, options);
  }

  post<T>(options: HttpOptions): Observable<T> {
    return this.httpCall(Verbs.POST, options);
  }

  put<T>(options: HttpOptions): Observable<T> {
    return this.httpCall(Verbs.PUT, options);
  }

  private httpCall<T>(verb: Verbs, options: HttpOptions): Observable<T> {
    const canBePlacedInLocalStorage =
      !options.isSensitive ||
      (options.isSensitive &&
        this.localStorageService.load(
          localStorageKeys.userLocalStorageConsent
        ));

    if (canBePlacedInLocalStorage) {
      // Setup default values
      options.body = options.body || null;
      options.cacheHours = options.cacheHours || 0;

      if (options.cacheHours > 0) {
        // Get data from cache
        const data = this.localStorageService.load(
          options.key ? options.key : options.url
        );
        // Return data from cache
        if (data !== null) {
          return of<T>(data);
        }
      }

      return this.http
        .request<T>(verb, options.url, {
          body: options.body,
          params: options.params,
        })
        .pipe(
          switchMap((response) => {
            if (options.cacheHours > 0) {
              // Data will be cached
              this.localStorageService.save({
                key: options.key ? options.key : options.url,
                data: response,
                expirationHours: options.cacheHours,
              });
            }
            return of<T>(response);
          })
        );
    } else {
      return this.http.request<T>(verb, options.url, {
        body: options.body,
        params: options.params,
      });
    }
  }
}

export class HttpOptions {
  url: string;
  key?: string;
  body?: any;
  params?: any;
  cacheHours?: number;
  isSensitive?: boolean;
}
