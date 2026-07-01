import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  ViewChild,
} from '@angular/core';
import * as screenfull from 'screenfull';
import { Note } from '../../../core/model/note';
import { PersonalNotesService } from '../../../core/personal-notes.service';

@Component({
  selector: 'app-note-content',
  templateUrl: './note-content.component.html',
})
export class NoteContentComponent implements AfterViewInit, AfterViewChecked {
  @Input()
  note: Note;

  @Input()
  queryText: string;

  @Input()
  partOfList = false;

  @Input()
  isFullScreen = false;

  @Input()
  contentFontSize = 100;

  // When true (owner viewing their own note), task-list checkboxes can be
  // toggled inline and the change is persisted; otherwise they are read-only.
  @Input()
  editable = false;

  // Expose `editable` as a host class so global CSS can hide the reset button
  // (and any other owner-only affordances) on read-only/public notes.
  @HostBinding('class.note-content-editable')
  get isEditableHost(): boolean {
    return this.editable;
  }

  show = false; // add one more property
  public showMoreText = false;

  @ViewChild('noteContentDiv', { static: false }) elementView: ElementRef;
  public viewHeight: number;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private personalNotesService: PersonalNotesService
  ) {}

  /**
   * Intercept clicks on rendered GFM task-list checkboxes so a user can
   * check/uncheck a todo item without opening the editor.
   *
   * We always `preventDefault()` so the markdown source remains the single
   * source of truth (the checkbox state comes from re-rendering the content).
   * Only owners (`editable`) get the toggle persisted.
   */
  @HostListener('click', ['$event'])
  onContentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Ensure links inside the rendered markdown open in a new tab. Resolve the
    // nearest anchor with `closest('a')` so clicks landing on inline children
    // (emoji, bold text, inline code) are handled too. Setting the attributes
    // during the click event takes effect before the browser performs the
    // default navigation, so this works even if `target` was missing/stripped
    // after markdown rendering or HTML sanitization.
    const anchor =
      target && typeof target.closest === 'function'
        ? (target.closest('a') as HTMLAnchorElement | null)
        : null;
    if (anchor) {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
      return;
    }

    // "Reset" button rendered after a checklist — uncheck every item in it.
    if (
      target instanceof HTMLButtonElement &&
      target.classList.contains('note-task-reset')
    ) {
      event.preventDefault();
      if (!this.editable || !this.note) {
        return;
      }
      const start = Number(target.dataset.taskStart);
      const end = Number(target.dataset.taskEnd);
      if (Number.isNaN(start) || Number.isNaN(end)) {
        return;
      }
      this.resetTasksInRange(start, end);
      return;
    }

    if (
      !(target instanceof HTMLInputElement) ||
      target.type !== 'checkbox' ||
      !target.classList.contains('note-task-checkbox')
    ) {
      return;
    }

    // Keep the checkbox read-only by default; state is driven by the markdown.
    event.preventDefault();

    if (!this.editable || !this.note) {
      return;
    }

    const container: HTMLElement | undefined =
      this.elementView?.nativeElement;
    if (!container) {
      return;
    }

    const checkboxes = Array.from(
      container.querySelectorAll<HTMLInputElement>('input.note-task-checkbox')
    );
    const index = checkboxes.indexOf(target);
    if (index < 0) {
      return;
    }

    this.toggleTaskAtIndex(index);
  }

  /**
   * Flip the Nth `- [ ]` / `- [x]` marker in the note's markdown content,
   * update the UI optimistically, and persist. Reverts on error.
   */
  private toggleTaskAtIndex(index: number): void {
    this.persistContentChange(flipTaskMarker(this.note.content, index));
  }

  /**
   * Uncheck every task marker whose (document-order) index falls in
   * `[start, end)` — i.e. all items belonging to one checklist — then persist.
   */
  private resetTasksInRange(start: number, end: number): void {
    this.persistContentChange(resetTaskMarkers(this.note.content, start, end));
  }

  /**
   * Apply a new markdown `content` optimistically (re-renders checkboxes from
   * the source of truth) and persist it, reverting the UI on failure.
   */
  private persistContentChange(updatedContent: string): void {
    const previousContent = this.note.content;
    if (updatedContent === previousContent) {
      return;
    }

    this.note.content = updatedContent;
    this.changeDetectorRef.detectChanges();

    this.personalNotesService.updateNote(this.note).subscribe({
      error: () => {
        // Revert on failure
        this.note.content = previousContent;
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  ngAfterViewInit(): void {
    this.viewHeight = this.elementView.nativeElement.offsetHeight;
    console.log('viewHeight: ' + this.viewHeight);
  }

  readonly maxNoteHeightInList = 200;

  ngAfterViewChecked(): void {
    const show = this.viewHeight > this.maxNoteHeightInList;
    if (show !== this.show) {
      // check if it change, tell CD update view
      this.show = show;
      this.changeDetectorRef.detectChanges();
    }
  }
}

/**
 * Toggle the checked state of the Nth GFM task-list marker in a markdown string.
 *
 * Matches list-item task markers (`- [ ]`, `* [x]`, `1. [ ]`, …) in document
 * order — the same order `marked` renders them — so `index` maps 1:1 to the
 * clicked checkbox. Returns the original string unchanged if `index` is out of
 * range, so callers can short-circuit when nothing changed.
 */
export function flipTaskMarker(content: string, index: number): string {
  if (!content) {
    return content;
  }

  let count = -1;
  return content.replace(
    /^(\s*(?:[-*+]|\d+\.)\s+)\[([ xX])]/gm,
    (match, prefix: string, state: string) => {
      count++;
      if (count !== index) {
        return match;
      }
      const newState = state === ' ' ? 'x' : ' ';
      return `${prefix}[${newState}]`;
    }
  );
}

/**
 * Uncheck (`[x]`/`[X]` → `[ ]`) every GFM task-list marker whose document-order
 * index falls within `[start, end)`. Used by a checklist's "Reset" button to
 * clear exactly the items belonging to that list. Already-unchecked items and
 * markers outside the range are left untouched; returns the original string
 * unchanged when nothing was modified so callers can short-circuit.
 */
export function resetTaskMarkers(
  content: string,
  start: number,
  end: number
): string {
  if (!content) {
    return content;
  }

  let count = -1;
  return content.replace(
    /^(\s*(?:[-*+]|\d+\.)\s+)\[([ xX])]/gm,
    (match, prefix: string) => {
      count++;
      if (count < start || count >= end) {
        return match;
      }
      return `${prefix}[ ]`;
    }
  );
}

