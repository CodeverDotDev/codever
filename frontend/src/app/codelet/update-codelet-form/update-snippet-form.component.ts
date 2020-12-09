import { map, startWith } from 'rxjs/operators';
import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
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
import { Codelet, CodeSnippet } from '../../core/model/codelet';
import { PersonalCodeletsService } from '../../core/personal-codelets.service';
import { DeleteCodeletDialogComponent } from '../delete-codelet-dialog/delete-codelet-dialog.component';
import { textSizeValidator } from '../../core/validators/text-size.validator';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteActivatedEvent, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { PublicSnippetsService } from '../../public/snippets/public-snippets.service';

@Component({
  selector: 'app-update-snippet-form',
  templateUrl: './update-snippet-form.component.html',
  styleUrls: ['./update-snippet-form.component.scss']
})
export class UpdateSnippetFormComponent implements OnInit, OnChanges {

  codeletFormGroup: FormGroup;
  codeSnippetsFormArray: FormArray;
  userId = null;

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
  codelet: Codelet;

  @ViewChild('tagInput', {static: false})
  tagInput: ElementRef;

  @Input()
  isUpdate: boolean;

  @Input()
  copyToMine = false;

  constructor(
    private formBuilder: FormBuilder,
    private keycloakService: KeycloakService,
    private personalCodeletsService: PersonalCodeletsService,
    private publicSnippetsService: PublicSnippetsService,
    private suggestedTagsStore: SuggestedTagsStore,
    private userInfoStore: UserInfoStore,
    private userDataStore: UserDataStore,
    private logger: Logger,
    private router: Router,
    private route: ActivatedRoute,
    private errorService: ErrorService,
    private deleteDialog: MatDialog
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    // only run when property "data" changed
    if (this.codelet) {
      this.buildInitialForm();
      this.patchFormWithData(this.codelet);
    }
  }

  ngOnInit(): void {
    this.userInfoStore.getUserInfo$().subscribe(userInfo => {
      this.userId = userInfo.sub;
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

  createCodeSnippet(codeSnippet: CodeSnippet): FormGroup {
    return this.formBuilder.group({
      code: [codeSnippet.code, textSizeValidator(5000, 500)],
      comment: codeSnippet.comment
    });
  }

  createInitialCodeSnippet(): FormGroup {
    return this.formBuilder.group({
      code: ['', textSizeValidator(5000, 500)],
      comment: ['', textSizeValidator(1000, 30)]
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

  saveCodelet(codelet: Codelet) {
    if (this.copyToMine) {
      this.createCodelet(codelet);
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
          this.navigateToCodeletDetails(codelet._id)
        },
        () => this.navigateToCodeletDetails(codelet._id)
      );
  }

  navigateToCodeletDetails(codeletId: string): void {
    this.router.navigate(
      [`/my-snippets/${codeletId}/details`]
    );
  }

  private createCodelet(codelet: Codelet) {
    codelet.userId = this.userId;
    const now = new Date();
    codelet.lastAccessedAt = now;
    if (this.copyToMine) {
      delete codelet['_id'];
      codelet.createdAt = now
    }

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


