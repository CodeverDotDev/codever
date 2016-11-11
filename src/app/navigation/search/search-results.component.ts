import {Component, OnDestroy} from "@angular/core";
import {Router} from "@angular/router";
import {Observable, Subscription} from "rxjs";
import {NavbarSearchService} from "./NavbarSearchService";
import {Bookmark} from "../../model/bookmark";

@Component({
  selector: 'my-search-results',
  templateUrl: './search-results.component.html'
})
export class SearchResultsComponent implements OnDestroy {

  foundBookmarks: Observable<Bookmark[]>;
  subscription: Subscription;

  constructor(
    private navbarSearchService: NavbarSearchService,
    private router: Router) {
    this.subscription = navbarSearchService.foundBookmarks$.subscribe(
      response => {
        this.foundBookmarks = response;
      });
  }

  gotoDetail(bookmark: Bookmark): void {
    let link = ['/bookmarks', bookmark._id];
    this.router.navigate(link);
  }

  ngOnDestroy(): void {
    // prevent memory leak when component destroyed
    this.subscription.unsubscribe();
  }

}
