import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MarkdownService } from '../../../core/markdown/markdown.service';

export interface NotePreviewDialogData {
  title: string;
  content: string;
  contentType?: 'markdown' | 'notebook';
  notebookContent?: string;
}

@Component({
  selector: 'app-note-preview-dialog',
  templateUrl: './note-preview-dialog.component.html',
  styleUrls: ['./note-preview-dialog.component.scss'],
})
export class NotePreviewDialogComponent implements OnInit {
  dialogTitle: string;
  renderedContent: string;
  isNotebook = false;
  notebookJson = '';

  constructor(
    private dialogRef: MatDialogRef<NotePreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: NotePreviewDialogData,
    private markdownService: MarkdownService
  ) {}

  ngOnInit(): void {
    this.dialogTitle = this.data.title || 'Preview';
    this.isNotebook = this.data.contentType === 'notebook' && !!this.data.notebookContent;

    if (this.isNotebook) {
      this.notebookJson = this.data.notebookContent || '';
    } else {
      this.renderedContent =
        this.markdownService.toHtml(this.data.content) ||
        '<p class="text-muted"><em>No content to preview.</em></p>';
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
