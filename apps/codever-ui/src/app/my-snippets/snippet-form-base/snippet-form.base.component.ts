import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { snippet_common_tags } from '../../shared/constants/snippet-common-tags';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CodeSnippet, Snippet } from '../../core/model/snippet';
import { map, startWith, switchMap } from 'rxjs/operators';
import { MatChipInputEvent } from '@angular/material/chips';
import {
  MatAutocompleteActivatedEvent,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { SuggestedTagsStore } from '../../core/user/suggested-tags.store';
import { UserInfoStore } from '../../core/user/user-info.store';
import { Params, Router } from '@angular/router';
import { textSizeValidator } from '../../core/validators/text-size.validator';
import { HttpResponse } from '@angular/common/http';
import { throwError as observableThrowError } from 'rxjs/internal/observable/throwError';
import { PersonalSnippetsService } from '../../core/personal-snippets.service';
import { ErrorService } from '../../core/error/error.service';

@Component({
  template: '',
})
export class SnippetFormBaseComponent implements OnInit {
  snippetFormGroup: UntypedFormGroup;
  codeSnippetsFormArray: UntypedFormArray;
  userId = null;

  // chips
  selectable = true;
  removable = true;
  addOnBlur = true;

  autocompleteTagsOptionActivated = false;

  // Enter, comma, space
  separatorKeysCodes = [ENTER, COMMA];

  commonSnippetTags = snippet_common_tags;

  autocompleteTags = [];

  tagsControl = new UntypedFormControl();

  filteredTags: Observable<any[]>;

  @Input()
  snippet: Snippet;

  @ViewChild('tagInput', { static: false })
  tagInput: ElementRef;

  constructor(
    protected formBuilder: UntypedFormBuilder,
    protected personalSnippetsService: PersonalSnippetsService,
    protected suggestedTagsStore: SuggestedTagsStore,
    protected userInfoStore: UserInfoStore,
    protected router: Router,
    protected errorService: ErrorService
  ) {}

  ngOnInit(): void {
    this.userInfoStore
      .getUserInfoOidc$()
      .pipe(
        switchMap((userInfoOidc) => {
          this.userId = userInfoOidc.sub;
          return this.suggestedTagsStore.getSuggestedSnippetTags$(this.userId);
        })
      )
      .subscribe((suggestedSnippetTags) => {
        this.autocompleteTags = suggestedSnippetTags;
        this.filteredTags = this.tagsControl.valueChanges.pipe(
          startWith(null),
          map((tag: string | null) => {
            return tag ? this.filter(tag) : this.autocompleteTags.slice();
          })
        );
      });
  }

  addTag(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim() && !this.autocompleteTagsOptionActivated) {
      // if ((value || '').trim()) {
      this.formArrayTags.push(
        this.formBuilder.control(value.trim().toLowerCase())
      );
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.tagsControl.setValue(null);
    this.formArrayTags.markAsDirty();
  }

  removeTagByIndex(index: number): void {
    if (index >= 0) {
      this.formArrayTags.removeAt(index);
    }
    this.formArrayTags.markAsDirty();
  }

  filter(name: string) {
    return this.autocompleteTags.filter(
      (tag) => tag.toLowerCase().indexOf(name.toLowerCase()) === 0
    );
  }

  optionActivated($event: MatAutocompleteActivatedEvent) {
    if ($event.option) {
      this.autocompleteTagsOptionActivated = true;
    }
  }

  selectedTag(event: MatAutocompleteSelectedEvent): void {
    this.formArrayTags.push(this.formBuilder.control(event.option.viewValue));
    this.tagInput.nativeElement.value = '';
    this.tagsControl.setValue(null);
    this.autocompleteTagsOptionActivated = false;
  }

  get formArrayTags() {
    return <UntypedFormArray>this.snippetFormGroup.get('tags');
  }

  createCodeSnippet(codeSnippet: CodeSnippet): UntypedFormGroup {
    return this.formBuilder.group({
      code: [codeSnippet.code, textSizeValidator(10000, 1000)],
      comment: codeSnippet.comment,
      commentAfter: codeSnippet.commentAfter,
    });
  }

  createInitialCodeSnippet(): UntypedFormGroup {
    return this.formBuilder.group({
      code: ['', textSizeValidator(10000, 1000)],
      comment: ['', textSizeValidator(1000, 30)],
      commentAfter: ['', textSizeValidator(1000, 30)],
    });
  }

  createEmptyCodeSnippet(): UntypedFormGroup {
    return this.formBuilder.group({
      code: ['', textSizeValidator(10000, 1000)],
      comment: ['', textSizeValidator(1000, 30)],
      commentAfter: ['', textSizeValidator(1000, 30)],
    });
  }

  addEmptyCodeSnippet(index: number): void {
    this.codeSnippetsFormArray.insert(index + 1, this.createEmptyCodeSnippet());
  }

  removeCodeSnippet(index: number) {
    this.codeSnippetsFormArray.removeAt(index);
  }

  createSnippet(snippet: Snippet, copyToMine: boolean, popup: any) {
    snippet.userId = this.userId;
    snippet.shareableId = undefined;
    const now = new Date();
    snippet.lastAccessedAt = now;
    if (copyToMine) {
      delete snippet['_id'];
      snippet.createdAt = now;
    }

    this.personalSnippetsService.createSnippet(this.userId, snippet).subscribe(
      (response) => {
        const headers = response.headers;
        // get the snippet id, which lies in the "location" response header
        const lastSlashIndex = headers.get('location').lastIndexOf('/');
        const newSnippetId = headers
          .get('location')
          .substring(lastSlashIndex + 1);
        snippet._id = newSnippetId;
        const queryParams = popup ? { popup: popup } : {};
        this.navigateToSnippetDetails(snippet, queryParams);
      },
      (error: HttpResponse<any>) => {
        this.errorService.handleError(error.body.json());
        return observableThrowError(error.body.json());
      }
    );
  }

  navigateToSnippetDetails(snippet: Snippet, queryParams: Params): void {
    const link = [`./my-snippets/${snippet._id}/details`];
    this.router.navigate(link, {
      state: { snippet: snippet },
      queryParams: queryParams,
    });
  }
}
