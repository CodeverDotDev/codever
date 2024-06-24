import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { tagsValidator } from '../../shared/directive/tags-validation.directive';
import { Logger } from '../../core/logger.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ErrorService } from '../../core/error/error.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { SuggestedTagsStore } from '../../core/user/suggested-tags.store';
import { Snippet } from '../../core/model/snippet';
import { PersonalSnippetsService } from '../../core/personal-snippets.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { PublicSnippetsService } from '../../public/snippets/public-snippets.service';
import { SnippetFormBaseComponent } from '../snippet-form-base/snippet-form.base.component';
import { Location } from '@angular/common';
import { DeleteResourceDialogComponent } from '../../shared/dialog/delete-bookmark-dialog/delete-resource-dialog.component';
import { ScrollStrategy, ScrollStrategyOptions } from '@angular/cdk/overlay';
import { DeleteNotificationService } from '../../core/notifications/delete-notification.service';

@Component({
  selector: 'app-update-snippet-form',
  templateUrl: './update-snippet-form.component.html',
  styleUrls: ['./update-snippet-form.component.scss'],
})
export class UpdateSnippetFormComponent
  extends SnippetFormBaseComponent
  implements OnInit, OnChanges
{
  declare snippetFormGroup: UntypedFormGroup;
  declare codeSnippetsFormArray: UntypedFormArray;
  userId = null;

  @Input()
  declare snippet: Snippet;

  @ViewChild('tagInput', { static: false })
  declare tagInput: ElementRef;

  @Input()
  isUpdate: boolean;

  @Input()
  copyToMine = false;

  scrollStrategy: ScrollStrategy;

  constructor(
    protected formBuilder: UntypedFormBuilder,
    protected personalSnippetsService: PersonalSnippetsService,
    private publicSnippetsService: PublicSnippetsService,
    protected suggestedTagsStore: SuggestedTagsStore,
    protected userInfoStore: UserInfoStore,
    private logger: Logger,
    protected router: Router,
    private route: ActivatedRoute,
    protected errorService: ErrorService,
    private deleteDialog: MatDialog,
    private _location: Location,
    private readonly scrollStrategyOptions: ScrollStrategyOptions,
    private deleteNotificationService: DeleteNotificationService
  ) {
    super(
      formBuilder,
      personalSnippetsService,
      suggestedTagsStore,
      userInfoStore,
      router,
      errorService
    );
    this.scrollStrategy = this.scrollStrategyOptions.noop();
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
      this.codeSnippetsFormArray.push(
        this.createCodeSnippet(snippet.codeSnippets[i])
      );
    }

    this.tagsControl.setValue(null);
    this.formArrayTags.markAsDirty();
  }

  buildInitialForm(): void {
    this.snippetFormGroup = this.formBuilder.group({
      title: ['', Validators.required],
      tags: this.formBuilder.array([], [tagsValidator, Validators.required]),
      codeSnippets: new UntypedFormArray([this.createInitialCodeSnippet()]),
      reference: '',
      public: false,
      copiedFromId: null,
    });

    this.codeSnippetsFormArray = this.snippetFormGroup.get(
      'codeSnippets'
    ) as UntypedFormArray;
  }

  saveSnippet(snippet: Snippet) {
    if (this.copyToMine) {
      super.createSnippet(snippet, this.copyToMine, null, 'copy-to-mine');
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

    this.personalSnippetsService.updateSnippet(snippet).subscribe(
      () => {
        super.navigateToSnippetDetails(snippet, {});
      },
      () => this.navigateToSnippetDetails(snippet, {})
    );
  }

  openDeleteDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.scrollStrategy = this.scrollStrategy;
    dialogConfig.data = {
      resourceName: this.snippet.title,
      type: 'snippet',
      isPublic: this.snippet.public,
    };

    const dialogRef = this.deleteDialog.open(
      DeleteResourceDialogComponent,
      dialogConfig
    );
    dialogRef.afterClosed().subscribe((data) => {
      if (data === 'DELETE_CONFIRMED') {
        this.deleteSnippet(this.snippet._id);
      }
    });
  }

  deleteSnippet(snippetId: string) {
    this.personalSnippetsService
      .deleteSnippetById(this.userId, snippetId)
      .subscribe(
        () => {
          this.router.navigate(['']);
          this.deleteNotificationService.showSuccessNotification(
            `Snippet - "${this.snippet.title}" was deleted`
          );
        },
        () => {
          this.deleteNotificationService.showErrorNotification(
            'Snippet could not be deleted. Please try again later!'
          );
        }
      );
  }

  cancelUpdate() {
    this._location.back();
    console.log('goBAck()...');
  }
}
