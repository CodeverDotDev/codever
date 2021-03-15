import { Component, OnInit } from '@angular/core';
import { Bookmark } from '../../core/model/bookmark';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { PublicBookmarksService } from '../../public/bookmarks/public-bookmarks.service';

@Component({
  selector: 'app-copy-to-mine-bookmark',
  templateUrl: './copy-to-mine-bookmark.component.html',
  styleUrls: ['./copy-to-mine-bookmark.component.scss']
})
export class CopyToMineBookmarkComponent implements OnInit {

  bookmark$: Observable<Bookmark>;

  constructor(private route: ActivatedRoute,
              private publicBookmarksService: PublicBookmarksService) {
  }

  ngOnInit(): void {
    this.bookmark$ = of(window.history.state.bookmark);
    if (!window.history.state.bookmark) {
      const id = this.route.snapshot.paramMap.get('id');
      this.bookmark$ = this.publicBookmarksService.getPublicBookmarkById(id);
    }
  }
}
