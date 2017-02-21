
import {Component} from "@angular/core";
import {Bookmark} from "../../model/bookmark";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {UserBookmarkStore} from "../store/UserBookmarkStore";

const showdown = require('showdown');
const converter = new showdown.Converter();

@Component({
  selector: 'my-bookmark-detail',
  templateUrl: './bookmark-detail.component.html',
  styleUrls: ['./bookmark-detail.component.scss']
})
export class BookmarkDetailComponent {

  bookmark: Bookmark;

  constructor(
    private userBookmarkStore: UserBookmarkStore,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.forEach((params: Params) => {
      let id = params['id'];
      this.bookmark = this.userBookmarkStore.getBookmark(id);
      this.bookmark.tagsLine = '';
      this.bookmark.tags.forEach(tag => {
        this.bookmark.tagsLine += tag + ",";
      });
      this.bookmark.tagsLine = this.bookmark.tagsLine.replace(/,\s*$/, ""); //remove last comma and trailing spaces
      console.log(this.bookmark);
    });
  }

  updateBookmark():void {
    this.bookmark.tags = this.bookmark.tagsLine.split(",");
    this.bookmark.descriptionHtml = converter.makeHtml(this.bookmark.description);

    let obs = this.userBookmarkStore.updateBookmark(this.bookmark);

    obs.subscribe(
      res => {
        this.goToUserBookmarks()
      });
  }

  goToUserBookmarks(): void {
    this.router.navigate(['/personal']);
  }
}
