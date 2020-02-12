import { ReplaySubject } from 'rxjs';
import { PersonalBookmarksService } from '../personal-bookmarks.service';
import { Injectable } from '@angular/core';

@Injectable()
export class SuggestedTagsStore {

  private _suggestedTags: ReplaySubject<string[]> = new ReplaySubject(1);
  private suggestedTagsLoaded = false;

  constructor(private personalBookmarksService: PersonalBookmarksService) {}

  getSuggestedTags$(userId: String) {
    if (!this.suggestedTagsLoaded) {
      this.personalBookmarksService.getSuggestedTagsForUser(userId).subscribe(data => {
        this.suggestedTagsLoaded = true;
        this._suggestedTags.next(data);
      });
    }

    return this._suggestedTags.asObservable();
  }

}
