import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Bookmark } from '../model/bookmark';
import { Note } from '../model/note';

@Injectable()
export class NotifyStoresService {
  private bookmarkDeleteSource = new Subject<Bookmark>();
  private noteDeleteSource = new Subject<Note>();

  bookmarkDeleted$ = this.bookmarkDeleteSource.asObservable();
  noteDeleted$ = this.noteDeleteSource.asObservable();

  deleteBookmark(bookmark: Bookmark) {
    this.bookmarkDeleteSource.next(bookmark);
  }

  deleteNote(note: Note) {
    this.noteDeleteSource.next(note);
  }
}
