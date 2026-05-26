import { ReplaySubject, forkJoin } from 'rxjs';
import { PersonalBookmarksService } from '../personal-bookmarks.service';
import { Injectable } from '@angular/core';
import { PublicBookmarksService } from '../../public/bookmarks/public-bookmarks.service';

@Injectable()
export class SuggestedTagsStore {
  private _suggestedTags: ReplaySubject<string[]> = new ReplaySubject(1);
  private suggestedTagsLoaded = false;

  constructor(
    private personalBookmarksService: PersonalBookmarksService,
    private publicBookmarksService: PublicBookmarksService
  ) {}

  getSuggestedBookmarkTags$(userId: string) {
    if (!this.suggestedTagsLoaded) {
      const userTags$ =
        this.personalBookmarksService.getUserTagsForBookmarks(userId);
      const mostUsedPublicTags$ =
        this.publicBookmarksService.getMostUsedPublicTags(500);

      forkJoin([userTags$, mostUsedPublicTags$]).subscribe((results) => {
        const userTags = results[0];
        const userTagsSimple = userTags.map((userTag) => userTag.name);
        const mostUserPublicTags = results[1];
        const mostUserPublicTagsSimple = mostUserPublicTags.map(
          (publicTag) => publicTag.name
        );

        const suggestedTags = [
          ...new Set([...userTagsSimple, ...mostUserPublicTagsSimple]),
        ];
        this.suggestedTagsLoaded = true;
        this._suggestedTags.next(suggestedTags.sort());
      });
    }

    return this._suggestedTags.asObservable();
  }

  /** @deprecated Snippets are migrated to notes — delegates to bookmark tags. */
  getSuggestedSnippetTags$(userId: string) {
    return this.getSuggestedBookmarkTags$(userId);
  }
}
