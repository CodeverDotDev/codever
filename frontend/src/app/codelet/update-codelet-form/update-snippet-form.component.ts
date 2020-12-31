import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { tagsValidator } from '../../shared/tags-validation.directive';
import { Logger } from '../../core/logger.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ErrorService } from '../../core/error/error.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { SuggestedTagsStore } from '../../core/user/suggested-tags.store';
import { Codelet } from '../../core/model/codelet';
import { PersonalCodeletsService } from '../../core/personal-codelets.service';
import { DeleteCodeletDialogComponent } from '../delete-codelet-dialog/delete-codelet-dialog.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { PublicSnippetsService } from '../../public/snippets/public-snippets.service';
import { SnippetFormBaseComponent } from '../snippet-form-base/snippet-form.base.component';

@Component({
  selector: 'app-update-snippet-form',
  templateUrl: './update-snippet-form.component.html',
  styleUrls: ['./update-snippet-form.component.scss']
})
export class UpdateSnippetFormComponent extends SnippetFormBaseComponent implements OnInit, OnChanges {

  codeletFormGroup: FormGroup;
  codeSnippetsFormArray: FormArray;
  userId = null;

  @Input()
  codelet: Codelet;

  @ViewChild('tagInput', {static: false})
  tagInput: ElementRef;

  @Input()
  isUpdate: boolean;

  @Input()
  copyToMine = false;

  constructor(
    protected formBuilder: FormBuilder,
    protected personalCodeletsService: PersonalCodeletsService,
    private publicSnippetsService: PublicSnippetsService,
    protected suggestedTagsStore: SuggestedTagsStore,
    protected userInfoStore: UserInfoStore,
    private logger: Logger,
    protected router: Router,
    private route: ActivatedRoute,
    protected errorService: ErrorService,
    private deleteDialog: MatDialog
  ) {
    super(formBuilder, personalCodeletsService, suggestedTagsStore, userInfoStore, router, errorService);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // only run when property "codelet" changed
    if (this.codelet) {
      this.buildInitialForm();
      this.patchFormWithData(this.codelet);
    }
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  private patchFormWithData(codelet: Codelet) {
    this.codeletFormGroup.patchValue(codelet);
    if (this.copyToMine) {
      this.codelet.public = false;
      this.codeletFormGroup.get('public').setValue(false);
      this.codeletFormGroup.get('copiedFromId').setValue(codelet._id);
    }

    for (let i = 0; i < this.codelet.tags.length; i++) {
      this.formArrayTags.push(this.formBuilder.control(this.codelet.tags[i]));
    }

    this.codeSnippetsFormArray.removeAt(0); // there is an empty element created when building form - needs removing
    for (let i = 0; i < codelet.codeSnippets.length; i++) {
      this.codeSnippetsFormArray.push(this.createCodeSnippet(codelet.codeSnippets[i]));
    }

    this.tagsControl.setValue(null);
    this.formArrayTags.markAsDirty();
  }

  buildInitialForm(): void {
    this.codeletFormGroup = this.formBuilder.group({
      title: ['', Validators.required],
      tags: this.formBuilder.array([], [tagsValidator, Validators.required]),
      codeSnippets: new FormArray([this.createInitialCodeSnippet()]),
      sourceUrl: '',
      public: false,
      copiedFromId: null
    });

    this.codeSnippetsFormArray = this.codeletFormGroup.get('codeSnippets') as FormArray;
  }

  saveCodelet(codelet: Codelet) {
    if (this.copyToMine) {
      super.createCodelet(codelet, this.copyToMine, null);
    } else {
      this.updateCodelet(codelet);
    }
  }

  updateCodelet(codelet: Codelet): void {
    const now = new Date();
    codelet.updatedAt = now;
    codelet.lastAccessedAt = now;
    codelet.userId = this.codelet.userId;
    codelet._id = this.codelet._id;

    this.personalCodeletsService.updateCodelet(codelet)
      .subscribe(
        () => {
          super.navigateToCodeletDetails(codelet, {})
        },
        () => this.navigateToCodeletDetails(codelet, {})
      );
  }

  openDeleteDialog() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      codeletTitle: this.codelet.title,
    };

    const dialogRef = this.deleteDialog.open(DeleteCodeletDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(
      data => {
        if (data === 'DELETE_CONFIRMED') {
          this.deleteCodelet(this.codelet._id);
        }
      }
    );
  }

  deleteCodelet(codeletId: string) {
    this.personalCodeletsService.deleteCodeletById(this.userId, codeletId).subscribe(() => {
      console.log('Delete codelet with id - ' + codeletId);
      this.router.navigate(
        ['']
      );
    });
  }

}


