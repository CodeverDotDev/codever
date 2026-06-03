import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class SearchRedirectGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const sd = route.queryParamMap.get('sd');
    if (sd === 'my-bookmarks' || sd === 'my-notes') {
      const type = sd === 'my-bookmarks' ? 'bookmark' : 'note';
      const params = { ...route.queryParams, sd: 'all-mine', type };
      this.router.navigate(['/search'], {
        queryParams: params,
        replaceUrl: true,
      });
      return false;
    }
    return true;
  }
}
