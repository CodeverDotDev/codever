import { map, startWith } from 'rxjs/operators';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { KeycloakService } from 'keycloak-angular';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Observable, throwError as observableThrowError } from 'rxjs';
import { codelet_common_tags } from '../../shared/codelet-common-tags';
import { tagsValidator } from '../../shared/tags-validation.directive';
import { HttpResponse } from '@angular/common/http';
import { UserDataStore } from '../../core/user/userdata.store';
import { Logger } from '../../core/logger.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ErrorService } from '../../core/error/error.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { SuggestedTagsStore } from '../../core/user/suggested-tags.store';
import { UserData } from '../../core/model/user-data';
import { Codelet, CodeSnippet } from '../../core/model/codelet';
import { PersonalCodeletsService } from '../../core/personal-codelets.service';
import { textSizeValidator } from '../../core/validators/text-size.validator';
import { WebpageInfoService } from '../../core/webpage-info/webpage-info.service';
import { StackoverflowHelper } from '../../core/stackoverflow.helper';
import { WebpageInfo } from '../../core/model/webpage-info';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteActivatedEvent, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

@Component({
  selector: 'app-save-codelet-form',
  templateUrl: './create-snippet-form.component.html',
  styleUrls: ['./create-snippet-form.component.scss']
})
export class CreateSnippetFormComponent implements OnInit {

  codeletFormGroup: FormGroup;
  codeSnippetsFormArray: FormArray;
  userId = null;
  private userData: UserData;

  // chips
  selectable = true;
  removable = true;
  addOnBlur = true;

  autocompleteTagsOptionActivated = false;

  // Enter, comma, space
  separatorKeysCodes = [ENTER, COMMA];

  commonCodeletTags = codelet_common_tags;

  autocompleteTags = [];

  tagsControl = new FormControl();

  filteredTags: Observable<any[]>;

  @Input()
  codelet$: Observable<Codelet>;

  @ViewChild('tagInput', {static: false})
  tagInput: ElementRef;

  codelet: Codelet;

  @Input()
  code; // value of "desc" query parameter if present

  @Input()
  title; // value of "title" query parameter if present

  @Input()
  sourceUrl; // value of "url" query parameter if present

  @Input()
  tagsStr; // tags received - string with comma separated values

  @Input()
  comment; // comment received via query

  @Input()
  popup; // if it's popup window

  constructor(
    private formBuilder: FormBuilder,
    private keycloakService: KeycloakService,
    private personalCodeletsService: PersonalCodeletsService,
    private suggestedTagsStore: SuggestedTagsStore,
    private userInfoStore: UserInfoStore,
    private userDataStore: UserDataStore,
    private logger: Logger,
    private router: Router,
    private route: ActivatedRoute,
    private errorService: ErrorService,
    private webpageInfoService: WebpageInfoService,
    private stackoverflowHelper: StackoverflowHelper,
  ) {
    this.userInfoStore.getUserInfo$().subscribe(userInfo => {
      this.userId = userInfo.sub;
      this.userDataStore.getUserData$().subscribe(userData => {
        this.userData = userData;
      });

      this.suggestedTagsStore.getSuggestedCodeletTags$(this.userId).subscribe(userTags => {
        this.autocompleteTags = userTags.concat(this.commonCodeletTags.filter((item => userTags.indexOf(item) < 0))).sort();
        this.filteredTags = this.tagsControl.valueChanges.pipe(
          startWith(null),
          map((tag: string | null) => {
            return tag ? this.filter(tag) : this.autocompleteTags.slice();
          })
        );
      });
    });

  }

  ngOnInit(): void {
    this.buildInitialForm();
    this.codeSnippetsFormArray = this.codeletFormGroup.get('codeSnippets') as FormArray;

    if (this.sourceUrl) {
      const stackoverflowQuestionId = this.stackoverflowHelper.getStackoverflowQuestionIdFromUrl(this.sourceUrl);
      if (stackoverflowQuestionId) {
        this.webpageInfoService.getStackoverflowQuestionData(stackoverflowQuestionId).subscribe((webpageData: WebpageInfo) => {
            if (webpageData.tags) {
              for (let i = 0; i < webpageData.tags.length; i++) {
                this.formArrayTags.push(this.formBuilder.control(webpageData.tags[i]));
              }

              this.tagsControl.setValue(null);
              this.formArrayTags.markAsDirty();
            }
          },
          error => {
            console.error(`Problems when scraping data for stackoverflow id ${stackoverflowQuestionId}`, error);
          });
      }
    }

    this.setTagsFromQueryParameter();
  }

  private setTagsFromQueryParameter() {
    if (this.tagsStr) {
      const tags: String[] = this.tagsStr.split(',');
      for (let i = 0; i < tags.length; i++) {
        this.formArrayTags.push(this.formBuilder.control(tags[i].trim()));
      }

      this.tagsControl.setValue(null);
      this.formArrayTags.markAsDirty();
    }
  }

  buildInitialForm(): void {
    this.codeletFormGroup = this.formBuilder.group({
      title: [this.title ? this.title : '', Validators.required],
      tags: this.formBuilder.array([], [tagsValidator, Validators.required]),
      codeSnippets: new FormArray([this.createInitialCodeSnippet()]),
      sourceUrl: this.sourceUrl ? this.sourceUrl : '',
      public: false
    });

  }

  createCodeSnippet(codeSnippet: CodeSnippet): FormGroup {
    return this.formBuilder.group({
      code: [codeSnippet.code, textSizeValidator(5000, 500)],
      comment: codeSnippet.comment
    });
  }

  createInitialCodeSnippet(): FormGroup {
    return this.formBuilder.group({
      code: [this.code ? this.code : '', textSizeValidator(5000, 500)],
      comment: [this.comment ? this.comment : '', textSizeValidator(1000, 30)]
    });
  }

  createEmptyCodeSnippet(): FormGroup {
    return this.formBuilder.group({
      code: ['', textSizeValidator(5000, 500)],
      comment: ['', textSizeValidator(1000, 30)]
    });
  }

  addEmptyCodeSnippet(index: number): void {
    this.codeSnippetsFormArray.insert(index + 1, this.createEmptyCodeSnippet());
  }

  removeCodeSnippet(index: number) {
    this.codeSnippetsFormArray.removeAt(index);
  }

  addTag(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim() && !this.autocompleteTagsOptionActivated) {
      // if ((value || '').trim()) {
      this.formArrayTags.push(this.formBuilder.control(value.trim().toLowerCase()));
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
    return this.autocompleteTags.filter(tag => tag.toLowerCase().indexOf(name.toLowerCase()) === 0);
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

  navigateToCodeletDetails(codeletId: string): void {
    this.router.navigate(
      [`/my-snippets/${codeletId}/details`],
      {
        queryParams: {popup: this.popup}
      }
    );
  }

  private createCodelet(codelet: Codelet) {
    codelet.userId = this.userId;
    const now = new Date();
    codelet.lastAccessedAt = now;

    this.personalCodeletsService.createCodelet(this.userId, codelet)
      .subscribe(
        response => {
          const headers = response.headers;
          // get the codelet id, which lies in the "location" response header
          const lastSlashIndex = headers.get('location').lastIndexOf('/');
          const newCodeletId = headers.get('location').substring(lastSlashIndex + 1);

          this.navigateToCodeletDetails(newCodeletId)
        },
        (error: HttpResponse<any>) => {
          this.errorService.handleError(error.body.json());
          return observableThrowError(error.body.json());
        }
      );
  }

  get formArrayTags() {
    return <FormArray>this.codeletFormGroup.get('tags');
  }

}


