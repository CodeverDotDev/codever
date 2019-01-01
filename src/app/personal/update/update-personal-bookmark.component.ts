import {Component, OnInit} from '@angular/core';
import {Bookmark} from '../../core/model/bookmark';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {PersonalCodingmarksStore} from '../../core/store/personal-codingmarks-store.service';
import {MarkdownService} from '../markdown.service';
import {MatChipInputEvent} from '@angular/material';
import {COMMA, ENTER, SPACE} from '@angular/cdk/keycodes';
import {languages} from '../../shared/language-options';
import {allTags} from '../../core/model/all-tags.const.en';

@Component({
  selector: 'app-update-bookmark',
  templateUrl: './update-personal-bookmark.component.html',
  styleUrls: ['./update-personal-bookmark.component.scss']
})
export class UpdatePersonalBookmarkComponent implements OnInit {

  bookmark: Bookmark;

  visible = true;
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
    private personalCodingmarksStore: PersonalCodingmarksStore,
    private markdownService: MarkdownService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.tdTags = allTags;
  }

  ngOnInit(): void {
    this.route.params.forEach((params: Params) => {
      const id = params['id'];
      this.bookmark = this.personalCodingmarksStore.getBookmark(id);
    });
    this.autocompleteTags = this.personalCodingmarksStore.getPersonalAutomcompleteTags();
  }

  updateBookmark(): void {
    this.bookmark.descriptionHtml = this.markdownService.toHtml(this.bookmark.description);
    this.bookmark.updatedAt = new Date();

    const obs = this.personalCodingmarksStore.updateBookmark(this.bookmark);

    obs.subscribe(
      res => {
        this.goToUserBookmarks();
      });
  }

  goToUserBookmarks(): void {
    this.router.navigate(['/personal'], { fragment: 'navbar' });
  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our fruit
    if ((value || '').trim()) {
      this.bookmark.tags.push( this.currentTag);
    }

    // Reset the input value
    if (input) {
      input.value = '';
      this.currentTag = '';
      this.tdTags = allTags;
    }
  }

  remove(tag: any): void {
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
