import { map, startWith } from 'rxjs/operators';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { KeycloakService } from 'keycloak-angular';
import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';
import { MatAutocompleteSelectedEvent, MatChipInputEvent, MatDialog, MatDialogConfig } from '@angular/material';
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
import { DeleteCodeletDialogComponent } from '../delete-codelet-dialog/delete-codelet-dialog.component';
import { textSizeValidator } from '../../core/validators/text-size.validator';

@Component({
  selector: 'app-save-codelet-form',
  templateUrl: './save-codelet-form.component.html',
  styleUrls: ['./save-codelet-form.component.scss']
})
export class SaveCodeletFormComponent implements OnInit {

  codeletFormGroup: FormGroup;
  codeSnippetsFormArray: FormArray;
  userId = null;
  private userData: UserData;

  // chips
  selectable = true;
  removable = true;
  addOnBlur = true;

  // Enter, comma, space
  separatorKeysCodes = [ENTER, COMMA, SPACE];

  commonCodeletTags = codelet_common_tags;

  autocompleteTags = [];

  tagsControl = new FormControl();

  filteredTags: Observable<any[]>;

  @Input()
  codelet$: Observable<Codelet>;

  @ViewChild('tagInput', {static: false})
  tagInput: ElementRef;

  @Input()
  isUpdate: boolean;

  codelet: Codelet;

  @Input()
  code; // value of "desc" query parameter if present

  @Input()
  title; // value of "title" query parameter if present

  @Input()
  sourceUrl; // value of "url" query parameter if present

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
    private deleteDialog: MatDialog
  ) {
    this.userInfoStore.getUserInfo$().subscribe(userInfo => {
      this.userId = userInfo.sub;
      this.userDataStore.getUserData$().subscribe(userData => {
        this.userData = userData;
      });
      this.suggestedTagsStore.getSuggestedCodeletTags$(this.userId).subscribe(userTags => {

        this.autocompleteTags = userTags.concat(this.commonCodeletTags.filter((item => userTags.indexOf(item) < 0 ))).sort();

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

    if (this.isUpdate && this.codelet$) {
      this.codelet$.subscribe(codelet => {
        this.codelet = codelet;

        this.codeletFormGroup.get('title').setValue(codelet.title);
        this.codeletFormGroup.get('sourceUrl').setValue(codelet.sourceUrl);

        const formTags = this.codeletFormGroup.get('tags') as FormArray;
        for (let i = 0; i < this.codelet.tags.length; i++) {
          formTags.push(this.formBuilder.control(this.codelet.tags[i]));

        }

        this.codeSnippetsFormArray.removeAt(0); // there is an empty element created when building form - needs removing
        for (let i = 0; i < codelet.codeSnippets.length; i++) {
          // this.codeSnippetsFormArray.push(this.createCodeSnippet(codelet.codeSnippets[i]));
          this.codeSnippetsFormArray.push(this.createCodeSnippet(codelet.codeSnippets[i]));
        }

        this.tagsControl.setValue(null);
        this.tags.markAsDirty();
      });
    }
  }


  buildInitialForm(): void {
    this.codeletFormGroup = this.formBuilder.group({
      title: [this.title ? this.title : '', Validators.required],
      tags: this.formBuilder.array([], [tagsValidator, Validators.required]),
      // codeSnippet: ['', [descriptionSizeValidator, Validators.required]],
      codeSnippets: new FormArray([this.createInitialCodeSnippet()]),
      sourceUrl: this.sourceUrl ? this.sourceUrl : ''
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
      comment: ''
    });
  }

  createEmptyCodeSnippet(): FormGroup {
    return this.formBuilder.group({
      code: ['', textSizeValidator(5000, 500)],
      comment: ''
    });
  }

  addEmptyCodeSnippet(): void {
    this.codeSnippetsFormArray.push(this.createEmptyCodeSnippet());
  }

  addTag(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our tag
    if ((value || '').trim()) {
      const tags = this.codeletFormGroup.get('tags') as FormArray;
      tags.push(this.formBuilder.control(value.trim().toLowerCase()));
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.tagsControl.setValue(null);
    this.tags.markAsDirty();
  }

  removeTagByIndex(index: number): void {
    const tags = this.codeletFormGroup.get('tags') as FormArray;

    if (index >= 0) {
      tags.removeAt(index);
    }
    this.tags.markAsDirty();
  }

  filter(name: string) {
    return this.autocompleteTags.filter(tag => tag.toLowerCase().indexOf(name.toLowerCase()) === 0);
  }

  selectedTag(event: MatAutocompleteSelectedEvent): void {
    const tags = this.codeletFormGroup.get('tags') as FormArray;
    tags.push(this.formBuilder.control(event.option.viewValue));
    this.tagInput.nativeElement.value = '';
    this.tagsControl.setValue(null);
  }

  saveCodelet(codelet: Codelet) {
    if (this.isUpdate) {
      this.updateCodelet(codelet)
    } else {
      this.createCodelet(codelet);
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
      [`/my-codelets/${codeletId}`],
      {
        queryParams: {popup: this.popup}
      }
    );
  }

  private createCodelet(codelet: Codelet) {
    codelet.userId = this.userId;
    codelet.lastAccessedAt = new Date();

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

  get tags() {
    return <FormArray>this.codeletFormGroup.get('tags');
  }

  removeCodeSnippet(i: number) {
    this.codeSnippetsFormArray.removeAt(i);
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


