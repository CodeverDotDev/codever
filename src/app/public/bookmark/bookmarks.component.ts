import {Component, OnInit, AfterViewInit} from "@angular/core";
import {Observable} from "rxjs";
import {BookmarkStore} from "./store/BookmarkStore";
import {List} from "immutable";
import {Bookmark} from "../../core/model/bookmark";
import {Tag} from "../../core/model/tags";
import {ActivatedRoute} from "@angular/router";
import {BookmarkSearchComponent} from "./search/bookmark-search.component";
import {ViewChild} from "@angular/core";


@Component({
  selector: 'my-bookmarks',
  templateUrl: './bookmarks.component.html',
  styleUrls: ['./bookmarks.component.scss']
})
export class BookmarksComponent implements OnInit {

  publicBookmarks: Observable<List<Bookmark>>;
  tags: Tag[] = [];
  query: string = '';

  @ViewChild(BookmarkSearchComponent)
  private searchComponent: BookmarkSearchComponent;

  constructor(private bookmarkStore: BookmarkStore,  private route: ActivatedRoute) { }

  getBookmarks(): void {
    this.publicBookmarks = this.bookmarkStore.getBookmarks();
  }

  ngOnInit(): void {

    this.route
      .queryParams
      .subscribe(params => {
        if(params['search']){
          this.query = params['search'];
          this.query = this.query.replace('+', ' ');
        } else if(params['q']){
          this.query = params['q'];
          this.query = this.query.replace('+', ' ');
        }
      });

    this.getBookmarks();

    this.publicBookmarks.subscribe(
      bookmarks => {
        let allTags = new Set();

        bookmarks.forEach(bookmark => {
          //allTags.merge(allTags, OrderedSet.fromKeys(bookmark.tags));
          bookmark.tags.forEach(tag => {
            allTags = allTags.add(tag.trim().toLowerCase());
          });
        });


        console.log("all TAgs array");
        console.log(Array.from(allTags).sort());

        Array.from(allTags).sort().forEach(tag => {
          let tagBookmarks = [];
          bookmarks.forEach(bookmark => {
            bookmark.tags.forEach(bookmarkTag => {
              if(bookmarkTag.trim().toLowerCase() === tag){
                tagBookmarks.push(bookmark);
              }
            });
          });

          this.tags.push(new Tag(tag.toString(), tagBookmarks));
        });
      },
      err => {
        console.log("Error filtering bookmakrs");
      }
    );
  }

  onTagClick(tag: string){
    this.searchComponent.setQueryFromParentComponent('[' + tag + ']');
  }
}
