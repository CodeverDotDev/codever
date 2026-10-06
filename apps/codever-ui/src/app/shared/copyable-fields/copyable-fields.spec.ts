import {
  ChangeDetectorRef,
  provideZoneChangeDetection,
  SimpleChange,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UntypedFormBuilder } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { of } from 'rxjs';
import {
  copyableFieldsForm,
  copyableFieldsValue,
} from './copyable-fields.form';
import { CopyableFieldsEditorComponent } from './copyable-fields-editor.component';
import { EntryCopyableInfoComponent } from './entry-copyable-info.component';
import { NoteEditorComponent } from '../../my-notes/save-note-form/note-editor.component';
import { SaveBookmarkFormComponent } from '../../my-bookmarks/save-bookmark-form/save-bookmark-form.component';
import { Note } from '../../core/model/note';
import { Bookmark } from '../../core/model/bookmark';
import { HttpClientLocalStorageService } from '../../core/cache/http-client-local-storage.service';
import { LocalStorageService } from '../../core/cache/local-storage.service';
import { localStorageKeys } from '../../core/model/localstorage.cache-keys';
import { PersonalNotesService } from '../../core/personal-notes.service';
import { PersonalBookmarksService } from '../../core/personal-bookmarks.service';

const pair = { label: 'Command', value: 'npm test' };

describe('Copyable fields editor', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [CopyableFieldsEditorComponent],
      providers: [provideZoneChangeDetection()],
    })
  );

  it('accepts omission, exact limits, duplicate labels and trims only outer whitespace', () => {
    expect(copyableFieldsForm().valid).toBeTrue();
    const fields = copyableFieldsForm([
      { label: ' Command ', value: ' npm  test ' },
      pair,
    ]);
    expect(fields.valid).toBeTrue();
    expect(copyableFieldsValue(fields)).toEqual([
      { label: 'Command', value: 'npm  test' },
      pair,
    ]);
    expect(
      copyableFieldsForm(
        Array.from({ length: 10 }, () => ({
          label: 'l'.repeat(100),
          value: 'v'.repeat(1000),
        }))
      ).valid
    ).toBeTrue();
  });

  it('rejects blank, multiline and over-limit fields without truncation', () => {
    for (const value of [
      '',
      '   ',
      'a\nb',
      'a\rb',
      'a\u2028b',
      'a\u2029b',
      'v'.repeat(1001),
    ]) {
      expect(copyableFieldsForm([{ label: 'Label', value }]).invalid)
        .withContext(value)
        .toBeTrue();
    }
    for (const label of ['', ' ', 'l'.repeat(101), 'a\nb']) {
      expect(
        copyableFieldsForm([{ label, value: 'Value' }]).invalid
      ).toBeTrue();
    }
    expect(copyableFieldsForm(Array(11).fill(pair)).invalid).toBeTrue();
  });

  it('adds, reorders, removes and limits rows in the actual editor', () => {
    const fixture = TestBed.createComponent(CopyableFieldsEditorComponent);
    const fields = copyableFieldsForm([
      pair,
      { label: 'Command', value: 'npm build' },
    ]);
    fixture.componentRef.setInput('fields', fields);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Add optional label/value pairs'
    );
    fixture.nativeElement
      .querySelector('[aria-label="Move field 2 up"]')
      .click();
    expect(copyableFieldsValue(fields)[0].value).toBe('npm build');
    fixture.componentInstance.remove(1);
    fixture.componentInstance.add();
    fields.markAllAsTouched();
    fixture.detectChanges();
    expect(fields.invalid).toBeTrue();
    expect(
      fixture.nativeElement.querySelector('[role="alert"]')
    ).not.toBeNull();
    for (let i = 0; i < 20; i++) fixture.componentInstance.add();
    expect(fields.length).toBe(10);
    fixture.detectChanges();
    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    );
    expect(
      buttons.find((button) => button.textContent.trim() === 'Add field')
        .disabled
    ).toBeTrue();
    fixture.destroy();
  });

  it('starts collapsed without fields and expands from the accessible toggle', () => {
    const fixture = TestBed.createComponent(CopyableFieldsEditorComponent);
    fixture.componentRef.setInput('fields', copyableFieldsForm());
    fixture.detectChanges();
    const toggle = fixture.nativeElement.querySelector(
      '.copyable-fields-toggle'
    ) as HTMLButtonElement;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.textContent).not.toContain(
      'Add optional label/value pairs'
    );
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain(
      'Add optional label/value pairs'
    );
    fixture.destroy();
  });

  it('rejects pasted line breaks in the single-row value editor', () => {
    const fixture = TestBed.createComponent(CopyableFieldsEditorComponent);
    const fields = copyableFieldsForm([pair]);
    fixture.componentRef.setInput('fields', fields);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      '[aria-label="Field value"]'
    ) as HTMLTextAreaElement;
    input.value = 'first\nsecond';
    input.dispatchEvent(new Event('input'));
    expect(fields.invalid).toBeTrue();
    fixture.destroy();
  });
});

