import { Component, OnInit } from '@angular/core';
import { Bookmark } from '../../../core/model/bookmark';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { PublicBookmarksService } from '../public-bookmarks.service';


@Component({
  selector: 'app-bookmark-details',
  templateUrl: './shareable-bookmark-details.component.html',
  styleUrls: ['./shareable-bookmark-details.component.scss']
})
export class ShareableBookmarkDetailsComponent implements OnInit {

  bookmark$: Observable<Bookmark>;
  popup: string;

  constructor(
    private route: ActivatedRoute,
    private publicBookmarksService: PublicBookmarksService
  ) {
  }

  ngOnInit() {
    const shareableId = this.route.snapshot.paramMap.get('shareableId');
    this.bookmark$ = this.publicBookmarksService.getSharedBookmarkBySharableId(shareableId);
  }

}
