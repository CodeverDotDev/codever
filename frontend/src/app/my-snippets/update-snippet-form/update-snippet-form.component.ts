import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { tagsValidator } from '../../shared/directive/tags-validation.directive';
import { Logger } from '../../core/logger.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ErrorService } from '../../core/error/error.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { SuggestedTagsStore } from '../../core/user/suggested-tags.store';
import { Snippet } from '../../core/model/snippet';
import { PersonalSnippetsService } from '../../core/personal-snippets.service';
import { DeleteSnippetDialogComponent } from '../delete-snippet-dialog/delete-snippet-dialog.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { PublicSnippetsService } from '../../public/snippets/public-snippets.service';
import { SnippetFormBaseComponent } from '../snippet-form-base/snippet-form.base.component';

@Component({
  selector: 'app-update-snippet-form',
  templateUrl: './update-snippet-form.component.html',
  styleUrls: ['./update-snippet-form.component.scss']
})
export class UpdateSnippetFormComponent extends SnippetFormBaseComponent implements OnInit, OnChanges {

  snippetFormGroup: FormGroup;
  codeSnippetsFormArray: FormArray;
  userId = null;

  @Input()
  snippet: Snippet;

  @ViewChild('tagInput', {static: false})
  tagInput: ElementRef;

  @Input()
  isUpdate: boolean;

  @Input()
  copyToMine = false;

  constructor(
    protected formBuilder: FormBuilder,
    protected personalSnippetsService: PersonalSnippetsService,
    private publicSnippetsService: PublicSnippetsService,
    protected suggestedTagsStore: SuggestedTagsStore,
    protected userInfoStore: UserInfoStore,
    private logger: Logger,
    protected router: Router,
    private route: ActivatedRoute,
    protected errorService: ErrorService,
    private deleteDialog: MatDialog
  ) {
    super(formBuilder, personalSnippetsService, suggestedTagsStore, userInfoStore, router, errorService);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // only run when property "snippet" changed
    if (this.snippet) {
      this.buildInitialForm();
      this.patchFormWithData(this.snippet);
    }
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  private patchFormWithData(snippet: Snippet) {
    this.snippetFormGroup.patchValue(snippet);
    if (this.copyToMine) {
      this.snippet.public = false;
      this.snippetFormGroup.get('public').setValue(false);
      this.snippetFormGroup.get('copiedFromId').setValue(snippet._id);
    }

    for (let i = 0; i < this.snippet.tags.length; i++) {
      this.formArrayTags.push(this.formBuilder.control(this.snippet.tags[i]));
    }

    this.codeSnippetsFormArray.removeAt(0); // there is an empty element created when building form - needs removing
    for (let i = 0; i < snippet.codeSnippets.length; i++) {
      this.codeSnippetsFormArray.push(this.createCodeSnippet(snippet.codeSnippets[i]));
    }

    this.tagsControl.setValue(null);
    this.formArrayTags.markAsDirty();
  }

  buildInitialForm(): void {
    this.snippetFormGroup = this.formBuilder.group({
      title: ['', Validators.required],
      tags: this.formBuilder.array([], [tagsValidator, Validators.required]),
      codeSnippets: new FormArray([this.createInitialCodeSnippet()]),
      sourceUrl: '',
      public: false,
      copiedFromId: null
    });

    this.codeSnippetsFormArray = this.snippetFormGroup.get('codeSnippets') as FormArray;
  }

  saveSnippet(snippet: Snippet) {
    if (this.copyToMine) {
      super.createSnippet(snippet, this.copyToMine, null);
    } else {
      this.updateSnippet(snippet);
    }
  }

  updateSnippet(snippet: Snippet): void {
    const now = new Date();
    snippet.updatedAt = now;
    snippet.lastAccessedAt = now;
    snippet.userId = this.snippet.userId;
    snippet._id = this.snippet._id;

    this.personalSnippetsService.updateSnippet(snippet)
      .subscribe(
        () => {
          super.navigateToSnippetDetails(snippet, {})
        },
        () => this.navigateToSnippetDetails(snippet, {})
      );
  }

  openDeleteDialog() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      codeletTitle: this.snippet.title,
    };

    const dialogRef = this.deleteDialog.open(DeleteSnippetDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(
      data => {
        if (data === 'DELETE_CONFIRMED') {
          this.deleteCodelet(this.snippet._id);
        }
      }
    );
  }

  deleteCodelet(codeletId: string) {
    this.personalSnippetsService.deleteSnippetById(this.userId, codeletId).subscribe(() => {
      console.log('Delete snippet with id - ' + codeletId);
      this.router.navigate(
        ['']
      );
    });
  }

}