describe('Editor save and copy state', () => {
  // Exercise the real form/save methods without unrelated authentication/dialog services.
  function noteEditor(note?: Note, copy = false): NoteEditorComponent {
    const editor = Object.create(
      NoteEditorComponent.prototype
    ) as NoteEditorComponent;
    Object.assign(editor, {
      formBuilder: new UntypedFormBuilder(),
      passedContent: 'content',
      passedTags: ['test'],
      title: 'Title',
      reference: '',
      maxNumberOfCharacters: 30000,
      tagsControl: new UntypedFormBuilder().control(''),
      note,
      isEditMode: !!note && !copy,
      cloneNote: copy,
      copyToMine: false,
    });
    editor.buildForm();
    if (note) editor.ngOnChanges({ note: new SimpleChange(null, note, true) });
    return editor;
  }

  it('loads an old note without fields and submits an empty collection', () => {
    const editor = noteEditor({
      title: 'Title',
      content: 'content',
      tags: ['test'],
    } as Note);
    const update = spyOn(editor, 'updateNote');
    editor.saveNote(editor.noteForm.value);
    expect(update.calls.mostRecent().args[0].copyableFields).toEqual([]);
  });

  it('copies fields independently and retains source metadata on note clone/save', () => {
    const original = {
      title: 'Title',
      content: 'content',
      tags: ['test'],
      copyableFields: [pair],
      origin: { file: 'src/example.ts', project: 'project' },
      public: true,
    } as Note;
    const editor = noteEditor(original, true);
    const clone = spyOn(editor, 'cloneNoteFunction');
    editor.copyableFields.at(0).controls.value.setValue(' changed ');
    editor.saveNote(editor.noteForm.value);
    const submitted = clone.calls.mostRecent().args[0] as Note;
    expect(submitted.copyableFields[0].value).toBe('changed');
    expect(submitted.public).toBeFalse();
    expect(submitted.origin).toEqual(original.origin);
    expect(submitted.origin).not.toBe(original.origin);
    expect(original.copyableFields[0].value).toBe('npm test');
  });

  it('blocks an incomplete note row', () => {
    const editor = noteEditor();
    editor.noteForm.setControl(
      'copyableFields',
      copyableFieldsForm([{ label: 'Label', value: '' }])
    );
    const create = spyOn(editor, 'createNote');
    editor.saveNote(editor.noteForm.value);
    expect(create).not.toHaveBeenCalled();
    expect(editor.copyableFields.touched).toBeTrue();
  });

  it('includes fields in new bookmark payloads and validates copied bookmarks', () => {
    const editor: any = Object.create(SaveBookmarkFormComponent.prototype);
    Object.assign(editor, {
      formBuilder: new UntypedFormBuilder(),
      userId: 'owner',
      userData: { profile: { displayName: 'Owner' } },
      markdownService: { toHtml: () => '<p>content</p>' },
      personalBookmarksService: {
        createBookmark: jasmine.createSpy('create').and.returnValue(of()),
      },
    });
    spyOn(editor, 'onChanges');
    editor.buildForm();
    editor.bookmarkForm.patchValue({
      name: 'Name',
      location: 'https://example.com',
      description: 'content',
    });
    editor.tags.push(new UntypedFormBuilder().control('test'));
    editor.bookmarkForm.setControl(
      'copyableFields',
      copyableFieldsForm([{ label: ' Label ', value: ' value ' }])
    );
    editor.saveBookmark(editor.bookmarkForm.value);
    expect(
      editor.personalBookmarksService.createBookmark.calls.mostRecent().args[1]
        .copyableFields
    ).toEqual([{ label: 'Label', value: 'value' }]);
    editor.copyToMine = true;
    const copy = spyOn(editor, 'copyBookmarkToMine');
    editor.copyableFields.at(0).controls.value.setValue('');
    editor.saveBookmark(editor.bookmarkForm.value);
    expect(copy).not.toHaveBeenCalled();
    editor.copyableFields.at(0).controls.value.setValue('changed');
    editor.saveBookmark(editor.bookmarkForm.value);
    expect(
      (copy.calls.mostRecent().args[0] as Bookmark).copyableFields[0].value
    ).toBe('changed');
  });
});

