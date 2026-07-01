import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { Note } from '../../core/model/note';
import { PublicNotesService } from './public-notes.service';
import { KeycloakService } from 'keycloak-angular';
import { UserDataStore } from '../../core/user/userdata.store';

@Component({
  selector: 'app-public-note-details',
  templateUrl: './public-note-details.component.html',
})
export class PublicNoteDetailsComponent implements OnInit {
  note$: Observable<Note>;

  private userIsLoggedIn = false;

  constructor(
    private route: ActivatedRoute,
    private publicNotesService: PublicNotesService,
    private keycloakService: KeycloakService,
    private userDataStore: UserDataStore
  ) {}

  ngOnInit() {
    this.keycloakService.isLoggedIn().then((isLoggedIn) => {
      this.userIsLoggedIn = isLoggedIn;
    });

    this.note$ = this.route.paramMap.pipe(
      switchMap((params) => {
        return this.publicNotesService.getPublicNoteById(params.get('id'));
      }),
      tap((note) => this.promoteNoteInHistory(note))
    );
  }

  /** Record the visited public note in the user's history (logged-in users only). */
  private promoteNoteInHistory(note: Note): void {
    if (this.userIsLoggedIn && note) {
      note.type = 'note';
      this.userDataStore.updateUserDataHistory$(note).subscribe();
    }
  }
}

