import {Component, NgZone, OnInit, ViewChild} from '@angular/core';
import {Observable} from 'rxjs';
import {List} from 'immutable';
import {Bookmark} from '../../core/model/bookmark';
import {ActivatedRoute} from '@angular/router';
import {BookmarkSearchComponent} from '../../shared/search/bookmark-search.component';
import {PublicCodingmarksStore} from './store/public-codingmarks-store.service';
import {allTags} from '../../core/model/all-tags.const.en';


@Component({
  selector: 'app-public-bookmarks',
  templateUrl: './public-codingmarks.component.html',
  styleUrls: ['./public-codingmarks.component.scss']
})
export class PublicCodingmarksComponent implements OnInit {

  publicCodingmarks$: Observable<List<Bookmark>>;
  tags: string[] = allTags;
  query = '';

  @ViewChild(BookmarkSearchComponent)
  private searchComponent: BookmarkSearchComponent;

  constructor(private publicCodingmarksStore: PublicCodingmarksStore,
              private route: ActivatedRoute
              ) { }

  ngOnInit(): void {
    this.query = this.route.snapshot.queryParamMap.get('search');
    if (!this.query) {
      this.query = this.route.snapshot.queryParamMap.get('q');
      if (this.query) {
        this.query = this.query.replace(/\+/g, ' ');
      }
    }

    this.publicCodingmarks$ = this.publicCodingmarksStore.getBookmarks();
  }

  onTagClick(tag: string) {
    this.searchComponent.setQueryFromParentComponent('[' + tag + ']');
    this.searchComponent.language = 'all';
  }
}
