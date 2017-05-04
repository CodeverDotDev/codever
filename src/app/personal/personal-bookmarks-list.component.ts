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

  constructor(
    private zone: NgZone,
    private route: ActivatedRoute,
    private router: Router,
    private userBookmarkStore: PersonalBookmarksStore) { }

  ngOnInit(): void {
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
