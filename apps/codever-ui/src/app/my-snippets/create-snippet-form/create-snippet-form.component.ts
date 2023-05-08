import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { tagsValidator } from '../../shared/directive/tags-validation.directive';
import { UserDataStore } from '../../core/user/userdata.store';
import { Logger } from '../../core/logger.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ErrorService } from '../../core/error/error.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { SuggestedTagsStore } from '../../core/user/suggested-tags.store';
import { Origin, Snippet } from '../../core/model/snippet';
import { PersonalSnippetsService } from '../../core/personal-snippets.service';
import { textSizeValidator } from '../../core/validators/text-size.validator';
import { WebpageInfoService } from '../../core/webpage-info/webpage-info.service';
import { StackoverflowHelper } from '../../core/helper/stackoverflow.helper';
import { WebpageInfo } from '../../core/model/webpage-info';
import { SnippetFormBaseComponent } from '../snippet-form-base/snippet-form.base.component';

@Component({
  selector: 'app-save-snippet-form',
  templateUrl: './create-snippet-form.component.html',
  styleUrls: ['./create-snippet-form.component.scss'],
})
export class CreateSnippetFormComponent
  extends SnippetFormBaseComponent
  implements OnInit
{
  snippetFormGroup: UntypedFormGroup;
  codeSnippetsFormArray: UntypedFormArray;
  userId = null;

  @ViewChild('tagInput', { static: false })
  tagInput: ElementRef;

  snippet: Snippet;

  @Input()
  code; // value of "desc" query parameter if present

  @Input()
  title; // value of "title" query parameter if present

  @Input()
  location; // value of "url" query parameter if present

  @Input()
  tagsStr; // tags received - string with comma separated values

  @Input()
  popup; // if it's popup window

  @Input()
  ext; // there the call is coming from

  @Input()
  initiator;

  @Input()
  file;

  @Input()
  project;

  @Input()
  workspace;

  origin: Origin;

  constructor(
    protected formBuilder: UntypedFormBuilder,
    protected personalSnippetsService: PersonalSnippetsService,
    protected suggestedTagsStore: SuggestedTagsStore,
    protected userInfoStore: UserInfoStore,
    private userDataStore: UserDataStore,
    private logger: Logger,
    protected router: Router,
    private route: ActivatedRoute,
    protected errorService: ErrorService,
    private webpageInfoService: WebpageInfoService,
    private stackoverflowHelper: StackoverflowHelper
  ) {
    super(
      formBuilder,
      personalSnippetsService,
      suggestedTagsStore,
      userInfoStore,
      router,
      errorService
    );
  }

  ngOnInit(): void {
    this.setSnippetOrigin();
    super.ngOnInit();
    this.buildInitialForm();
    this.codeSnippetsFormArray = this.snippetFormGroup.get(
      'codeSnippets'
    ) as UntypedFormArray;

    if (this.location) {
      const stackoverflowQuestionId =
        this.stackoverflowHelper.getStackoverflowQuestionIdFromUrl(
          this.location
        );
      if (stackoverflowQuestionId) {
        this.webpageInfoService
          .getStackoverflowQuestionData(stackoverflowQuestionId)
          .subscribe(
            (webpageData: WebpageInfo) => {
              if (webpageData.tags) {
                for (let i = 0; i < webpageData.tags.length; i++) {
                  this.formArrayTags.push(
                    this.formBuilder.control(webpageData.tags[i])
                  );
                }

                this.tagsControl.setValue(null);
                this.formArrayTags.markAsDirty();
              }
            },
            (error) => {
              console.error(
                `Problems when scraping data for stackoverflow id ${stackoverflowQuestionId}`,
                error
              );
            }
          );
      }
    }

    this.setTagsFromQueryParameter();
  }

  private setSnippetOrigin() {
    if (this.file || this.project || this.workspace || this.location) {
      this.origin = {
        location: this.location, // holds either the URL from the web or file path if it comes from IDE extensions
        file: this.file,
        project: this.project,
        workspace: this.workspace,
      };
    }
  }

  private setTagsFromQueryParameter() {
    if (this.tagsStr) {
      const tags: string[] = this.tagsStr.split(',');
      for (let i = 0; i < tags.length; i++) {
        this.formArrayTags.push(this.formBuilder.control(tags[i].trim()));
      }

      this.tagsControl.setValue(null);
      this.formArrayTags.markAsDirty();
    }
  }

  buildInitialForm(): void {
    this.snippetFormGroup = this.formBuilder.group({
      title: [
        this.title
          ? this.ext === 'vscode'
            ? this.decodeTextVsCode(this.title)
            : this.title
          : '',
        Validators.required,
      ],
      tags: this.formBuilder.array([], [tagsValidator, Validators.required]),
      codeSnippets: new UntypedFormArray([this.createInitialCodeSnippet()]),
      reference: this.location ? this.location : '',
      public: false,
    });
  }

  createInitialCodeSnippet(): UntypedFormGroup {
    if (this.code) {
      this.code = this.removeLeadingWhitespaces(this.code);
    }

    return this.formBuilder.group({
      code: [
        this.code
          ? this.ext === 'vscode'
            ? this.decodeTextVsCode(this.code)
            : this.code
          : '',
        textSizeValidator(10000, 1000),
      ],
      comment: ['', textSizeValidator(1000, 30)],
      commentAfter: [
        this.getComment(this.project, this.workspace, this.file),
        textSizeValidator(1000, 30),
      ],
    });
  }

  private getComment(
    project: string | undefined,
    workspace: string | undefined,
    file: string | undefined
  ): string {
    let comment = '';

    if (workspace) {
      comment += `**Workspace**: \`${workspace}\``;
    }

    if (project) {
      comment += `**Project**: \`${project}\``;
    }

    if (file) {
      comment += `**File**: \`${file}\``;
    }

    return comment.trim();
  }

  decodeTextVsCode(text: string): string {
    let response = text.replace(/ampc;/gi, '&');
    response = response.replace(/qmc;/gi, '?');
    response = response.replace(/hashc;/gi, '#');

    return response;
  }

  /**
   * Remove leading whitespaces - max number removed is given by the number of white spaces of the first line
   */
  removeLeadingWhitespaces(code: string): string {
    const LINE_EXPRESSION = /\r\n|\n\r|\n|\r/g; // expression symbols order is very important
    const lines = code.split(LINE_EXPRESSION);
    const firstLineNumberSpaces = lines[0].length - lines[0].trimLeft().length;
    if (firstLineNumberSpaces > 0) {
      let response = '';
      for (let i = 0; i < lines.length - 1; i++) {
        response +=
          lines[i]
            .substring(firstLineNumberSpaces, lines[i].length)
            .trimRight() + '\r\n';
      }
      response += lines[lines.length - 1]
        .substring(firstLineNumberSpaces, lines[lines.length - 1].length)
        .trimRight();
      return response;
    } else {
      return code;
    }
  }
}
