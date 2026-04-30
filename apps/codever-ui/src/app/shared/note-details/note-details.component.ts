import { Component, HostListener, Input, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-note-details',
  templateUrl: './note-details.component.html',
  styleUrls: ['./note-details.component.scss'],
})
export class NoteDetailsComponent implements OnInit {
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

  constructor(
    private personalNotesService: PersonalNotesService,
    private userInfoStore: UserInfoStore,
    private route: ActivatedRoute,
    private router: Router,
    private noteShareDialog: MatDialog,
    private keycloakService: KeycloakService
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

  editNote(note: Note) {
    const link = [`/my-notes/${note._id}/edit`];
    this.router.navigate(link, { state: { note: note } });
  }

  cloneNote(note: Note) {
    const link = [`/my-notes/${note._id}/clone`];
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

  toggleFullScreen(part: HTMLElement) {
    if (screenfull.isEnabled) {
      this.isFullScreen = !this.isFullScreen;
      screenfull.toggle(part);
    }
  }

  @HostListener('document:fullscreenchange', ['$event'])
  fullscreenChangeHandler(event: Event) {
    this.isFullScreen = !!document.fullscreenElement;
  }
}
