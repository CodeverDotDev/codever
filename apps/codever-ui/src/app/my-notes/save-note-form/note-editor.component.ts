import { map, startWith, switchMap, takeUntil } from 'rxjs/operators';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
import { AddToCollectionDialogComponent } from '../../shared/add-to-collection-dialog/add-to-collection-dialog.component';
import { NotePreviewDialogComponent } from './note-preview-dialog/note-preview-dialog.component';
import {
  AiRefineDialogComponent,
  AiRefineDialogResult,
} from './ai-refine-dialog/ai-refine-dialog.component';
import {
  AiRefineResultDialogComponent,
  AiRefineAcceptedChanges,
} from './ai-refine-result-dialog/ai-refine-result-dialog.component';
import { PersonalCollectionsService } from '../../core/personal-collections.service';
import { FeatureToggleService } from '../../core/feature-toggle.service';

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

  /** When true, after saving the dialog to add to collection is opened */
  selectedCollectionIds: string[] = [];

  /** Whether the AI note refine feature is enabled for the current user */
  isAiNoteRefineEnabled$: Observable<boolean>;
  /** Whether an AI refine request is in progress (shows loader on button) */
  isRefining = false;

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
  copyToMine = false;

  @Input()
  initiator: string;

  @Input()
  reference = '';

  /** Tags pre-populated from IDE extension params (e.g. language tag + 'code-snippet') */
  @Input()
  passedTags: string[] = [];

  /** Origin metadata from IDE extensions */
  @Input()
  originLocation: string;

  @Input()
  originFile: string;

  @Input()
  originProject: string;

  @Input()
  originWorkspace: string;

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
    private deleteNotificationService: DeleteNotificationService,
    private personalCollectionsService: PersonalCollectionsService,
    private featureToggleService: FeatureToggleService,
    private cd: ChangeDetectorRef
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
    this.isAiNoteRefineEnabled$ = this.featureToggleService.isAiNoteRefineEnabled();

    if (!this.isEditMode && !this.cloneNote && !this.copyToMine) {
      this.buildForm();
    }
  }

  buildForm(): void {
    this.noteForm = this.formBuilder.group({
      title: [this.title ? this.title : '', Validators.required],
      reference: this.reference,
      tags: this.formBuilder.array([], [tagsValidator, Validators.required]),
      content: [this.passedContent, textSizeValidator(this.maxNumberOfCharacters, 30000)],
      public: false,
    });

    // Pre-populate tags passed from IDE extensions
    if (this.passedTags && this.passedTags.length > 0) {
      const formTags = this.noteForm.get('tags') as UntypedFormArray;
      this.passedTags.forEach((tag) => formTags.push(this.formBuilder.control(tag)));
      this.tags.markAsDirty();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.noteForm) {
      this.buildForm();
    }
    if (this.note && (this.isEditMode || this.cloneNote || this.copyToMine)) {
      this.noteForm.patchValue({
        title: this.cloneNote ? `CLONE - ${this.note.title}` : this.note.title,
        content: this.note.content,
        reference: this.note.reference,
        // cloned and copy-to-mine notes are always private
        public: (this.cloneNote || this.copyToMine) ? false : !!this.note.public,
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
    // Validate content is not empty before proceeding
    const contentControl = this.noteForm.get('content');
    if (!contentControl.value || !contentControl.value.trim()) {
      contentControl.setErrors({ required: true });
      contentControl.markAsTouched();
      contentControl.markAsDirty();
      return;
    }

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

  openAddToCollectionDialog(): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '420px';
    dialogConfig.data = {
      resourceType: 'note' as const,
      userId: this.userId as unknown as string,
    };

    const dialogRef = this.deleteDialog.open(
      AddToCollectionDialogComponent,
      dialogConfig
    );
    dialogRef.afterClosed().subscribe((selectedIds: string[] | undefined) => {
      if (selectedIds) {
        this.selectedCollectionIds = selectedIds;
        this.cd.markForCheck();
      }
    });
  }

  /**
   * Open a dialog showing the rendered markdown preview of the note content.
   */
  openPreview(): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '95vw';
    dialogConfig.maxHeight = '90vh';
    dialogConfig.data = {
      title: this.noteForm.get('title').value || 'Untitled',
      content: this.noteForm.get('content').value || '',
      contentType: this.isNotebookMode ? 'notebook' : 'markdown',
      notebookContent: this.isNotebookMode ? this.notebookRawJson : undefined,
    };

    this.deleteDialog.open(NotePreviewDialogComponent, dialogConfig);
  }

  /**
   * Open a dialog where the user can review and customize the AI system prompt,
   * then trigger the AI refine. On success, patches the form with the result.
   */
  refineWithAi(): void {
    if (this.isNotebookMode) {
      return;
    }

    const DEFAULT_INSTRUCTIONS = `You are a helpful assistant that refines markdown notes.
Given a note's title, content, tags, and optional reference URL, you should:
1. Polish the content for grammar, clarity, and structure while preserving the original meaning and markdown formatting.
2. Suggest relevant tags (lowercase, hyphenated for multi-word, max 8 tags).
3. Suggest a better title if the current one could be improved.`;

    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '700px';
    dialogConfig.maxHeight = '90vh';
    dialogConfig.disableClose = true;
    dialogConfig.data = {
      userId: this.userId,
      title: this.noteForm.get('title').value || '',
      content: this.noteForm.get('content').value || '',
      tags: this.noteForm.get('tags').value || [],
      reference: this.noteForm.get('reference').value || '',
      defaultPrompt: DEFAULT_INSTRUCTIONS,
    };

    const dialogRef = this.deleteDialog.open(
      AiRefineDialogComponent,
      dialogConfig
    );

    dialogRef.afterClosed().subscribe((result: AiRefineDialogResult | undefined) => {
      if (!result) {
        return; // user cancelled
      }

      this.isRefining = true;
      this.cd.markForCheck();

      // Open the result comparison dialog
      this.openRefineResultDialog({
        resourceType: 'note',
        originalTitle: this.noteForm.get('title').value || '',
        originalContent: this.noteForm.get('content').value || '',
        originalTags: this.noteForm.get('tags').value || [],
        refinedTitle: result.suggestedTitle,
        refinedContent: result.refinedContent,
        suggestedTags: result.suggestedTags,
      });

      this.isRefining = false;
      this.cd.markForCheck();
    });
  }

  /**
   * Open a dialog showing the before/after comparison of AI-refined content,
   * letting the user choose which changes to apply.
   */
  private openRefineResultDialog(data: {
    resourceType: 'note' | 'bookmark';
    originalTitle: string;
    originalContent: string;
    originalTags: string[];
    refinedTitle: string;
    refinedContent: string;
    suggestedTags: string[];
  }): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '95vw';
    dialogConfig.maxHeight = '95vh';
    dialogConfig.disableClose = true;
    dialogConfig.data = data;

    const dialogRef = this.deleteDialog.open(
      AiRefineResultDialogComponent,
      dialogConfig
    );

    dialogRef
      .afterClosed()
      .subscribe((accepted: AiRefineAcceptedChanges | null) => {
        if (!accepted) {
          return; // user discarded all
        }

        // Apply only the accepted changes
        if (accepted.content) {
          this.noteForm
            .get('content')
            .patchValue(accepted.content, { emitEvent: false });
          this.noteForm.get('content').markAsDirty();
        }

        if (
          accepted.title &&
          accepted.title !== this.noteForm.get('title').value
        ) {
          this.noteForm
            .get('title')
            .patchValue(accepted.title, { emitEvent: false });
          this.noteForm.get('title').markAsDirty();
        }

        if (accepted.tags && accepted.tags.length > 0) {
          const formTags = this.noteForm.get('tags') as UntypedFormArray;
          const existingTags = formTags.value.map((t: string) =>
            t.toLowerCase()
          );
          accepted.tags.forEach((tag) => {
            const normalized = tag.toLowerCase().trim();
            if (!existingTags.includes(normalized) && formTags.length < 8) {
              formTags.push(this.formBuilder.control(normalized));
            }
          });
          this.tags.markAsDirty();
        }

        this.cd.markForCheck();
      });
  }

  /** After resource is saved, add it to each selected collection */
  private addToSelectedCollections(resourceId: string): void {
    if (this.selectedCollectionIds.length === 0) {
      return;
    }
    const ids = [...this.selectedCollectionIds];
    this.selectedCollectionIds = [];
    ids.forEach((collectionId) => {
      this.personalCollectionsService
        .addItemToCollection(
          this.userId as unknown as string,
          collectionId,
          resourceId,
          'note'
        )
        .subscribe();
    });
  }

  createNote(note: Note): void {
    const now = new Date();
    note.createdAt = now;
    note.updatedAt = now;
    note.userId = this.userId;
    note.initiator = this.initiator;

    // Attach origin metadata when coming from IDE extensions
    if (this.originLocation || this.originFile || this.originProject || this.originWorkspace) {
      note.origin = {
        location: this.originLocation || null,
        file: this.originFile || null,
        project: this.originProject || null,
        workspace: this.originWorkspace || null,
      };
    }

    this.personalNotesService
      .createNote(this.userId, note)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        const headers = response.headers;
        // get the snippet id, which lies in the "location" response header
        const lastSlashIndex = headers.get('location').lastIndexOf('/');
        const newNoteId = headers.get('location').substring(lastSlashIndex + 1);
        note._id = newNoteId;
        note.type = 'note';
        this.addToSelectedCollections(newNoteId);
        this.userDataStore.updateUserDataHistory$(note).subscribe();
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
    note.type = 'note';
    this.personalNotesService
      .updateNote(note)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.userDataStore.updateUserDataHistory$(note).subscribe();
        this.navigateToNoteDetails(note, {});
      });
  }

  cloneNoteFunction(note: Note): void {
    const now = new Date();
    note.createdAt = now;
    // For copy-to-mine, assign to the currently logged-in user; for clone, keep original owner
    note.userId = this.copyToMine ? this.userId : this.note.userId;
    note.public = false;
    delete note._id;
    this.personalNotesService
      .createNote(note.userId, note)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        const headers = response.headers;
        const lastSlashIndex = headers.get('location').lastIndexOf('/');
        const newNoteId = headers.get('location').substring(lastSlashIndex + 1);
        note._id = newNoteId;
        this.addToSelectedCollections(newNoteId);
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
        this.cd.markForCheck();

        // Extract readable text from markdown + code cells for full-text search
        const searchableText = this.extractSearchableText(nb);

        // Clear the content size validator — extracted text from notebooks can exceed
        // the normal 30k char limit; the backend validates notebookContent separately
        this.noteForm.get('content').clearValidators();
        this.noteForm.patchValue({ content: searchableText });
        this.noteForm.get('content').updateValueAndValidity();

        // Auto-fill the title from the filename if empty
        if (!this.noteForm.get('title').value) {
          const titleFromFile = file.name.replace(/\.ipynb$/, '');
          this.noteForm.patchValue({ title: titleFromFile });
        }
      } catch (e) {
        alert('Failed to parse notebook JSON: ' + (e as Error).message);
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
    this.cd.markForCheck();

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

