import { map, startWith, switchMap, takeUntil } from 'rxjs/operators';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { MarkdownService } from '../../core/markdown/markdown.service';
import { KeycloakService } from 'keycloak-angular';
import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';
import { combineLatest, Observable, Subject } from 'rxjs';
import { languages } from '../../shared/constants/language-options';
import { tagsValidator } from '../../shared/directive/tags-validation.directive';
import { PersonalBookmarksService } from '../../core/personal-bookmarks.service';
import { UserDataStore } from '../../core/user/userdata.store';
import { Logger } from '../../core/logger.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ErrorService } from '../../core/error/error.service';
import { UserDataService } from '../../core/user-data.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { SuggestedTagsStore } from '../../core/user/suggested-tags.store';
import { MyBookmarksStore } from '../../core/user/my-bookmarks.store';
import { AdminService } from '../../core/admin/admin.service';
import { WebpageInfoService } from '../../core/webpage-info/webpage-info.service';
import { UserDataHistoryStore } from '../../core/user/userdata.history.store';
import { UserDataReadLaterStore } from '../../core/user/userdata.readlater.store';
import { UserData } from '../../core/model/user-data';
import { Location } from '@angular/common';
import { textSizeValidator } from '../../core/validators/text-size.validator';
import { StackoverflowHelper } from '../../core/helper/stackoverflow.helper';
import { UserDataPinnedStore } from '../../core/user/userdata.pinned.store';
import { MatChipInputEvent } from '@angular/material/chips';
import {
  MatAutocompleteActivatedEvent,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { Note } from '../../core/model/note';
import { PersonalNotesService } from '../../core/personal-notes.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DeleteResourceDialogComponent } from '../../shared/dialog/delete-bookmark-dialog/delete-resource-dialog.component';
import { ScrollStrategy, ScrollStrategyOptions } from '@angular/cdk/overlay';
import { DeleteNotificationService } from '../../core/notifications/delete-notification.service';

@Component({
  selector: 'app-note-editor',
  templateUrl: './note-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteEditorComponent implements OnInit, OnDestroy, OnChanges {
  noteForm: UntypedFormGroup;
  userId = null;
  private userData: UserData;

  // chips
  removable = true;
  addOnBlur = true;

  autocompleteTagsOptionActivated = false;

  // Enter, comma, space
  separatorKeysCodes = [ENTER, COMMA, SPACE];

  languages = languages;

  autocompleteTags = [];

  tagsControl = new UntypedFormControl();

  filteredTags: Observable<any[]>;

  readonly maxNumberOfCharacters = 30000;

  // --- Notebook upload state ---
  /** Whether a notebook file has been loaded (switches UI from textarea to notebook indicator) */
  isNotebookMode = false;
  /** Name of the uploaded .ipynb file (shown in the UI) */
  notebookFileName = '';
  /** Raw .ipynb JSON string to be stored in notebookContent */
  notebookRawJson = '';

  @Input()
  title; // value of "title" query parameter if present

  @Input()
  passedContent = ''; // value of "title" query parameter if present

  @Input()
  isEditMode = false;

  @ViewChild('tagInput', { static: false })
  tagInput: ElementRef;

  @Input()
  note: Note;

  @Input()
  cloneNote = false;

  @Input()
  initiator: string;

  @Input()
  reference = '';

  scrollStrategy: ScrollStrategy;

  private destroy$: Subject<void> = new Subject<void>();

  constructor(
    private formBuilder: UntypedFormBuilder,
    private keycloakService: KeycloakService,
    private userDataService: UserDataService,
    private markdownService: MarkdownService,
    private personalNotesService: PersonalNotesService,
    private myBookmarksStore: MyBookmarksStore,
    private personalBookmarksService: PersonalBookmarksService,
    private webpageInfoService: WebpageInfoService,
    private adminService: AdminService,
    private suggestedTagsStore: SuggestedTagsStore,
    private userInfoStore: UserInfoStore,
    private userDataStore: UserDataStore,
    private userdataHistoryStore: UserDataHistoryStore,
    private userDataReadLaterStore: UserDataReadLaterStore,
    private userDataPinnedStore: UserDataPinnedStore,
    private stackoverflowHelper: StackoverflowHelper,
    private _location: Location,
    private logger: Logger,
    private router: Router,
    private route: ActivatedRoute,
    private errorService: ErrorService,
    private readonly scrollStrategyOptions: ScrollStrategyOptions,
    private deleteDialog: MatDialog,
    private deleteNotificationService: DeleteNotificationService
  ) {
    combineLatest([
      this.userInfoStore.getUserId$(),
      this.userDataStore.getUserData$(),
    ])
      .pipe(
        takeUntil(this.destroy$),
        switchMap(([userId, userData]) => {
          this.userId = userId;
          this.userData = userData;
          return this.personalNotesService.getSuggestedNoteTags(this.userId);
        })
      )
      .subscribe((tags) => {
        this.autocompleteTags = tags;
        this.filteredTags = this.tagsControl.valueChanges.pipe(
          startWith(null),
          map((tag: string | null) => {
            return tag ? this.filter(tag) : this.autocompleteTags.slice();
          })
        );
      });

    this.scrollStrategy = this.scrollStrategyOptions.noop();
  }

  ngOnInit(): void {
    if (!this.isEditMode && !this.cloneNote) {
      this.buildForm();
    }
  }

  buildForm(): void {
    this.noteForm = this.formBuilder.group({
      title: [this.title ? this.title : '', Validators.required],
      reference: this.reference,
      tags: this.formBuilder.array([], [tagsValidator, Validators.required]),
      content: [this.passedContent, textSizeValidator(this.maxNumberOfCharacters, 30000)],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.noteForm) {
      this.buildForm();
    }
    if (this.note && (this.isEditMode || this.cloneNote)) {
      this.noteForm.patchValue({
        title: this.note.title,
        content: this.note.content,
        reference: this.note.reference,
      });
      for (let i = 0; i < this.note.tags.length; i++) {
        const formTags = this.noteForm.get('tags') as UntypedFormArray;
        formTags.push(this.formBuilder.control(this.note.tags[i]));
      }

      // Restore notebook mode if editing/cloning a notebook note
      if (this.note.contentType === 'notebook' && this.note.notebookContent) {
        this.isNotebookMode = true;
        this.notebookRawJson = this.note.notebookContent;
        this.notebookFileName = this.note.title + '.ipynb';
      }

      this.tagsControl.setValue(null);
      this.tags.markAsDirty();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addTag(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our tag (avoid double adding in angular material 9 see - https://stackoverflow.com/questions/52608700/angular-material-mat-chips-autocomplete-bug-matchipinputtokenend-executed-befo)
    if ((value || '').trim() && !this.autocompleteTagsOptionActivated) {
      const tags = this.noteForm.get('tags') as UntypedFormArray;
      tags.push(this.formBuilder.control(value.trim().toLowerCase()));
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.tagsControl.setValue(null);
    this.tags.markAsDirty();
  }

  optionActivated($event: MatAutocompleteActivatedEvent) {
    if ($event.option) {
      this.autocompleteTagsOptionActivated = true;
    }
  }

  selectedTag(event: MatAutocompleteSelectedEvent): void {
    const tags = this.noteForm.get('tags') as UntypedFormArray;
    tags.push(this.formBuilder.control(event.option.viewValue));
    this.tagInput.nativeElement.value = '';
    this.tagsControl.setValue(null);
    this.autocompleteTagsOptionActivated = false;
  }

  removeTagByIndex(index: number): void {
    const tags = this.noteForm.get('tags') as UntypedFormArray;

    if (index >= 0) {
      tags.removeAt(index);
    }
    this.tags.markAsDirty();
  }

  filter(name: string) {
    return this.autocompleteTags.filter(
      (tag) => tag.toLowerCase().indexOf(name.toLowerCase()) === 0
    );
  }

  saveNote(note: Note) {
    // Attach notebook fields before saving
    if (this.isNotebookMode) {
      note.contentType = 'notebook';
      note.notebookContent = this.notebookRawJson;
    } else {
      note.contentType = 'markdown';
    }

    if (this.isEditMode) {
      this.updateNote(note);
    } else if (this.cloneNote) {
      this.cloneNoteFunction(note);
    } else {
      this.createNote(note);
    }
  }

  createNote(note: Note): void {
    const now = new Date();
    note.createdAt = now;
    note.updatedAt = now;
    note.userId = this.userId;
    note.initiator = this.initiator;
    this.personalNotesService
      .createNote(this.userId, note)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        const headers = response.headers;
        // get the snippet id, which lies in the "location" response header
        const lastSlashIndex = headers.get('location').lastIndexOf('/');
        const newNoteId = headers.get('location').substring(lastSlashIndex + 1);
        note._id = newNoteId;
        this.navigateToNoteDetails(note, {});
      });
  }

  navigateToNoteDetails(note: Note, queryParams: Params): void {
    const link = [`./my-notes/${note._id}/details`];
    this.router.navigate(link, {
      state: { snippet: note },
      queryParams: queryParams,
    });
  }

  updateNote(note: Note): void {
    const now = new Date();
    note.updatedAt = now;
    note.userId = this.note.userId;
    note._id = this.note._id;
    this.personalNotesService
      .updateNote(note)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.navigateToNoteDetails(note, {});
      });
  }

  cloneNoteFunction(note: Note): void {
    const now = new Date();
    note.createdAt = now;
    note.userId = this.note.userId;
    delete note._id;
    this.personalNotesService
      .createNote(this.note.userId, note)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        const headers = response.headers;
        const lastSlashIndex = headers.get('location').lastIndexOf('/');
        const newNoteId = headers.get('location').substring(lastSlashIndex + 1);
        note._id = newNoteId;
        this.navigateToNoteDetails(note, {});
      });
  }

  get tags() {
    return <UntypedFormArray>this.noteForm.get('tags');
  }

  get content() {
    return this.noteForm.get('content');
  }

  // ---------------------------------------------------------------------------
  // Notebook (.ipynb) file upload handling
  // ---------------------------------------------------------------------------

  /**
   * Called when the user selects a .ipynb file.
   * Reads the file, validates it's a valid notebook JSON, extracts searchable
   * text into the 'content' form field, and stores the raw JSON for notebookContent.
   */
  onNotebookFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    if (!file.name.endsWith('.ipynb')) {
      alert('Please select a .ipynb file');
      return;
    }

    // 5 MB limit matching backend MAX_NUMBER_OF_CHARS_FOR_NOTEBOOK_CONTENT
    if (file.size > 5_000_000) {
      alert('Notebook file is too large. Maximum 5 MB allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = reader.result as string;
        const nb = JSON.parse(json);

        // Basic validation: must have a cells array (nbformat v4)
        if (!nb.cells || !Array.isArray(nb.cells)) {
          alert('Invalid notebook file: missing "cells" array.');
          return;
        }

        this.notebookRawJson = json;
        this.notebookFileName = file.name;
        this.isNotebookMode = true;

        // Extract readable text from markdown + code cells for full-text search
        const searchableText = this.extractSearchableText(nb);
        this.noteForm.patchValue({ content: searchableText });

        // Clear the content size validator — extracted text from notebooks can exceed
        // the normal 30k char limit; the backend validates notebookContent separately
        this.noteForm.get('content').clearValidators();
        this.noteForm.get('content').updateValueAndValidity();

        // Auto-fill the title from the filename if empty
        if (!this.noteForm.get('title').value) {
          const titleFromFile = file.name.replace(/\.ipynb$/, '');
          this.noteForm.patchValue({ title: titleFromFile });
        }
      } catch (e) {
        alert('Failed to parse notebook JSON: ' + e.message);
      }
    };
    reader.readAsText(file);
  }

  /** Remove the uploaded notebook and switch back to markdown mode */
  removeNotebook(): void {
    this.isNotebookMode = false;
    this.notebookFileName = '';
    this.notebookRawJson = '';
    this.noteForm.patchValue({ content: '' });

    // Restore the default content size validator for markdown notes
    this.noteForm
      .get('content')
      .setValidators(textSizeValidator(this.maxNumberOfCharacters, 30000));
    this.noteForm.get('content').updateValueAndValidity();
  }

  /**
   * Extract readable text from notebook cells for the full-text search index.
   * Concatenates markdown cell text and code cell source, separated by newlines.
   * This goes into the 'content' field (indexed by MongoDB), NOT the raw JSON.
   */
  private extractSearchableText(nb: any): string {
    const parts: string[] = [];
    for (const cell of nb.cells) {
      const source = Array.isArray(cell.source)
        ? cell.source.join('')
        : cell.source || '';
      if (cell.cell_type === 'markdown' || cell.cell_type === 'code') {
        parts.push(source);
      }
    }
    return parts.join('\n\n');
  }

  cancelUpdate() {
    this._location.back();
    console.log('goBack()...');
  }

  get formArrayTags() {
    return <UntypedFormArray>this.noteForm.get('tags');
  }

  openDeleteDialog(note: Note) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.scrollStrategy = this.scrollStrategy;
    dialogConfig.data = {
      resourceName: note.title,
      type: 'note',
    };

    const dialogRef = this.deleteDialog.open(
      DeleteResourceDialogComponent,
      dialogConfig
    );
    dialogRef.afterClosed().subscribe((data) => {
      if (data === 'DELETE_CONFIRMED') {
        this.deleteNote(note);
      }
    });
  }

  deleteNote(note: Note) {
    this.personalNotesService
      .deleteNoteById(this.userId, note._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          this.router.navigate(['']);
          this.deleteNotificationService.showSuccessNotification(
            `Note - "${note.title}" was deleted`
          );
        },
        () => {
          this.deleteNotificationService.showErrorNotification(
            'Note could not be deleted. Please try again later!'
          );
        }
      );
  }
}
