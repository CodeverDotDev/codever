import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Bookmark } from '../../core/model/bookmark';

@Component({
  selector: 'app-hotkeys-dialog',
  templateUrl: './hot-keys-dialog.component.html',
  styleUrls: ['./hot-keys-dialog.component.scss']
})
export class HotKeysDialogComponent implements OnInit {

  bookmarks$: Observable<Bookmark[]>;
  title: string;

  constructor(
    private dialogRef: MatDialogRef<HotKeysDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.bookmarks$ = data.bookmarks$;
    this.title = data.title;
  }

  ngOnInit() {
  }

}
