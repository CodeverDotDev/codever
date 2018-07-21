import {Component, NgZone, OnInit, ViewChild} from '@angular/core';
import {Observable} from 'rxjs';
import {List} from 'immutable';
import {Bookmark} from '../../core/model/bookmark';
import {ActivatedRoute} from '@angular/router';
import {BookmarkSearchComponent} from '../../shared/search/bookmark-search.component';
import {PublicBookmarksStore} from './store/public-bookmarks.store';
import {allTags} from '../../core/model/all-tags.const.en';


@Component({
  selector: 'app-public-bookmarks',
  templateUrl: './public-bookmarks.component.html',
  styleUrls: ['./public-bookmarks.component.scss']
})
export class PublicBookmarksComponent implements OnInit {

  publicBookmarks: Observable<List<Bookmark>>;
  tags: string[] = allTags;
  query = '';

  @ViewChild(BookmarkSearchComponent)
  private searchComponent: BookmarkSearchComponent;

  constructor(private bookmarkStore: PublicBookmarksStore,
              private route: ActivatedRoute,
              private zone: NgZone
              ) { }

  ngOnInit(): void {

    this.query = this.route.snapshot.queryParamMap.get('search');
    if (!this.query) {
      this.query = this.route.snapshot.queryParamMap.get('q');
      if (this.query) {
        this.query = this.query.replace(/\+/g, ' ');
      }
    }

    this.getBookmarks();
  }

  getBookmarks(): void {
    this.publicBookmarks = this.bookmarkStore.getBookmarks();
    this.publicBookmarks.subscribe(
      res => {
        this.zone.run(() => {
          console.log('ZONE RUN for initial load of bookmarks'); // need to investigate this, or merge it with the async list stuff....
        });
      });
  }


  onTagClick(tag: string) {
    this.searchComponent.setQueryFromParentComponent('[' + tag + ']');
    this.searchComponent.language = 'all';
  }
}
