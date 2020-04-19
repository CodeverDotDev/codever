import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {LoaderService} from './loader.service';
import {environment} from '../../../environments/environment';

@Injectable()
export class LoaderInterceptorService implements HttpInterceptor {

  private _inProgressCount = 0; // counter for multiple http requests

  private readonly silentApis = [
    environment.API_URL + '/public/bookmarks/scrape'
  ];
  constructor(private loaderService: LoaderService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.method === 'GET') {

      // Ignore silent api requests
      if (this.checkUrl(req)) {
        return next.handle(req);
      }

      this._inProgressCount++;
      this.loaderService.show();
      return next.handle(req).pipe(
        finalize(() => {
          this._inProgressCount--;
          if (this._inProgressCount === 0) {
            this.loaderService.hide()
          }
        })
      );
    } else {
      return next.handle(req);
    }
  }

  /**
   * Check if request is silent.
   * @param req request
   */
  private checkUrl(req: HttpRequest<any>) {
    const url = req.url.toLowerCase();
    const found = this.silentApis.find((u) => url.startsWith(u));
    return !!found;
  }

}
