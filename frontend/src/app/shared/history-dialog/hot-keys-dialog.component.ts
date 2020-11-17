import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Bookmark } from '../../core/model/bookmark';
import { AddToHistoryService } from '../../core/user/add-to-history.service';

@Component({
  selector: 'app-hotkeys-dialog',
  templateUrl: './hot-keys-dialog.component.html',
  styleUrls: ['./hot-keys-dialog.component.scss']
})
export class HotKeysDialogComponent implements OnInit {

  bookmarks$: Observable<Bookmark[]>;
  title: string;
  filterText: '';

  constructor(
    private dialogRef: MatDialogRef<HotKeysDialogComponent>,
    public addToHistoryService: AddToHistoryService,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.bookmarks$ = data.bookmarks$;
    this.title = data.title;
  }

  ngOnInit() {
  }

}
