import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { UserDataResource } from '../../../core/model/user-data-resource.type';
import { AddToHistoryService } from '../../../core/user/add-to-history.service';

@Component({
  selector: 'app-hotkeys-dialog',
  templateUrl: './hot-keys-dialog.component.html',
  styleUrls: ['./hot-keys-dialog.component.scss'],
})
export class HotKeysDialogComponent {
  userDataResources$: Observable<UserDataResource[]>;
  title: string;
  filterText: '';

  constructor(
    private dialogRef: MatDialogRef<HotKeysDialogComponent>,
    public addToHistoryService: AddToHistoryService,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.userDataResources$ = data.bookmarks$;
    this.title = data.title;
  }

  isNote(resource: UserDataResource): boolean {
    return resource.type === 'note';
  }

  noteDetailsLink(resource: UserDataResource): string {
    return resource.public
      ? `/notes/${resource._id}/details`
      : `/my-notes/${resource._id}/details`;
  }
}
