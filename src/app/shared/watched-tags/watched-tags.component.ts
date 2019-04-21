import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Bookmark } from '../../core/model/bookmark';
import { UserDataStore } from '../../core/user/userdata.store';
import { UserData } from '../../core/model/user-data';

@Component({
  selector: 'app-watched-tags',
  templateUrl: './watched-tags.component.html',
  styleUrls: ['./watched-tags.component.scss']
})
export class WatchedTagsComponent implements OnInit {

  @Input()
  userData: UserData;

  bookmarksForWatchedTags$: Observable<Bookmark[]>;

  constructor(private userDataStore: UserDataStore) { }

  ngOnInit() {

  }

  loadBookmarksForWatchedTags() {
    this.bookmarksForWatchedTags$ = this.userDataStore.getBookmarksForWatchedTags();
  }
}