describe('Entry copyable display', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [EntryCopyableInfoComponent],
      providers: [provideZoneChangeDetection()],
    })
  );

  it('omits empty sections and displays source separately without paths or workspace', () => {
    const fixture = TestBed.createComponent(EntryCopyableInfoComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('fieldset').length).toBe(0);
    fixture.componentRef.setInput('origin', {
      file: 'C:\\private\\Example.ts',
      project: 'Project',
      workspace: 'Secret workspace',
    });
    fixture.componentRef.setInput('fields', [
      pair,
      { label: 'Command', value: '<script>text</script>' },
    ]);
    fixture.detectChanges();
    const sections = fixture.nativeElement.querySelectorAll('fieldset');
    expect(sections.length).toBe(2);
    expect(sections[0].textContent).toContain('Source context');
    expect(sections[0].textContent).toContain('Example.ts');
    expect(sections[1].textContent).toContain('Additional fields (copyable)');
    expect(fixture.nativeElement.textContent).not.toContain('private');
    expect(fixture.nativeElement.textContent).not.toContain('Secret workspace');
    expect(fixture.nativeElement.querySelector('script')).toBeNull();
    expect(fixture.nativeElement.querySelector('input, textarea')).toBeNull();
    fixture.componentRef.setInput('origin', { project: 'Project' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('File name');
    fixture.destroy();
  });

  it('copies only values and gives feedback on success and denied permission', async () => {
    const cd = {
      markForCheck: jasmine.createSpy(),
    } as unknown as ChangeDetectorRef;
    const display = new EntryCopyableInfoComponent(cd);
    const write = spyOn(navigator.clipboard, 'writeText').and.returnValue(
      Promise.resolve()
    );
    await display.copy(pair);
    expect(write).toHaveBeenCalledWith('npm test');
    expect(display.copiedField).toBe(pair);
    expect(display.feedback).toBe('');
    write.and.returnValue(Promise.reject(new Error('Denied')));
    await display.copy(pair);
    expect(display.feedback).toContain('Select the value');
    expect(cd.markForCheck).toHaveBeenCalled();
  });
});

describe('Copyable-field save cache behavior', () => {
  let http: HttpTestingController;
  let storage: LocalStorageService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        HttpClientLocalStorageService,
        LocalStorageService,
        PersonalNotesService,
        PersonalBookmarksService,
      ],
    });
    http = TestBed.inject(HttpTestingController);
    storage = TestBed.inject(LocalStorageService);
    for (const key of Object.values(localStorageKeys))
      storage.save({ key, data: true, expirationHours: 1 });
  });
  afterEach(() => {
    http.verify();
    storage.cleanCachedKeys(Object.values(localStorageKeys));
  });
  for (const type of ['note', 'bookmark'] as const) {
    for (const operation of ['create', 'update'] as const) {
      it(`invalidates caches on ${type} ${operation}, not on failed requests`, () => {
        const service: any = TestBed.inject(
          type === 'note'
            ? PersonalNotesService
            : (PersonalBookmarksService as any)
        );
        const entry = {
          _id: 'id',
          userId: 'owner',
          copyableFields: [pair],
        } as Note & Bookmark;
        const send = () =>
          operation === 'create'
            ? service[type === 'note' ? 'createNote' : 'createBookmark'](
                'owner',
                entry
              )
            : service[type === 'note' ? 'updateNote' : 'updateBookmark'](entry);
        send().subscribe({ error: (error) => expect(error.status).toBe(400) });
        const failed = http.expectOne(
          (req) => req.method === (operation === 'create' ? 'POST' : 'PUT')
        );
        expect(JSON.parse(failed.request.body).copyableFields).toEqual([pair]);
        failed.flush({}, { status: 400, statusText: 'Bad Request' });
        expect(storage.load(localStorageKeys.userHistoryBookmarks)).toBeTrue();
        send().subscribe();
        http
          .expectOne(
            (req) => req.method === (operation === 'create' ? 'POST' : 'PUT')
          )
          .flush(entry);
        expect(storage.load(localStorageKeys.userHistoryBookmarks)).toBeNull();
        expect(
          storage.load(
            type === 'note'
              ? localStorageKeys.personalTagsNotes
              : localStorageKeys.personalTagsBookmarks
          )
        ).toBeNull();
        expect(storage.load(localStorageKeys.userInfoOidc)).toBeTrue();
        expect(
          storage.load(localStorageKeys.userLocalStorageConsent)
        ).toBeTrue();
      });
    }
  }
});

