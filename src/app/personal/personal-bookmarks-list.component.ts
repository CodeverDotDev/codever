import {Component, OnInit, NgZone} from '@angular/core';
import {Bookmark} from '../core/model/bookmark';
import {Observable} from 'rxjs/Observable';
import {List} from 'immutable';
import {PersonalBookmarksStore} from './store/PersonalBookmarksStore';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'my-user-bookmarks',
  templateUrl: './personal-bookmarks-list.component.html',
  styleUrls: ['./personal-bookmarks-list.component.scss']
})
export class PersonalBookmarksListComponent implements  OnInit{

  userBookmarks: Observable<List<Bookmark>>;
  query = '';

  sessionId: Observable<string>;
  sessionIdValue = '';

  constructor(
    private zone: NgZone,
    private route: ActivatedRoute,
    private router: Router,
    private userBookmarkStore: PersonalBookmarksStore) { }

  ngOnInit(): void {

    this.sessionId = this.route
      .queryParamMap
      .map(params => params.get('q') || 'None');

      this.sessionId.subscribe(value => {
        this.sessionIdValue = value;
        console.log('query param value' + this.sessionIdValue);
      });

    this.route
      .queryParams
      .subscribe(params => {
        if (params['search']) {
          this.query = params['search'];
          this.query = this.query.replace(/\+/g, ' ');
        } else if (params['q']) {
          this.query = params['q'];
          this.query = this.query.replace(/\+/g,  ' ');
        }
      });

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
