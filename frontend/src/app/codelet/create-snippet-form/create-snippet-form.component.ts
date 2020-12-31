import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { tagsValidator } from '../../shared/tags-validation.directive';
import { UserDataStore } from '../../core/user/userdata.store';
import { Logger } from '../../core/logger.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ErrorService } from '../../core/error/error.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { SuggestedTagsStore } from '../../core/user/suggested-tags.store';
import { Codelet } from '../../core/model/codelet';
import { PersonalCodeletsService } from '../../core/personal-codelets.service';
import { textSizeValidator } from '../../core/validators/text-size.validator';
import { WebpageInfoService } from '../../core/webpage-info/webpage-info.service';
import { StackoverflowHelper } from '../../core/stackoverflow.helper';
import { WebpageInfo } from '../../core/model/webpage-info';
import { SnippetFormBaseComponent } from '../snippet-form-base/snippet-form.base.component';

@Component({
  selector: 'app-save-codelet-form',
  templateUrl: './create-snippet-form.component.html',
  styleUrls: ['./create-snippet-form.component.scss']
})
export class CreateSnippetFormComponent extends SnippetFormBaseComponent implements OnInit {

  codeletFormGroup: FormGroup;
  codeSnippetsFormArray: FormArray;
  userId = null;

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
    protected formBuilder: FormBuilder,
    protected personalCodeletsService: PersonalCodeletsService,
    protected suggestedTagsStore: SuggestedTagsStore,
    protected userInfoStore: UserInfoStore,
    private userDataStore: UserDataStore,
    private logger: Logger,
    protected router: Router,
    private route: ActivatedRoute,
    protected errorService: ErrorService,
    private webpageInfoService: WebpageInfoService,
    private stackoverflowHelper: StackoverflowHelper,
  ) {
    super(formBuilder, personalCodeletsService, suggestedTagsStore, userInfoStore, router, errorService);
  }

  ngOnInit(): void {
    super.ngOnInit();
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

  createInitialCodeSnippet(): FormGroup {
    return this.formBuilder.group({
      code: [this.code ? this.code : '', textSizeValidator(5000, 500)],
      comment: [this.comment ? this.comment : '', textSizeValidator(1000, 30)]
    });
  }

}


