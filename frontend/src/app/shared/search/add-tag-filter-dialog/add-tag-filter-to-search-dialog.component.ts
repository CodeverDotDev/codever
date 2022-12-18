import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { PersonalBookmarksService } from '../../../core/personal-bookmarks.service';
import { map, startWith } from 'rxjs/operators';
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { PersonalSnippetsService } from '../../../core/personal-snippets.service';
import { SearchDomain } from '../../../core/model/search-domain.enum';
import { PublicBookmarksService } from '../../../public/bookmarks/public-bookmarks.service';
import { UsedTag } from '../../../core/model/used-tag';
import { PublicSnippetsService } from '../../../public/snippets/public-snippets.service';
import { PersonalNotesService } from '../../../core/personal-notes.service';

@Component({
  selector: 'app-delete-bookmark-dialog',
  templateUrl: './add-tag-filter-to-search-dialog.component.html',
  styleUrls: ['./add-tag-filter-to-search-dialog.component.scss']
})
export class AddTagFilterToSearchDialogComponent implements OnInit {

  userId: string;
  searchDomain: string;

  tagsLabel: any;

  visible = true;
  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  tagCtrl = new FormControl();
  filteredTags: Observable<UsedTag[]>;
  tags: UsedTag[] = [];
  myTags: UsedTag[];

  @ViewChild('tagInput') tagInput: ElementRef<HTMLInputElement>;
  @ViewChild('auto') matAutocomplete: MatAutocomplete;

  constructor(private personalBookmarksService: PersonalBookmarksService,
              private personalSnippetsService: PersonalSnippetsService,
              private personalNotesService: PersonalNotesService,
              private publicBookmarksService: PublicBookmarksService,
              private publicSnippetsService: PublicSnippetsService,
              private dialogRef: MatDialogRef<AddTagFilterToSearchDialogComponent>,
              @Inject(MAT_DIALOG_DATA) data) {
    this.userId = data.userId;
    this.tagsLabel = data.searchDomain + ' tags';
    this.searchDomain = data.searchDomain;
  }

  ngOnInit() {
    switch (this.searchDomain) {
      case SearchDomain.MY_BOOKMARKS : {
        this.personalBookmarksService.getUserTagsForBookmarks(this.userId).subscribe(this.setTags());
      }
        break;

      case SearchDomain.MY_SNIPPETS : {
        this.personalSnippetsService.getUserTagsForSnippets(this.userId).subscribe(this.setTags());
      }
        break;

      case SearchDomain.MY_NOTES : {
        this.personalNotesService.getSuggestedNoteTags(this.userId).subscribe(this.setTags());
      }
        break;

      case SearchDomain.PUBLIC_BOOKMARKS : {
        this.publicBookmarksService.getMostUsedPublicTags(300).subscribe(this.setTags());
      }
        break;

      case SearchDomain.PUBLIC_SNIPPETS : {
        this.publicSnippetsService.getMostUsedPublicTagsForSnippets(300).subscribe(this.setTags());
      }
    }

  }

  private setTags() {
    return tags => {
      this.myTags = tags;

      this.filteredTags = this.tagCtrl.valueChanges.pipe(
        startWith(null),
        map((tag: string | null) => {
          return tag ? this._filter(tag) : this.myTags.slice();
        })
      );
    };
  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our tag
    if ((value || '').trim()
    ) {
      this.tags.push(this.myTags.filter(tag => tag.name === value)[0]);
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.tagCtrl.setValue(null);
  }

  remove(tag: UsedTag): void {
    const index = this.tags.findIndex(i => i.name === tag.name);

    if (index >= 0
    ) {
      this.tags.splice(index, 1);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.tags.push(event.option.value);
    this.tagInput.nativeElement.value = '';
    this.tagCtrl.setValue(null);
  }

  _filter(value: any): UsedTag[] {
    if (typeof value === 'string' && value.trim() !== '') {
      const filterValue = value.toLowerCase();

      return this.myTags.filter(tag => tag.name.toLowerCase().indexOf(filterValue) === 0);
    }
  }

  cancel() {
    this.dialogRef.close();
  }

  addTagsToSearch() {
    const tagsAsString = this.tags.map(tag => `[${tag.name}]`).join(' ')
    this.dialogRef.close(tagsAsString);
  }

}
