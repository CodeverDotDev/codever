import {Component, NgZone, OnInit} from '@angular/core';
import {Bookmark} from '../core/model/bookmark';
import {Observable} from 'rxjs/Observable';
import {List} from 'immutable';
import {PersonalBookmarksStore} from '../core/store/PersonalBookmarksStore';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'my-user-bookmarks',
  templateUrl: './personal-bookmarks-list.component.html',
  styleUrls: ['./personal-bookmarks-list.component.scss']
})
export class PersonalBookmarksListComponent implements OnInit {

  userBookmarks: Observable<List<Bookmark>>;
  query = '';

  sessionId: Observable<string>;
  sessionIdValue = '';

  constructor(
    private route: ActivatedRoute,
    private zone: NgZone,
    private router: Router,
    private userBookmarkStore: PersonalBookmarksStore) { }

  ngOnInit(): void {
    this.query = this.route.snapshot.queryParamMap.get('q');
    if (this.query) {
      this.query = this.query.replace(/\+/g,  ' ');
    } else {
      this.query = this.route.snapshot.queryParamMap.get('search');
      if (this.query) {
        this.query = this.query.replace(/\+/g,  ' ');
      }
    }
    this.userBookmarks = this.userBookmarkStore.getBookmarks();
    this.userBookmarks.subscribe(
      res => {
        this.zone.run(() => {
          console.log('ZONE RUN for initial load of bookmarks'); // need to investigate this, or merge it with the async list stuff....
        });
      });
  }

  goToAddNewPersonalBookmark(): void {
    const link = ['./new'];
    this.router.navigate(link, { relativeTo: this.route });
  }
}
