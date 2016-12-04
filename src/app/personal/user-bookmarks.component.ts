import {Component, OnInit} from "@angular/core";
import {Bookmark} from "../model/bookmark";
import {Router} from "@angular/router";
import {Observable} from "rxjs";
import {List} from "immutable";
import {Logger} from "../logger.service";
import {UserBookmarkStore} from "./store/UserBookmarkStore";

@Component({
  selector: 'my-user-bookmarks',
  templateUrl: './user-bookmarks.component.html',
  styleUrls: ['./user-bookmarks.component.scss']
})
export class UserBookmarksComponent implements  OnInit{

  allUserBookmarks: Observable<List<Bookmark>>;

  constructor(private userBookmarkStore: UserBookmarkStore) { }

  getBookmarks(): void {
    this.allUserBookmarks = this.userBookmarkStore.getBookmarks();
    console.log('UserBookmarksComponent.getBookmarks - allBookmarks');
    console.log(this.allUserBookmarks);
  }

  ngOnInit(): void {
    this.getBookmarks();
  }

}
