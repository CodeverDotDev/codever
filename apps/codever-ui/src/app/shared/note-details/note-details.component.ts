import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
} from '@angular/core';
import { Note } from '../../core/model/note';
import { Observable, of } from 'rxjs';
import { UserInfoStore } from '../../core/user/user-info.store';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { PersonalNotesService } from '../../core/personal-notes.service';
import * as screenfull from 'screenfull';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { NoteSocialShareDialogComponent } from '../dialog/note-social-share-dialog/note-social-share-dialog.component';
import { KeycloakService } from 'keycloak-angular';
import { AddToCollectionDialogComponent } from '../add-to-collection-dialog/add-to-collection-dialog.component';
import { LoginRequiredDialogComponent } from '../dialog/login-required-dialog/login-required-dialog.component';
import { TocHeading } from './note-toc/note-toc.component';

@Component({
  selector: 'app-note-details',
  templateUrl: './note-details.component.html',
  styleUrls: ['./note-details.component.scss'],
})
export class NoteDetailsComponent implements OnInit, AfterViewInit {
  @Input()
  note$: Observable<Note>;

  @Input()
  queryText: string;

  @Input()
  inSearchResults = false;

  @Input()
  partOfList = false;

  userId$: Observable<string> = of(null);
  noteId: string;

  isFullScreen = false;
  markdownCopied = false;
  private fullscreenEl: HTMLElement | null = null;

  readonly ZOOM_STEP = 10;
  readonly ZOOM_MIN = 50;
  readonly ZOOM_MAX = 200;
  readonly ZOOM_DEFAULT = 100;
  contentFontSize = this.ZOOM_DEFAULT;

  tocHeadings: TocHeading[] = [];

  constructor(
    private personalNotesService: PersonalNotesService,
    private userInfoStore: UserInfoStore,
    private route: ActivatedRoute,
    private router: Router,
    private noteShareDialog: MatDialog,
    private keycloakService: KeycloakService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.keycloakService.isLoggedIn().then((isLoggedIn) => {
      this.userId$ = isLoggedIn ? this.userInfoStore.getUserId$() : of(null);

      if (!this.inSearchResults && !this.note$) {
        if (window.history.state.note) {
          this.note$ = of(window.history.state.snippet);
        } else {
          this.note$ = this.userId$.pipe(
            switchMap((userId) => {
              this.noteId = this.route.snapshot.paramMap.get('id');
              return this.personalNotesService.getPersonalNoteById(
                userId,
                this.noteId
              );
            })
          );
        }
      }
    });
  }

  ngAfterViewInit(): void {
    // Headings are rendered via [innerHtml] after the async note$ emits.
    // Defer extraction to let Angular's rendering settle.
    setTimeout(() => this.extractHeadings(), 150);
  }

  /** Scan the rendered markdown content for h1–h4, assign IDs, and build the TOC. */
  extractHeadings(): void {
    const host: HTMLElement = this.elementRef.nativeElement;
    const headingElements = host.querySelectorAll('h1, h2, h3, h4');

    const headings: TocHeading[] = [];
    const usedIds = new Set<string>();

    headingElements.forEach((el: Element) => {
      const htmlEl = el as HTMLElement;
      const level = parseInt(htmlEl.tagName.charAt(1), 10);
      const rawText = htmlEl.textContent?.trim() || '';

      // Generate a stable ID from the text
      let baseId = rawText
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
        .replace(/^-|-$/g, '');
      if (!baseId) {
        baseId = `heading-${headings.length}`;
      }

      // Ensure uniqueness
      let id = baseId;
      let suffix = 0;
      while (usedIds.has(id)) {
        suffix++;
        id = `${baseId}-${suffix}`;
      }
      usedIds.add(id);

      htmlEl.id = id;
      headings.push({ id, text: rawText, level });
    });

    this.tocHeadings = headings;
  }

  editNote(note: Note) {
    const link = [`/my-notes/${note._id}/edit`];
    this.router.navigate(link, { state: { note: note } });
  }

  cloneNote(note: Note) {
    const link = [`/my-notes/${note._id}/clone`];
    this.router.navigate(link, { state: { note: note } });
  }

  copyToMine(note: Note) {
    const link = [`/my-notes/${note._id}/copy-to-mine`];
    this.router.navigate(link, { state: { note: note } });
  }

  shareNoteDialog(note: Note, userId: string) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = true;
    dialogConfig.minWidth = 380;
    dialogConfig.data = {
      note: note,
      userId: userId,
    };

    this.noteShareDialog.open(NoteSocialShareDialogComponent, dialogConfig);
  }

  openAddToCollectionDialog(note: Note, userId: string): void {
    if (!userId) {
      const dialogConfig = new MatDialogConfig();
      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.data = {
        message: 'You need to be logged in to add notes to a collection',
      };
      this.noteShareDialog.open(LoginRequiredDialogComponent, dialogConfig);
    } else {
      const dialogConfig = new MatDialogConfig();
      dialogConfig.width = '420px';
      dialogConfig.data = {
        resourceId: note._id,
        resourceType: 'note',
        userId: userId,
      };
      this.noteShareDialog.open(AddToCollectionDialogComponent, dialogConfig);
    }
  }

  copyNoteMarkdown(note: Note) {
    navigator.clipboard.writeText(note.content || '').then(() => {
      this.markdownCopied = true;
      setTimeout(() => (this.markdownCopied = false), 1300);
    });
  }

  toggleFullScreen(part: HTMLElement) {
    if (screenfull.isEnabled) {
      // Use request/exit instead of toggle() so that clicking fullscreen on this element
      // while a DIFFERENT element (e.g. a snippet) is already fullscreen causes the browser
      // to SWITCH fullscreen to this element rather than simply exiting fullscreen entirely.
      // toggle() internally calls exit() whenever anything is fullscreen, regardless of which element.
      if (this.isFullScreen) {
        screenfull.exit();
        this.fullscreenEl = null;
      } else {
        screenfull.request(part);
        this.fullscreenEl = part;
      }
    }
  }

  @HostListener('document:fullscreenchange', ['$event'])
  fullscreenChangeHandler(event: Event) {
    // Compare against our specific element — !!document.fullscreenElement alone would return true
    // even when a DIFFERENT component's element is the active fullscreen element.
    this.isFullScreen = !!document.fullscreenElement && document.fullscreenElement === this.fullscreenEl;
    if (!document.fullscreenElement) {
      this.fullscreenEl = null;
    }
  }

  zoomIn() {
    this.contentFontSize = Math.min(
      this.contentFontSize + this.ZOOM_STEP,
      this.ZOOM_MAX
    );
  }

  zoomOut() {
    this.contentFontSize = Math.max(
      this.contentFontSize - this.ZOOM_STEP,
      this.ZOOM_MIN
    );
  }

  resetZoom() {
    this.contentFontSize = this.ZOOM_DEFAULT;
  }
}
