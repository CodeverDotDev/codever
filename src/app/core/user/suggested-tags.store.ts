import { ReplaySubject } from 'rxjs';
import { PersonalBookmarksService } from '../personal-bookmarks.service';
import { Injectable } from '@angular/core';
import { stringify } from 'querystring';
import { PersonalCodeletsService } from '../personal-codelets.service';

@Injectable()
export class SuggestedTagsStore {

  private _suggestedTags: ReplaySubject<string[]> = new ReplaySubject(1);
  private _suggestedTagsForCodelets: ReplaySubject<string[]> = new ReplaySubject(1);
  private suggestedTagsLoaded = false;
  private suggestedTagsForCodeletsLoaded = false;

  constructor(private personalBookmarksService: PersonalBookmarksService,
              private personalCodeletsService: PersonalCodeletsService) {
  }

  getSuggestedTags$(userId: String) {
    if (!this.suggestedTagsLoaded) {
      this.personalBookmarksService.getSuggestedTagsForUser(userId).subscribe(data => {
        this.suggestedTagsLoaded = true;
        this._suggestedTags.next(data);
      });
    }

    return this._suggestedTags.asObservable();
  }

  getSuggestedCodeletTags$(userId: String) {
    if (!this.suggestedTagsForCodeletsLoaded) {
      this.personalCodeletsService.getSuggestedCodeletTags(userId).subscribe(data => {
        this.suggestedTagsForCodeletsLoaded = true;
        this._suggestedTagsForCodelets.next(data);
      });
    }

    return this._suggestedTagsForCodelets.asObservable();
  }
}
