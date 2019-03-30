import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {LoaderService} from './loader.service';

@Injectable()
export class LoaderInterceptorService implements HttpInterceptor {

  private _inProgressCount = 0; // counter for multiple http requests

  constructor(private loaderService: LoaderService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.method === 'GET') {
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

}
