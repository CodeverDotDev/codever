import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { UserDataResource } from '../../../core/model/user-data-resource.type';
import { AddToHistoryService } from '../../../core/user/add-to-history.service';
import { FormsModule } from '@angular/forms';
import { CdkScrollable } from '@angular/cdk/scrolling';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelContent,
} from '@angular/material/expansion';
import { RouterLink } from '@angular/router';
import { NoteContentComponent } from '../../note-details/note-card-body/note-content.component';
import { BookmarkTextComponent } from '../../bookmark-text/bookmark-text.component';
import { AsyncPipe, SlicePipe, DatePipe } from '@angular/common';
import { HighLightHtmlPipe } from '../../pipe/highlight.no-html-tags.pipe';
import { ResourceTitleFilterPipe } from '../../pipe/resource-title-filter.pipe';

@Component({
  selector: 'app-hotkeys-dialog',
  templateUrl: './hot-keys-dialog.component.html',
  styleUrls: ['./hot-keys-dialog.component.scss'],
  imports: [
    MatDialogTitle,
    FormsModule,
    CdkScrollable,
    MatDialogContent,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    RouterLink,
    MatDialogClose,
    MatExpansionPanelContent,
    NoteContentComponent,
    BookmarkTextComponent,
    AsyncPipe,
    SlicePipe,
    DatePipe,
    HighLightHtmlPipe,
    ResourceTitleFilterPipe,
  ],
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
    this.userDataResources$ = data.resources$;
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
