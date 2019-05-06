import { Component, OnInit } from '@angular/core';
import { Bookmark } from '../../core/model/bookmark';
import { ActivatedRoute, Router } from '@angular/router';
import { MarkdownService } from '../markdown.service';
import { MatChipInputEvent } from '@angular/material';
import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';
import { languages } from '../../shared/language-options';
import { allTags } from '../../core/model/all-tags.const.en';
import { PersonalBookmarkService } from '../../core/personal-bookmark.service';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-update-bookmark',
  templateUrl: './update-personal-bookmark.component.html',
  styleUrls: ['./update-personal-bookmark.component.scss']
})
export class UpdatePersonalBookmarkComponent implements OnInit {

  bookmark: Bookmark;

  selectable = true;
  removable = true;
  addOnBlur = true;

  // Enter, comma, space
  separatorKeysCodes = [ENTER, COMMA, SPACE];

  languages = languages;

  tdTags: string[];
  autocompleteTags = [];
  currentTag = '';

  constructor(
    private personalBookmarksService: PersonalBookmarkService,
    private keycloakService: KeycloakService,
    private markdownService: MarkdownService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.tdTags = allTags;
  }

  ngOnInit(): void {
    this.bookmark = window.history.state.bookmark;
    this.keycloakService.loadUserProfile().then(keycloakProfile => {
      this.personalBookmarksService.getTagsOfUser(keycloakProfile.id).subscribe(tags => {
        this.autocompleteTags = tags.sort();
        this.tdTags = this.autocompleteTags;
      });
    });
  }

  updateBookmark(): void {
    this.bookmark.descriptionHtml = this.markdownService.toHtml(this.bookmark.description);
    const now = new Date();
    this.bookmark.updatedAt = now;
    this.bookmark.lastAccessedAt = now;

    const obs = this.personalBookmarksService.updateBookmark(this.bookmark).subscribe(() => {
      this.navigateToHomePage();
    });
  }

  navigateToHomePage(): void {
    this.router.navigate(
      ['/'],
      {
        queryParams: {tab: 'history'}
      }
    );
  }

  addTag(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our fruit
    if ((value || '').trim()) {
      this.bookmark.tags.push(this.currentTag);
    }

    // Reset the input value
    if (input) {
      input.value = '';
      this.currentTag = '';
      this.tdTags = allTags;
    }
  }

  removeTag(tag: any): void {
    const index = this.bookmark.tags.indexOf(tag);

    if (index >= 0) {
      this.bookmark.tags.splice(index, 1);
    }
  }

  filterSuggestedTags(val: string) {
    return val ? this._filter(this.autocompleteTags, val) : this.autocompleteTags;
  }

  private _filter(tags: string[], val: string) {
    const filterValue = val.toLowerCase();
    return tags.filter(tag => tag.toLowerCase().startsWith(filterValue));
  }
}
