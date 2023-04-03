import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { Snippet } from '../../../core/model/snippet';
import { PersonalSnippetsService } from '../../../core/personal-snippets.service';

@Component({
  selector: 'app-snippet-social-share-dialog',
  templateUrl: './snippet-social-share-dialog.component.html',
  styleUrls: ['./social-share-dialog.component.scss'],
  providers: [DatePipe],
})
export class SnippetSocialShareDialogComponent {
  shareableId$: Observable<any>;
  public snippet: Snippet;
  readonly environment = environment;

  constructor(
    private datePipe: DatePipe,
    private dialogRef: MatDialogRef<SnippetSocialShareDialogComponent>,
    private personalSnippetsService: PersonalSnippetsService,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.snippet = data.snippet;
    this.shareableId$ = this.personalSnippetsService.createOrGetShareableId(
      data.userId,
      this.snippet._id
    );
  }

  close() {
    this.dialogRef.close('SHARE_CANCELED');
  }
}
