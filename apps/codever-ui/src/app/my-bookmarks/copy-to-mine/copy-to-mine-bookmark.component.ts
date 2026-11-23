import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Bookmark } from '../../core/model/bookmark';
import { SharedBookmark } from '../../core/model/share-link';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import { PublicBookmarksService } from '../../public/bookmarks/public-bookmarks.service';
import { SharedCopyHandoff } from '../../core/sharing/shared-copy-handoff.service';
import { SaveBookmarkFormComponent } from '../save-bookmark-form/save-bookmark-form.component';

@Component({
  selector: 'app-copy-to-mine-bookmark',
  templateUrl: './copy-to-mine-bookmark.component.html',
  styleUrls: ['./copy-to-mine-bookmark.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [SaveBookmarkFormComponent, RouterLink],
})
export class CopyToMineBookmarkComponent implements OnInit {
  /** Set once the bookmark is known, so the form never starts empty. */
  bookmark$: Observable<Bookmark>;
  loadFailed = false;

  constructor(
    private route: ActivatedRoute,
    private publicBookmarksService: PublicBookmarksService,
    private sharedCopyHandoff: SharedCopyHandoff
  ) {}

  /**
   * The bookmark comes from the page that opened the copy (a public list or
   * a shared page). Without it only a public bookmark can be loaded again.
   */
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const bookmark: Bookmark =
      window.history.state?.bookmark ??
      (this.sharedCopyHandoff.take<SharedBookmark>('bookmark', id) as Bookmark);
    if (bookmark) {
      this.bookmark$ = of(bookmark);
      return;
    }
    this.publicBookmarksService.getPublicBookmarkById(id).subscribe({
      next: (publicBookmark) => (this.bookmark$ = of(publicBookmark)),
      error: () => (this.loadFailed = true),
    });
  }
}
