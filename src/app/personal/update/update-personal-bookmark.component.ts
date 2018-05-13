import {Component, OnInit} from '@angular/core';
import {Bookmark} from '../../core/model/bookmark';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {PersonalBookmarksStore} from '../../core/store/PersonalBookmarksStore';
import {MarkdownService} from '../markdown.service';

@Component({
  selector: 'app-update-bookmark',
  templateUrl: './update-personal-bookmark.component.html',
  styleUrls: ['./update-personal-bookmark.component.scss']
})
export class UpdatePersonalBookmarkComponent implements OnInit {

  bookmark: Bookmark;

  constructor(
    private userBookmarkStore: PersonalBookmarksStore,
    private markdownService: MarkdownService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.forEach((params: Params) => {
      const id = params['id'];
      this.bookmark = this.userBookmarkStore.getBookmark(id);
      this.bookmark.tagsLine = '';
      this.bookmark.tags.forEach(tag => {
        this.bookmark.tagsLine += tag + ',';
      });
      this.bookmark.tagsLine = this.bookmark.tagsLine.replace(/,\s*$/, ''); // remove last comma and trailing spaces
      console.log(this.bookmark);
    });
  }

  updateBookmark(): void {
    this.bookmark.tags = this.bookmark.tagsLine.split(',').map(function(item) {
      return item.trim().replace(' ', '-'); // replace spaces between words (if any) in a tag with dashes
    });
    this.bookmark.descriptionHtml = this.markdownService.toHtml(this.bookmark.description);
    this.bookmark.updatedAt = new Date();

    const obs = this.userBookmarkStore.updateBookmark(this.bookmark);

    obs.subscribe(
      res => {
        this.goToUserBookmarks();
      });
  }

  goToUserBookmarks(): void {
    this.router.navigate(['/personal'], { fragment: 'navbar' });
  }
}
