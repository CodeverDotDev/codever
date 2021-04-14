import { ReplaySubject } from 'rxjs';
import { PersonalBookmarksService } from '../personal-bookmarks.service';
import { Injectable } from '@angular/core';
import { stringify } from 'querystring';
import { PersonalSnippetsService } from '../personal-snippets.service';

@Injectable()
export class SuggestedTagsStore {

  private _suggestedTags: ReplaySubject<string[]> = new ReplaySubject(1);
  private _suggestedTagsForSnippet: ReplaySubject<string[]> = new ReplaySubject(1);
  private suggestedTagsLoaded = false;
  private suggestedTagsForSnippetLoaded = false;

  constructor(private personalBookmarksService: PersonalBookmarksService,
              private personalSnippetsService: PersonalSnippetsService) {
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

  getSuggestedSnippetTags$(userId: String) {
    if (!this.suggestedTagsForSnippetLoaded) {
      this.personalSnippetsService.getSuggestedSnippetTags(userId).subscribe(data => {
        this.suggestedTagsForSnippetLoaded = true;
        this._suggestedTagsForSnippet.next(data);
      });
    }

    return this._suggestedTagsForSnippet.asObservable();
  }
}
